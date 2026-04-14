package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionBatchAcceptedResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.TimeseriesIngestionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/timeseries/ingestion")
public class TimeseriesInternalIngestionController {

    private final TimeseriesIngestionService timeseriesIngestionService;

    public TimeseriesInternalIngestionController(TimeseriesIngestionService timeseriesIngestionService) {
        this.timeseriesIngestionService = timeseriesIngestionService;
    }

    @PostMapping("/observation-batches")
    public IngestionBatchAcceptedResponse ingestObservationBatch(
            @Valid @RequestBody IngestionObservationBatchRequest request
    ) {
        return timeseriesIngestionService.ingestObservationBatch(request);
    }
}
