package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.dto.SeriesBatchRequest;
import com.worldhealthvision.timeseries.api.dto.SeriesBatchResponse;
import com.worldhealthvision.timeseries.service.TimeseriesQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal only. Public Gateway has no matching POST route. */
@RestController
@RequestMapping("/internal/timeseries/series")
public class InternalHistoricalSeriesBatchController {
    private final TimeseriesQueryService queryService;

    public InternalHistoricalSeriesBatchController(TimeseriesQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/history/batch")
    public SeriesBatchResponse batchHistory(@Valid @RequestBody SeriesBatchRequest request) {
        return queryService.listSeriesBatch(
                request.countryIso3(), request.indicatorCodes(),
                request.sourceCode(), request.datasetCode(), request.periodGranularity(),
                request.fromPeriodStart(), request.toPeriodStart(), request.includeMissing(),
                request.sortDirection(), request.limitPerIndicator()
        );
    }
}
