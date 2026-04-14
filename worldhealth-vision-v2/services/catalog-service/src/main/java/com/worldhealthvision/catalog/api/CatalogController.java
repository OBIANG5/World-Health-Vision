package com.worldhealthvision.catalog.api;

/*
==============================================================================
FICHIER : CatalogController.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Ce controleur expose la lecture du referentiel V2.

EVOLUTION V5
------------------------------------------------------------------------------
On ajoute maintenant la lecture du catalogue des devises, ainsi que
l’enrichissement devise sur les pays.
==============================================================================
*/

import com.worldhealthvision.catalog.api.dto.CatalogListResponse;
import com.worldhealthvision.catalog.api.dto.CatalogReadinessResponse;
import com.worldhealthvision.catalog.api.dto.CountryDetailResponse;
import com.worldhealthvision.catalog.api.dto.CountrySummaryResponse;
import com.worldhealthvision.catalog.api.dto.CurrencyDetailResponse;
import com.worldhealthvision.catalog.api.dto.CurrencySummaryResponse;
import com.worldhealthvision.catalog.api.dto.IndicatorDetailResponse;
import com.worldhealthvision.catalog.api.dto.IndicatorSummaryResponse;
import com.worldhealthvision.catalog.api.dto.RegionSummaryResponse;
import com.worldhealthvision.catalog.api.dto.SourceDatasetDetailResponse;
import com.worldhealthvision.catalog.api.dto.SourceDatasetSummaryResponse;
import com.worldhealthvision.catalog.api.dto.SourceDetailResponse;
import com.worldhealthvision.catalog.api.dto.SourceSummaryResponse;
import com.worldhealthvision.catalog.service.CatalogQueryService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final CatalogQueryService catalogQueryService;

    public CatalogController(CatalogQueryService catalogQueryService) {
        this.catalogQueryService = catalogQueryService;
    }

    @GetMapping("/readiness")
    public CatalogReadinessResponse getReadiness() {
        return catalogQueryService.getReadiness();
    }

    @GetMapping("/regions")
    public CatalogListResponse<RegionSummaryResponse> listRegions() {
        return catalogQueryService.listRegions();
    }

    @GetMapping("/regions/{code}")
    public RegionSummaryResponse getRegion(@PathVariable String code) {
        return catalogQueryService.getRegion(code);
    }

    @GetMapping("/countries")
    public CatalogListResponse<CountrySummaryResponse> listCountries(
            @RequestParam(defaultValue = "false") boolean includeAggregates,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "250") @Min(1) @Max(500) int limit
    ) {
        return catalogQueryService.listCountries(includeAggregates, activeOnly, regionCode, search, limit);
    }

    @GetMapping("/countries/{iso3}")
    public CountryDetailResponse getCountry(@PathVariable String iso3) {
        return catalogQueryService.getCountry(iso3);
    }

    @GetMapping("/currencies")
    public CatalogListResponse<CurrencySummaryResponse> listCurrencies(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "250") @Min(1) @Max(500) int limit
    ) {
        return catalogQueryService.listCurrencies(activeOnly, search, limit);
    }

    @GetMapping("/currencies/{code}")
    public CurrencyDetailResponse getCurrency(@PathVariable String code) {
        return catalogQueryService.getCurrency(code);
    }

    @GetMapping("/indicators")
    public CatalogListResponse<IndicatorSummaryResponse> listIndicators(
            @RequestParam(defaultValue = "false") boolean coreOnly
    ) {
        return catalogQueryService.listIndicators(coreOnly);
    }

    @GetMapping("/indicators/{code}")
    public IndicatorDetailResponse getIndicator(@PathVariable String code) {
        return catalogQueryService.getIndicator(code);
    }

    @GetMapping("/sources")
    public CatalogListResponse<SourceSummaryResponse> listSources(
            @RequestParam(defaultValue = "true") boolean enabledOnly
    ) {
        return catalogQueryService.listSources(enabledOnly);
    }

    @GetMapping("/sources/{code}")
    public SourceDetailResponse getSource(@PathVariable String code) {
        return catalogQueryService.getSource(code);
    }

    @GetMapping("/datasets")
    public CatalogListResponse<SourceDatasetSummaryResponse> listSourceDatasets(
            @RequestParam(defaultValue = "true") boolean enabledOnly,
            @RequestParam(required = false) String sourceCode
    ) {
        return catalogQueryService.listSourceDatasets(enabledOnly, sourceCode);
    }

    @GetMapping("/sources/{sourceCode}/datasets")
    public CatalogListResponse<SourceDatasetSummaryResponse> listSourceDatasetsBySource(
            @PathVariable String sourceCode,
            @RequestParam(defaultValue = "true") boolean enabledOnly
    ) {
        return catalogQueryService.listSourceDatasets(enabledOnly, sourceCode);
    }

    @GetMapping("/sources/{sourceCode}/datasets/{datasetCode}")
    public SourceDatasetDetailResponse getSourceDataset(
            @PathVariable String sourceCode,
            @PathVariable String datasetCode
    ) {
        return catalogQueryService.getSourceDataset(sourceCode, datasetCode);
    }
}