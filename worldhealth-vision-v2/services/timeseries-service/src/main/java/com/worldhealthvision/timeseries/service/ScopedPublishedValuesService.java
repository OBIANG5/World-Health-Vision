package com.worldhealthvision.timeseries.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.dto.ScopedPublishedValueResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

/**
 * Separate and explicitly SCOPED public read, never a national comparison.
 * Every response requires independent Ed25519 rights + geography signatures
 * and READ-TIME verification of the signed original Bronze witness against
 * ALL current physical observations (including methods and numeric values).
 * NO Insee or other institutional approvals are seeded.
 */
@Service
public final class ScopedPublishedValuesService {
    private static final String QUERY = """
            select o.id as obs_id, o.source_run_id, o.source_code, o.dataset_code,
                   o.indicator_code, o.country_iso3, o.period_start, o.period_end,
                   o.period_label, o.numeric_value, o.value_status,
                   sr.fetched_at_utc, gs.native_geo_code, gs.native_geo_version,
                   gs.geo_reference_year, gs.display_label, gs.coverage_kind,
                   gs.source_metadata_url,
                   gs.territorial_exclusions::text as exclusions_json,
                   row_to_json(rd)::text as rights_json,
                   row_to_json(gd)::text as geo_json
            from timeseries.observation o
            join timeseries.source_run sr on sr.id = o.source_run_id
            join timeseries.geographic_scope_registry gs
              on gs.id = o.geographic_scope_id
            join timeseries.scoped_publication_decision gd
              on gd.geographic_scope_id = gs.id
             and gd.source_run_id = sr.id
             and gd.source_code = o.source_code
             and gd.dataset_code = o.dataset_code
             and gd.indicator_code = o.indicator_code
             and gd.scope_country_iso3 = o.country_iso3
             and gd.scope_native_code = gs.native_geo_code
             and gd.scope_native_version = gs.native_geo_version
             and gd.scope_coverage_kind = gs.coverage_kind
             and gd.scope_metadata_label = gs.display_label
             and gd.scope_metadata_url = gs.source_metadata_url
             and gd.source_metadata_sha256 = gs.source_metadata_sha256
             and gd.original_http_sha256 = sr.notes ->> 'httpBodySha256'
             and gd.attested_items_sha256 = sr.attested_items_sha256
             and gd.methodology_code = o.source_metadata ->> 'methodologyCode'
             and gd.unit_code = o.source_metadata ->> 'unitCode'
             and gd.period_start <= o.period_start
             and gd.period_end >= o.period_end
             and gd.valid_from_utc <= statement_timestamp()
             and gd.valid_until_utc > statement_timestamp()
             and gd.operation = 'PUBLIC_SCOPED_WEB_DISPLAY'
            join timeseries.source_run_rights_decision linked
              on linked.source_run_id = sr.id
            join timeseries.rights_decision rd
              on rd.decision_id = linked.decision_id
             and rd.source_code = o.source_code
             and rd.dataset_code = o.dataset_code
             and rd.country_iso3 = o.country_iso3
             and rd.indicator_code = o.indicator_code
             and rd.operation = 'PUBLIC_API_INGEST'
             and rd.original_http_sha256 = sr.notes ->> 'httpBodySha256'
             and rd.period_start <= o.period_start
             and rd.period_end >= o.period_end
             and rd.valid_from_utc <= statement_timestamp()
             and rd.valid_until_utc > statement_timestamp()
            where o.country_iso3 = :country
              and (cast(:indicator as varchar) is null or o.indicator_code = :indicator)
              and o.value_status in ('OBSERVED','ESTIMATED')
              and o.numeric_value is not null
              and o.geographic_scope_id is not null
              and gs.country_iso3 = o.country_iso3
              and gs.review_status = 'RESEARCH_ONLY'
              and gs.coverage_kind in ('PARTIAL_COUNTRY','SUBNATIONAL')
              and sr.evidence_attestation_sha256 is not null
              and sr.attested_items_sha256 is not null
              and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256'
                    = sr.attested_items_sha256
              and not exists (
                  select 1 from timeseries.scoped_publication_revocation revoked
                  where revoked.decision_id = gd.decision_id
              )
              and not exists (
                  select 1 from timeseries.rights_revocation revoked
                  where revoked.decision_id = rd.decision_id
              )
              and not exists (
                  select 1 from timeseries.geographic_dataset_policy hold
                  where hold.dataset_code = o.dataset_code
                    and hold.source_code in ('*',o.source_code)
                    and hold.policy = 'SCOPE_REVIEW_HOLD'
              )
            order by o.period_start desc, o.indicator_code, o.source_code, o.id
            limit :rowLimit
            """;

    private final JdbcClient db;
    private final ObjectMapper mapper;
    private final EvidenceItemsFingerprint itemsFingerprint;
    private final EvidenceAttestationVerifier bronzeVerifier;
    private final RightsSignatureVerifier rightsVerifier;
    private final ScopedPublicationSignatureVerifier geoVerifier;

    public ScopedPublishedValuesService(JdbcClient db, ObjectMapper mapper,
            EvidenceItemsFingerprint itemsFingerprint, EvidenceAttestationVerifier bronzeVerifier,
            RightsSignatureVerifier rightsVerifier, ScopedPublicationSignatureVerifier geoVerifier) {
        this.db = db;
        this.mapper = mapper;
        this.itemsFingerprint = itemsFingerprint;
        this.bronzeVerifier = bronzeVerifier;
        this.rightsVerifier = rightsVerifier;
        this.geoVerifier = geoVerifier;
    }

    private record Row(UUID obsId, UUID runId, ScopedPublishedValueResponse value,
                       SignedRightsDecision rights, SignedScopedPublicationDecision scope) {}

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<ScopedPublishedValueResponse> list(String country, String indicator, int limit) {
        if (country == null || !country.matches("[A-Z]{3}")
                || (indicator != null && !indicator.matches("[A-Z0-9._-]{1,64}"))
                || limit < 1 || limit > 50)
            throw new IllegalArgumentException("Invalid bounded scoped read");
        if (!geoVerifier.isConfigured()) throw new ScopedPublicationAuthorizationException();
        List<Row> rows = db.sql(QUERY).param("country", country)
                .param("indicator", indicator).param("rowLimit", limit + 1)
                .query((rs,n) -> {
                    SignedRightsDecision rights = mapRights(parse(rs.getString("rights_json")));
                    SignedScopedPublicationDecision geo = mapScope(parse(rs.getString("geo_json")));
                    Double numeric = rs.getObject("numeric_value",Double.class);
                    if (numeric == null || !Double.isFinite(numeric))
                        throw new ScopedPublicationAuthorizationException();
                    var body = new ScopedPublishedValueResponse(
                            rs.getString("source_code"),rs.getString("dataset_code"),
                            rs.getString("indicator_code"),rs.getString("country_iso3").trim(),
                            rs.getString("native_geo_code"),rs.getString("native_geo_version"),
                            rs.getObject("geo_reference_year",Integer.class),
                            rs.getString("display_label"),rs.getString("coverage_kind"),
                            strings(rs.getString("exclusions_json"),32),
                            rs.getObject("period_start",LocalDate.class),
                            rs.getObject("period_end",LocalDate.class),
                            rs.getString("period_label"),numeric,
                            rs.getString("value_status"),
                            geo.methodologyCode(),geo.unitCode(),
                            rights.attributionText(),geo.scopeMetadataUrl(),
                            rs.getObject("fetched_at_utc",OffsetDateTime.class),
                            "SOURCE_SCOPED_NOT_COUNTRY_EQUIVALENT"
                    );
                    return new Row(rs.getObject("obs_id",UUID.class),
                            rs.getObject("source_run_id",UUID.class),body,rights,geo);
                }).list();
        if (rows.size() > limit) throw new ScopedPublicationAuthorizationException();
        Set<UUID> unique = new HashSet<>();
        Set<UUID> witnessed = new HashSet<>();
        List<ScopedPublishedValueResponse> accepted = new ArrayList<>();
        for (Row row : rows) {
            if (!unique.add(row.obsId())) throw new ScopedPublicationAuthorizationException();
            rightsVerifier.requireAuthentic(row.rights());
            geoVerifier.requireAuthentic(row.scope());
            if (witnessed.add(row.runId())) verifyStoredWitness(row.runId());
            if (!stillValid(row)) throw new ScopedPublicationAuthorizationException();
            accepted.add(row.value());
        }
        return List.copyOf(accepted);
    }

    /** Fresh read after cryptographic verification, with no caching. */
    private boolean stillValid(Row row) {
        Integer live = db.sql("""
                select count(*) from timeseries.scoped_publication_decision gd
                join timeseries.rights_decision rd on rd.decision_id=:rightsId
                where gd.decision_id=:geoId
                  and gd.valid_from_utc <= clock_timestamp()
                  and gd.valid_until_utc > clock_timestamp()
                  and rd.valid_from_utc <= clock_timestamp()
                  and rd.valid_until_utc > clock_timestamp()
                  and not exists (select 1 from timeseries.scoped_publication_revocation v
                                  where v.decision_id=gd.decision_id)
                  and not exists (select 1 from timeseries.rights_revocation v
                                  where v.decision_id=rd.decision_id)
                """).param("rightsId",row.rights().id())
                .param("geoId",row.scope().decisionId())
                .query(Integer.class).single();
        return live != null && live == 1;
    }

    private void verifyStoredWitness(UUID runId) {
        var run = db.sql("""
                select source_code,dataset_code,run_key,fetched_at_utc,
                       bronze_raw_payload_path,bronze_normalized_payload_path,
                       record_count,notes::text as notes_json,
                       attested_items_sha256,evidence_attestation_sha256
                from timeseries.source_run where id=:runId
                """).param("runId",runId).query((rs,n) -> new StoredRun(
                        rs.getString("source_code"),rs.getString("dataset_code"),
                        rs.getString("run_key"),rs.getObject("fetched_at_utc",OffsetDateTime.class),
                        rs.getString("bronze_raw_payload_path"),
                        rs.getString("bronze_normalized_payload_path"),
                        rs.getInt("record_count"),map(rs.getString("notes_json")),
                        rs.getString("attested_items_sha256"),
                        rs.getString("evidence_attestation_sha256")
                )).optional().orElseThrow(ScopedPublicationAuthorizationException::new);
        if (run.recordCount()<1 || run.recordCount()>256
                || run.itemSha()==null || run.evidenceSha()==null)
            throw new ScopedPublicationAuthorizationException();
        List<IngestionObservationWriteRequest> items = db.sql("""
                select indicator_code,country_iso3,period_granularity,
                       period_start,period_end,period_label,numeric_value,
                       text_value,value_status,source_published_at,
                       source_metadata::text as metadata_json,
                       quality_flags::text as flags_json
                from timeseries.observation
                where source_run_id=:runId
                order by indicator_code,country_iso3,period_start,id
                limit 257
                """).param("runId",runId)
                .query((rs,n)->new IngestionObservationWriteRequest(
                        rs.getString("indicator_code"),rs.getString("country_iso3").trim(),
                        rs.getString("period_granularity"),
                        rs.getObject("period_start",LocalDate.class),
                        rs.getObject("period_end",LocalDate.class),
                        rs.getString("period_label"),
                        rs.getObject("numeric_value",Double.class),
                        rs.getString("text_value"),rs.getString("value_status"),
                        rs.getObject("source_published_at",OffsetDateTime.class),
                        map(rs.getString("metadata_json")),
                        strings(rs.getString("flags_json"),256)
                )).list();
        if (items.size()!=run.recordCount()) throw new ScopedPublicationAuthorizationException();
        var request = new IngestionObservationBatchRequest(
                run.sourceCode(),run.datasetCode(),run.runKey(),run.fetchedAtUtc(),
                run.rawPath(),run.normalizedPath(),run.recordCount(),run.notes(),items);
        if (!run.itemSha().equals(itemsFingerprint.calculate(request)))
            throw new ScopedPublicationAuthorizationException();
        var witness=bronzeVerifier.requireStoredSourceProof(request);
        if (!run.evidenceSha().equals(witness.signedPayloadSha256())
                || !run.itemSha().equals(witness.itemsSha256()))
            throw new ScopedPublicationAuthorizationException();
    }

    private record StoredRun(String sourceCode,String datasetCode,String runKey,
            OffsetDateTime fetchedAtUtc,String rawPath,String normalizedPath,
            int recordCount,Map<String,Object> notes,String itemSha,String evidenceSha) {}

    private JsonNode parse(String raw) {
        try {
            JsonNode n=mapper.readTree(raw);
            if (n==null || !n.isObject()) throw new IllegalArgumentException();
            return n;
        } catch(Exception ex) { throw new ScopedPublicationAuthorizationException(); }
    }
    private Map<String,Object> map(String raw) {
        try {
            Map<String,Object> m=mapper.readValue(raw,new TypeReference<Map<String,Object>>(){});
            if (m==null) throw new IllegalArgumentException();
            return m;
        } catch(Exception ex) { throw new ScopedPublicationAuthorizationException(); }
    }
    private List<String> strings(String raw,int limit) {
        try {
            JsonNode n=mapper.readTree(raw);
            if (!n.isArray() || n.size()>limit) throw new IllegalArgumentException();
            List<String> out=new ArrayList<>();
            for(JsonNode value:n) {
                if (!value.isTextual() || value.asText().length()>256)
                    throw new IllegalArgumentException();
                out.add(value.asText());
            }
            return List.copyOf(out);
        } catch(Exception ex) { throw new ScopedPublicationAuthorizationException(); }
    }
    private String v(JsonNode n,String key) {
        JsonNode field=n.get(key);
        if(field==null || !field.isTextual() || field.asText().length()>1024)
            throw new ScopedPublicationAuthorizationException();
        return field.asText();
    }
    private UUID uuid(JsonNode n,String key) { return UUID.fromString(v(n,key)); }
    private LocalDate date(JsonNode n,String key) { return LocalDate.parse(v(n,key)); }
    private OffsetDateTime time(JsonNode n,String key) { return OffsetDateTime.parse(v(n,key)); }

    private SignedRightsDecision mapRights(JsonNode n) {
        return new SignedRightsDecision(
                uuid(n,"decision_id"),v(n,"source_code"),v(n,"dataset_code"),
                v(n,"country_iso3").trim(),v(n,"indicator_code"),
                v(n,"operation"),v(n,"original_http_sha256"),
                date(n,"period_start"),date(n,"period_end"),
                time(n,"valid_from_utc"),time(n,"valid_until_utc"),
                time(n,"issued_at_utc"),v(n,"reviewer_id"),v(n,"countersigner_id"),
                v(n,"license_identifier"),v(n,"license_url"),
                v(n,"license_text_sha256"),v(n,"attribution_text"),
                v(n,"signing_public_key_sha256"),v(n,"signature_base64"));
    }
    private SignedScopedPublicationDecision mapScope(JsonNode n) {
        return new SignedScopedPublicationDecision(
                uuid(n,"decision_id"),uuid(n,"geographic_scope_id"),
                uuid(n,"source_run_id"),v(n,"attested_items_sha256"),
                v(n,"source_code"),v(n,"dataset_code"),v(n,"indicator_code"),
                v(n,"operation"),v(n,"original_http_sha256"),
                v(n,"source_metadata_sha256"),v(n,"methodology_code"),
                v(n,"unit_code"),date(n,"period_start"),date(n,"period_end"),
                time(n,"valid_from_utc"),time(n,"valid_until_utc"),
                time(n,"issued_at_utc"),v(n,"reviewer_id"),v(n,"countersigner_id"),
                v(n,"scope_metadata_label"),v(n,"scope_metadata_url"),
                v(n,"scope_native_code"),v(n,"scope_native_version"),
                v(n,"scope_country_iso3").trim(),v(n,"scope_coverage_kind"),
                v(n,"signing_public_key_sha256"),v(n,"signature_base64"));
    }
}
