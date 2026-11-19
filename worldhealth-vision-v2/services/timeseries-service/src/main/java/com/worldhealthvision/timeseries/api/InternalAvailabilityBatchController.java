package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.dto.AvailabilityBatchRequest;
import com.worldhealthvision.timeseries.api.dto.AvailabilityBatchResponse;
import com.worldhealthvision.timeseries.service.TimeseriesQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Private service-to-service endpoint; not exposed through public Gateway. */
@RestController
@RequestMapping("/internal/timeseries/series")
public class InternalAvailabilityBatchController {
    private final TimeseriesQueryService queryService;

    public InternalAvailabilityBatchController(TimeseriesQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/availability/batch")
    public AvailabilityBatchResponse batch(@Valid @RequestBody AvailabilityBatchRequest request) {
        return queryService.listSeriesAvailabilityBatch(
                request.countryIso3(), request.indicatorCodes(), request.sourceCode(),
                request.datasetCode(), request.periodGranularity(), request.limitPerIndicator()
        );
    }
}
