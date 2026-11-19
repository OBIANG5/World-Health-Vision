package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.dto.LatestSourceBatchRequest;
import com.worldhealthvision.timeseries.api.dto.LatestSourceBatchResponse;
import com.worldhealthvision.timeseries.service.TimeseriesQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Isolated service-to-service POST. NOT a public Gateway route.
 * Actual service authentication and network ACL are deployment requirements.
 */
@RestController
@RequestMapping("/internal/timeseries/series")
public class InternalTimeseriesBatchReadController {
    private final TimeseriesQueryService queryService;

    public InternalTimeseriesBatchReadController(TimeseriesQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/latest/batch")
    public LatestSourceBatchResponse batchLatest(@Valid @RequestBody LatestSourceBatchRequest request) {
        return queryService.listLatestBySourceBatch(
                request.countryIso3(), request.indicatorCodes(),
                request.sourceCode(), request.datasetCode(),
                request.periodGranularity(), request.includeMissing()
        );
    }
}
