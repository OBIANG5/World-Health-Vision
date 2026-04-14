package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionBatchAcceptedResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import com.worldhealthvision.timeseries.persistence.TimeseriesRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TimeseriesIngestionService {

    private final TimeseriesRepository timeseriesRepository;

    public TimeseriesIngestionService(TimeseriesRepository timeseriesRepository) {
        this.timeseriesRepository = timeseriesRepository;
    }

    @Transactional
    public IngestionBatchAcceptedResponse ingestObservationBatch(IngestionObservationBatchRequest request) {
        IngestionObservationBatchRequest normalizedRequest = normalize(request);
        UUID sourceRunId = timeseriesRepository.upsertSourceRun(normalizedRequest);
        int upsertedCount = timeseriesRepository.upsertObservations(sourceRunId, normalizedRequest);

        return new IngestionBatchAcceptedResponse(sourceRunId, normalizedRequest.items().size(), upsertedCount);
    }

    private IngestionObservationBatchRequest normalize(IngestionObservationBatchRequest request) {
        List<IngestionObservationWriteRequest> normalizedItems = request.items().stream()
                .map(this::normalizeObservation)
                .toList();

        return new IngestionObservationBatchRequest(
                normalizeCode(request.sourceCode()),
                normalizeCode(request.datasetCode()),
                request.runKey().trim(),
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
                item.periodStart(),
                item.periodEnd(),
                item.periodLabel().trim(),
                item.numericValue(),
                blankToNull(item.textValue()),
                normalizeCode(item.valueStatus()),
                item.sourcePublishedAt(),
                item.sourceMetadata() == null ? Map.of() : item.sourceMetadata(),
                item.qualityFlags() == null ? List.of() : item.qualityFlags()
        );
    }

    private String normalizeCode(String value) {
        return value.trim().toUpperCase();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
