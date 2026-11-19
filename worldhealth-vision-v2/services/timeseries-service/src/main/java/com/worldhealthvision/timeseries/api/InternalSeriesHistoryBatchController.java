package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.dto.SeriesHistoryBatchRequest;
import com.worldhealthvision.timeseries.api.dto.SeriesHistoryBatchResponse;
import com.worldhealthvision.timeseries.service.TimeseriesQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal read only. Network ACL and service identity are mandatory before production. */
@RestController
@RequestMapping("/internal/timeseries/series")
public class InternalSeriesHistoryBatchController {
    private final TimeseriesQueryService queryService;

    public InternalSeriesHistoryBatchController(TimeseriesQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/history/batch")
    public SeriesHistoryBatchResponse batch(@Valid @RequestBody SeriesHistoryBatchRequest request) {
        return queryService.listSeriesBatch(
                request.countryIso3(), request.indicatorCodes(),
                request.sourceCode(), request.datasetCode(), request.periodGranularity(),
                request.fromPeriodStart(), request.toPeriodStart(),
                request.includeMissing(), request.sortDirection(), request.limitPerIndicator()
        );
    }
}
