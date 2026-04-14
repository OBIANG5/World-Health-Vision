package com.worldhealthvision.timeseries.api;

/*
==============================================================================
FICHIER : TimeseriesController.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Exposer les lectures publiques du schema canonique des observations.

On garde ici les endpoints utiles aux futurs services frontend, gateway et
analytics pour lire :
- l'etat du stock canonique
- une serie pour un pays + indicateur
- la derniere valeur disponible par source
- les runs de provenance publies
==============================================================================
*/

import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesListResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.service.TimeseriesQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/timeseries")
public class TimeseriesController {

    private final TimeseriesQueryService timeseriesQueryService;

    public TimeseriesController(TimeseriesQueryService timeseriesQueryService) {
        this.timeseriesQueryService = timeseriesQueryService;
    }

    @GetMapping("/readiness")
    public TimeseriesReadinessResponse getReadiness() {
        return timeseriesQueryService.getReadiness();
    }

    @GetMapping("/series")
    public TimeseriesListResponse<TimeseriesObservationResponse> listSeries(
            @RequestParam String countryIso3,
            @RequestParam String indicatorCode,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String datasetCode,
            @RequestParam(required = false) String periodGranularity,
            @RequestParam(required = false) LocalDate fromPeriodStart,
            @RequestParam(required = false) LocalDate toPeriodStart,
            @RequestParam(defaultValue = "false") boolean includeMissing,
            @RequestParam(defaultValue = "ASC") String sortDirection,
            @RequestParam(defaultValue = "200") @Min(1) @Max(1000) int limit
    ) {
        return timeseriesQueryService.listSeries(
                countryIso3,
                indicatorCode,
                sourceCode,
                datasetCode,
                periodGranularity,
                fromPeriodStart,
                toPeriodStart,
                includeMissing,
                sortDirection,
                limit
        );
    }

    @GetMapping("/series/latest")
    public TimeseriesListResponse<LatestSourceObservationResponse> listLatestBySource(
            @RequestParam String countryIso3,
            @RequestParam String indicatorCode,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String datasetCode,
            @RequestParam(required = false) String periodGranularity,
            @RequestParam(defaultValue = "false") boolean includeMissing
    ) {
        return timeseriesQueryService.listLatestBySource(
                countryIso3,
                indicatorCode,
                sourceCode,
                datasetCode,
                periodGranularity,
                includeMissing
        );
    }

    @GetMapping("/series/availability")
    public TimeseriesListResponse<SeriesAvailabilityResponse> listSeriesAvailability(
            @RequestParam String countryIso3,
            @RequestParam String indicatorCode,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String datasetCode,
            @RequestParam(required = false) String periodGranularity,
            @RequestParam(defaultValue = "100") @Min(1) @Max(500) int limit
    ) {
        return timeseriesQueryService.listSeriesAvailability(
                countryIso3,
                indicatorCode,
                sourceCode,
                datasetCode,
                periodGranularity,
                limit
        );
    }

    @GetMapping("/compare/countries/latest")
    public TimeseriesListResponse<CountryLatestComparisonResponse> listLatestCountryComparison(
            @RequestParam List<String> countryIso3,
            @RequestParam String indicatorCode,
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String datasetCode,
            @RequestParam(required = false) String periodGranularity,
            @RequestParam(defaultValue = "false") boolean includeMissing
    ) {
        return timeseriesQueryService.listLatestCountryComparison(
                countryIso3,
                indicatorCode,
                sourceCode,
                datasetCode,
                periodGranularity,
                includeMissing
        );
    }

    @GetMapping("/source-runs")
    public TimeseriesListResponse<SourceRunSummaryResponse> listSourceRuns(
            @RequestParam(required = false) String sourceCode,
            @RequestParam(required = false) String datasetCode,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "100") @Min(1) @Max(500) int limit
    ) {
        return timeseriesQueryService.listSourceRuns(sourceCode, datasetCode, status, limit);
    }
}
