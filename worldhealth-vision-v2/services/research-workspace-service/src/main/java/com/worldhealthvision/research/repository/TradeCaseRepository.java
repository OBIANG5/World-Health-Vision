package com.worldhealthvision.research.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.research.api.TradeCaseModels.CaseSummary;
import com.worldhealthvision.research.api.TradeCaseModels.CaseView;
import com.worldhealthvision.research.api.TradeCaseModels.RevisionView;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Every query scopes by BOTH authenticated issuer and subject.
 * IDs from a URL are NEVER used as principal identities.
 * Revisions are immutable; destructive deletion is explicitly requested.
 */
@Repository
public class TradeCaseRepository {
    public record Owner(String issuer, String subject) {}

    private static final int MAX_CASES = 30;
    private static final long MAX_VERSIONS = 200;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public TradeCaseRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public List<CaseSummary> list(Owner owner) {
        return jdbc.query("""
                SELECT id, title, version, created_at, updated_at
                FROM trading_private.trade_case
                WHERE principal_issuer = ? AND principal_subject = ?
                ORDER BY updated_at DESC, id
                LIMIT 30
                """,
            (rs, row) -> new CaseSummary((UUID) rs.getObject("id"), rs.getString("title"),
                rs.getLong("version"), instant(rs, "created_at"), instant(rs, "updated_at")),
            owner.issuer(), owner.subject());
    }

    public Optional<CaseView> find(Owner owner, UUID id) {
        return jdbc.query("""
                SELECT id, title, plan::text AS plan_json, version, created_at, updated_at
                FROM trading_private.trade_case
                WHERE principal_issuer = ? AND principal_subject = ? AND id = ?
                """, (rs, row) -> caseView(rs), owner.issuer(), owner.subject(), id)
            .stream().findFirst();
    }

    public List<RevisionView> history(Owner owner, UUID id) {
        // Query as a join scoped by owner, not a bare revision lookup by case ID.
        return jdbc.query("""
                SELECT r.version, r.title, r.plan::text AS plan_json, r.saved_at
                FROM trading_private.trade_case_revision r
                JOIN trading_private.trade_case c ON c.id = r.case_id
                WHERE c.id = ? AND c.principal_issuer = ? AND c.principal_subject = ?
                ORDER BY r.version DESC LIMIT 200
                """, (rs, row) -> new RevisionView(rs.getLong("version"),
                    rs.getString("title"), json(rs.getString("plan_json")), instant(rs, "saved_at")),
            id, owner.issuer(), owner.subject());
    }

    @Transactional
    public CaseView create(Owner owner, String title, String planJson) {
        // PostgreSQL advisory lock serializes per-user creates to enforce quota.
        // UUID collisions are still protected by the PK, and no eviction occurs.
        jdbc.execute((ConnectionCallback<Void>) connection -> {
            try (PreparedStatement statement = connection.prepareStatement(
                "SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
                statement.setString(1, owner.issuer() + ":" + owner.subject());
                statement.execute();
            }
            return null;
        });
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM trading_private.trade_case
                WHERE principal_issuer = ? AND principal_subject = ?
                """, Integer.class, owner.issuer(), owner.subject());
        if (count == null || count >= MAX_CASES) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Research-case quota reached");
        }
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO trading_private.trade_case(
                    id, principal_issuer, principal_subject, title, plan, version
                ) VALUES (?, ?, ?, ?, CAST(? AS jsonb), 1)
                """, id, owner.issuer(), owner.subject(), title, planJson);
        appendRevision(id, 1, title, planJson);
        return ownedOr404(owner, id);
    }

    @Transactional
    public CaseView update(Owner owner, UUID id, long expectedVersion, String title, String planJson) {
        if (expectedVersion >= MAX_VERSIONS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Research-case revision limit reached");
        }
        int updated = jdbc.update("""
                UPDATE trading_private.trade_case
                SET title = ?, plan = CAST(? AS jsonb), version = version + 1, updated_at = now()
                WHERE id = ? AND principal_issuer = ? AND principal_subject = ? AND version = ?
                """, title, planJson, id, owner.issuer(), owner.subject(), expectedVersion);
        if (updated == 0) throw notFoundOrStale(owner, id);
        appendRevision(id, expectedVersion + 1, title, planJson);
        return ownedOr404(owner, id);
    }

    @Transactional
    public void delete(Owner owner, UUID id, long expectedVersion) {
        int deleted = jdbc.update("""
                DELETE FROM trading_private.trade_case
                WHERE id = ? AND principal_issuer = ? AND principal_subject = ? AND version = ?
                """, id, owner.issuer(), owner.subject(), expectedVersion);
        if (deleted == 0) throw notFoundOrStale(owner, id);
        // FK cascade removes private revisions as part of the same transaction.
    }

    private CaseView ownedOr404(Owner owner, UUID id) {
        return find(owner, id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Research case not found"));
    }

    private ResponseStatusException notFoundOrStale(Owner owner, UUID id) {
        // Deliberately identical 404 for unknown and other principal's case.
        return find(owner, id).isPresent()
            ? new ResponseStatusException(HttpStatus.PRECONDITION_FAILED, "Stale case version")
            : new ResponseStatusException(HttpStatus.NOT_FOUND, "Research case not found");
    }

    private void appendRevision(UUID id, long version, String title, String planJson) {
        jdbc.update("""
                INSERT INTO trading_private.trade_case_revision(case_id, version, title, plan)
                VALUES (?, ?, ?, CAST(? AS jsonb))
                """, id, version, title, planJson);
    }

    private CaseView caseView(ResultSet rs) throws SQLException {
        return new CaseView((UUID) rs.getObject("id"), rs.getString("title"),
            json(rs.getString("plan_json")), rs.getLong("version"),
            instant(rs, "created_at"), instant(rs, "updated_at"));
    }

    private JsonNode json(String value) {
        try {
            return mapper.readTree(value);
        } catch (JsonProcessingException invalid) {
            // Database JSONB was written by the application and cannot be malformed.
            throw new IllegalStateException("Unexpected invalid stored JSON", invalid);
        }
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        return rs.getTimestamp(column).toInstant();
    }
}
