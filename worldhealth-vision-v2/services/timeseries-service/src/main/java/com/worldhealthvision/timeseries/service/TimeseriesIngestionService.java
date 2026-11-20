package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionBatchAcceptedResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import com.worldhealthvision.timeseries.persistence.SourceRunInsertResult;
import com.worldhealthvision.timeseries.persistence.TimeseriesRepository;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

@Service
public class TimeseriesIngestionService {
    private final TimeseriesRepository timeseriesRepository;
    private final CanonicalIngestionFingerprint fingerprint;
    private final ProtectedSourcePublicationGate rightsGate;
    private final SignedRightsRegistry signedRightsRegistry;

    public TimeseriesIngestionService(
            TimeseriesRepository timeseriesRepository,
            CanonicalIngestionFingerprint fingerprint,
            ProtectedSourcePublicationGate rightsGate,
            SignedRightsRegistry signedRightsRegistry
    ) {
        this.timeseriesRepository = timeseriesRepository;
        this.fingerprint = fingerprint;
        this.rightsGate = rightsGate;
        this.signedRightsRegistry = signedRightsRegistry;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public IngestionBatchAcceptedResponse ingestObservationBatch(IngestionObservationBatchRequest request) {
        IngestionObservationBatchRequest normalizedRequest = normalize(request);
        // Reject private research data before ANY write or SQL transaction
        // resolving a source-run identity. The gate is server-owned, never
        // overridden by user-supplied status flags or a synthetic test note.
        rightsGate.requirePublishable(normalizedRequest);
        // The signed permission is checked under a DB row lock in THIS
        // transaction. Without the server trust anchor or a specific signed
        // grant, even a correctly authenticated producer is DENIED.
        List<java.util.UUID> verifiedDecisions =
                signedRightsRegistry.requireCurrentPublicIngestRights(normalizedRequest);
        String canonicalSha256 = fingerprint.calculate(normalizedRequest);
        SourceRunInsertResult sourceRun = timeseriesRepository.insertSourceRunIfAbsent(
                normalizedRequest, canonicalSha256
        );
        if (!sourceRun.newlyInserted()) {
            signedRightsRegistry.recheckReplay(verifiedDecisions);
            // True idempotency: do not update fetchedAt, source notes, path,
            // persistedAt, observation numeric value or ingestedAt on replay.
            return new IngestionBatchAcceptedResponse(
                    sourceRun.sourceRunId(), normalizedRequest.items().size(), 0
            );
        }
        int insertedCount = timeseriesRepository.upsertObservations(
                sourceRun.sourceRunId(), normalizedRequest
        );
        // Recheck close to COMMIT with fresh READ COMMITTED snapshot, and
        // preserve exactly which signed decisions authorized each new run.
        signedRightsRegistry.recheckAndLink(sourceRun.sourceRunId(), verifiedDecisions);
        return new IngestionBatchAcceptedResponse(
                sourceRun.sourceRunId(), normalizedRequest.items().size(), insertedCount
        );
    }

    private IngestionObservationBatchRequest normalize(IngestionObservationBatchRequest request) {
        List<IngestionObservationWriteRequest> normalizedItems = request.items().stream()
                .map(this::normalizeObservation).toList();
        String runKey = request.runKey().trim();
        if (!runKey.matches("[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}")) {
            throw new IllegalArgumentException("Invalid canonical ingestion run key.");
        }
        return new IngestionObservationBatchRequest(
                normalizeCode(request.sourceCode()),
                normalizeCode(request.datasetCode()),
                runKey,
                request.fetchedAtUtc(),
                blankToNull(request.bronzeRawPayloadPath()),
                blankToNull(request.bronzeNormalizedPayloadPath()),
                request.recordCount(),
                request.notes() == null ? Map.of() : request.notes(),
                normalizedItems
        );
    }

    private IngestionObservationWriteRequest normalizeObservation(IngestionObservationWriteRequest item) {
        return new IngestionObservationWriteRequest(
                normalizeCode(item.indicatorCode()),
                normalizeCode(item.countryIso3()),
                normalizeCode(item.periodGranularity()),
                item.periodStart(), item.periodEnd(),
                item.periodLabel().trim(), item.numericValue(),
                blankToNull(item.textValue()), normalizeCode(item.valueStatus()),
                item.sourcePublishedAt(),
                item.sourceMetadata() == null ? Map.of() : item.sourceMetadata(),
                item.qualityFlags() == null ? List.of() : item.qualityFlags()
        );
    }

    private String normalizeCode(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Missing source, dataset or observation code.");
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("[A-Z0-9][A-Z0-9_.-]{0,95}")) {
            throw new IllegalArgumentException("Invalid canonical source or observation code.");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
