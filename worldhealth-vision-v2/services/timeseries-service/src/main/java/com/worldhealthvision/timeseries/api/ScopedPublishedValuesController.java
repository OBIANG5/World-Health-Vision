package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.dto.ScopedPublishedValueResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesListResponse;
import com.worldhealthvision.timeseries.service.ScopedPublishedValuesService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Locale;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Not the national series endpoint. One SOURCE-NATIVE scope per returned row.
 * Rights + geographic review + unchanged Bronze witness MUST all verify.
 * Every call revalidates current revocations and never caches permission.
 */
@RestController
@Validated
@RequestMapping("/api/timeseries")
public class ScopedPublishedValuesController {
    private final ScopedPublishedValuesService service;

    public ScopedPublishedValuesController(ScopedPublishedValuesService service) {
        this.service = service;
    }

    @GetMapping("/countries/{iso3}/scoped-values")
    public ResponseEntity<TimeseriesListResponse<ScopedPublishedValueResponse>> list(
            @PathVariable String iso3,
            @RequestParam(required = false) String indicatorCode,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        String country = iso3 == null ? "" : iso3.trim().toUpperCase(Locale.ROOT);
        String indicator = indicatorCode == null ? null
                : indicatorCode.trim().toUpperCase(Locale.ROOT);
        List<ScopedPublishedValueResponse> items = service.list(country, indicator, limit);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .header("Pragma","no-cache")
                .body(new TimeseriesListResponse<>(items.size(), items));
    }
}
