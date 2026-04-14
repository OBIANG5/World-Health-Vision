package com.worldhealthvision.catalog.service;

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
import com.worldhealthvision.catalog.persistence.CatalogRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CatalogQueryService {

    private final CatalogRepository catalogRepository;

    public CatalogQueryService(CatalogRepository catalogRepository) {
        this.catalogRepository = catalogRepository;
    }

    public CatalogReadinessResponse getReadiness() {
        return catalogRepository.getReadiness();
    }

    public CatalogListResponse<RegionSummaryResponse> listRegions() {
        List<RegionSummaryResponse> items = catalogRepository.listRegions();
        return new CatalogListResponse<>(items.size(), items);
    }

    public RegionSummaryResponse getRegion(String code) {
        String normalizedCode = code.trim().toUpperCase();
        return catalogRepository.findRegionByCode(normalizedCode)
                .orElseThrow(() -> new CatalogNotFoundException("Unknown region: " + normalizedCode));
    }

    public CatalogListResponse<CountrySummaryResponse> listCountries(
            boolean includeAggregates,
            boolean activeOnly,
            String regionCode,
            String search,
            int limit
    ) {
        String normalizedRegionCode = normalizeOptionalCode(regionCode);
        String normalizedSearch = normalizeOptionalSearch(search);

        List<CountrySummaryResponse> items = catalogRepository.listCountries(
                includeAggregates,
                activeOnly,
                normalizedRegionCode,
                normalizedSearch,
                limit
        );

        return new CatalogListResponse<>(items.size(), items);
    }

    public CountryDetailResponse getCountry(String iso3) {
        String normalizedIso3 = iso3.trim().toUpperCase();
        return catalogRepository.findCountryByIso3(normalizedIso3)
                .orElseThrow(() -> new CatalogNotFoundException("Unknown country: " + normalizedIso3));
    }

    public CatalogListResponse<CurrencySummaryResponse> listCurrencies(
            boolean activeOnly,
            String search,
            int limit
    ) {
        String normalizedSearch = normalizeOptionalSearch(search);
        List<CurrencySummaryResponse> items = catalogRepository.listCurrencies(activeOnly, normalizedSearch, limit);
        return new CatalogListResponse<>(items.size(), items);
    }

    public CurrencyDetailResponse getCurrency(String code) {
        String normalizedCode = code.trim().toUpperCase();
        return catalogRepository.findCurrencyByCode(normalizedCode)
                .orElseThrow(() -> new CatalogNotFoundException("Unknown currency: " + normalizedCode));
    }

    public CatalogListResponse<IndicatorSummaryResponse> listIndicators(boolean coreOnly) {
        List<IndicatorSummaryResponse> items = catalogRepository.listIndicators(coreOnly);
        return new CatalogListResponse<>(items.size(), items);
    }

    public IndicatorDetailResponse getIndicator(String code) {
        String normalizedCode = code.trim().toUpperCase();
        return catalogRepository.findIndicatorByCode(normalizedCode)
                .orElseThrow(() -> new CatalogNotFoundException("Unknown indicator: " + normalizedCode));
    }

    public CatalogListResponse<SourceSummaryResponse> listSources(boolean enabledOnly) {
        List<SourceSummaryResponse> items = catalogRepository.listSources(enabledOnly);
        return new CatalogListResponse<>(items.size(), items);
    }

    public SourceDetailResponse getSource(String code) {
        String normalizedCode = code.trim().toUpperCase();
        return catalogRepository.findSourceByCode(normalizedCode)
                .orElseThrow(() -> new CatalogNotFoundException("Unknown source: " + normalizedCode));
    }

    public CatalogListResponse<SourceDatasetSummaryResponse> listSourceDatasets(boolean enabledOnly, String sourceCode) {
        String normalizedSourceCode = normalizeOptionalCode(sourceCode);
        List<SourceDatasetSummaryResponse> items = catalogRepository.listSourceDatasets(enabledOnly, normalizedSourceCode);
        return new CatalogListResponse<>(items.size(), items);
    }

    public SourceDatasetDetailResponse getSourceDataset(String sourceCode, String datasetCode) {
        String normalizedSourceCode = sourceCode.trim().toUpperCase();
        String normalizedDatasetCode = datasetCode.trim().toUpperCase();

        return catalogRepository.findSourceDataset(normalizedSourceCode, normalizedDatasetCode)
                .orElseThrow(() -> new CatalogNotFoundException(
                        "Unknown dataset: " + normalizedSourceCode + "/" + normalizedDatasetCode
                ));
    }

    private String normalizeOptionalCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String normalizeOptionalSearch(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return "%" + value.trim().toUpperCase() + "%";
    }
}