package com.worldhealthvision.catalog.persistence;

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
import java.util.List;
import java.util.Optional;

public interface CatalogRepository {

    CatalogReadinessResponse getReadiness();

    List<RegionSummaryResponse> listRegions();

    Optional<RegionSummaryResponse> findRegionByCode(String code);

    List<CountrySummaryResponse> listCountries(
            boolean includeAggregates,
            boolean activeOnly,
            String regionCode,
            String search,
            int limit
    );

    Optional<CountryDetailResponse> findCountryByIso3(String iso3);

    List<CurrencySummaryResponse> listCurrencies(
            boolean activeOnly,
            String search,
            int limit
    );

    Optional<CurrencyDetailResponse> findCurrencyByCode(String code);

    List<IndicatorSummaryResponse> listIndicators(boolean coreOnly);

    Optional<IndicatorDetailResponse> findIndicatorByCode(String code);

    List<SourceSummaryResponse> listSources(boolean enabledOnly);

    Optional<SourceDetailResponse> findSourceByCode(String code);

    List<SourceDatasetSummaryResponse> listSourceDatasets(boolean enabledOnly, String sourceCode);

    Optional<SourceDatasetDetailResponse> findSourceDataset(String sourceCode, String datasetCode);
}