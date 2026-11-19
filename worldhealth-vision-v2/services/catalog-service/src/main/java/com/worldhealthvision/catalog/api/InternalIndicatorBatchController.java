package com.worldhealthvision.catalog.api;

import com.worldhealthvision.catalog.api.dto.CatalogListResponse;
import com.worldhealthvision.catalog.api.dto.IndicatorBatchRequest;
import com.worldhealthvision.catalog.api.dto.IndicatorDetailResponse;
import com.worldhealthvision.catalog.service.CatalogQueryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Service-to-service only, not under /api/catalog/** and not routed by Gateway.
 * Network firewall and service authentication remain deployment obligations.
 */
@RestController
@RequestMapping("/internal/catalog/indicators")
public class InternalIndicatorBatchController {
    private final CatalogQueryService queryService;

    public InternalIndicatorBatchController(CatalogQueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/batch")
    public CatalogListResponse<IndicatorDetailResponse> batch(
            @Valid @RequestBody IndicatorBatchRequest request
    ) {
        return queryService.getIndicatorsBatch(request.codes());
    }
}
