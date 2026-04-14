insert into catalog.region (code, display_name, type) values
    ('AFRICA', 'Africa', 'CONTINENT'),
    ('AMERICAS', 'Americas', 'CONTINENT'),
    ('ASIA', 'Asia', 'CONTINENT'),
    ('EUROPE', 'Europe', 'CONTINENT'),
    ('OCEANIA', 'Oceania', 'CONTINENT'),
    ('WORLD', 'World', 'CONTINENT')
on conflict (code) do update
set
    display_name = excluded.display_name,
    type = excluded.type;

insert into catalog.source (
    id,
    code,
    display_name,
    type,
    organization_name,
    homepage_url,
    documentation_url,
    access_model,
    license_summary,
    geographic_scope,
    temporal_granularity,
    update_cadence,
    bias_notes,
    quality_notes
) values
    ('00000000-0000-0000-0000-000000000001', 'WORLD_BANK', 'World Bank', 'OFFICIAL', 'World Bank', 'https://www.worldbank.org/', 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation', 'OPEN', 'Public indicator APIs and documentation. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'PERIODIC', 'Official reporting can lag and may smooth local shocks.', 'Strong international comparability, but publication cadence varies.'),
    ('00000000-0000-0000-0000-000000000002', 'IMF', 'International Monetary Fund', 'OFFICIAL', 'International Monetary Fund', 'https://www.imf.org/', 'https://data.imf.org/en/Resource-Pages/IMF-API', 'OPEN', 'Public API access for documented datasets. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'PERIODIC', 'Methodologies differ by dataset and revision windows can be significant.', 'High-value macro source with broad country coverage.'),
    ('00000000-0000-0000-0000-000000000003', 'OECD', 'OECD Data', 'OFFICIAL', 'OECD', 'https://www.oecd.org/', 'https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html', 'OPEN', 'Public API and open documentation. Review source terms before redistribution.', 'MULTI_REGION', 'COUNTRY', 'PERIODIC', 'Coverage is stronger for OECD members than for the full world.', 'Very good for normalized thematic indicators.'),
    ('00000000-0000-0000-0000-000000000004', 'EUROSTAT', 'Eurostat', 'OFFICIAL', 'European Commission / Eurostat', 'https://ec.europa.eu/eurostat', 'https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started', 'OPEN', 'Public API access and open documentation. Review source terms before redistribution.', 'EUROPE', 'COUNTRY', 'PERIODIC', 'Best in class inside Europe, weaker outside its own scope by design.', 'Excellent for European regional and temporal comparability.'),
    ('00000000-0000-0000-0000-000000000005', 'ILOSTAT', 'ILOSTAT', 'OFFICIAL', 'International Labour Organization', 'https://ilostat.ilo.org/', 'https://ilostat.ilo.org/data/bulk/', 'OPEN', 'Bulk open access datasets. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'PERIODIC', 'Employment definitions can differ before standardization and revisions are common.', 'Essential labor-market complement to macro sources.'),
    ('00000000-0000-0000-0000-000000000006', 'UNODC', 'UNODC Data', 'OFFICIAL', 'United Nations Office on Drugs and Crime', 'https://dataunodc.un.org/', 'https://dataunodc.un.org/content/homicide-country-data', 'OPEN', 'Public access dataset. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'ANNUAL', 'Crime reporting quality varies materially between countries.', 'Useful for safety baseline when clearly framed with caveats.'),
    ('00000000-0000-0000-0000-000000000007', 'VDEM', 'V-Dem', 'RESEARCH', 'Varieties of Democracy Institute', 'https://www.v-dem.net/', 'https://www.v-dem.net/data/the-v-dem-dataset/', 'OPEN', 'Open dataset for research use. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'ANNUAL', 'Research models reflect methodology choices and expert-coded inputs.', 'Strong governance and institutional depth for cross-country comparisons.'),
    ('00000000-0000-0000-0000-000000000008', 'GEONAMES', 'GeoNames', 'COMMUNITY', 'GeoNames', 'https://www.geonames.org/', 'https://www.geonames.org/about.html', 'OPEN', 'Open geographic reference dataset. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'AD_HOC', 'Community-maintained and not an economic source.', 'Useful as a geographic normalization layer, not as economic truth.'),
    ('00000000-0000-0000-0000-000000000009', 'OSM', 'OpenStreetMap', 'COMMUNITY', 'OpenStreetMap Contributors', 'https://www.openstreetmap.org/', 'https://wiki.openstreetmap.org/wiki/Overpass_API', 'OPEN', 'Open map data under community governance. Review source terms before redistribution.', 'GLOBAL', 'POINT', 'CONTINUOUS', 'Coverage quality varies by country, city and contributor density.', 'Excellent field-reality complement for infrastructure and locality context.'),
    ('00000000-0000-0000-0000-000000000010', 'WIKIDATA', 'Wikidata', 'COMMUNITY', 'Wikimedia Foundation', 'https://www.wikidata.org/', 'https://www.wikidata.org/wiki/Wikidata:Main_Page', 'OPEN', 'Open knowledge graph. Review source terms before redistribution.', 'GLOBAL', 'COUNTRY', 'CONTINUOUS', 'Best used as reference metadata, not as authoritative economic truth.', 'Strong support layer for identifiers and cross-source linking.')
on conflict (code) do update
set
    display_name = excluded.display_name,
    type = excluded.type,
    organization_name = excluded.organization_name,
    homepage_url = excluded.homepage_url,
    documentation_url = excluded.documentation_url,
    access_model = excluded.access_model,
    license_summary = excluded.license_summary,
    geographic_scope = excluded.geographic_scope,
    temporal_granularity = excluded.temporal_granularity,
    update_cadence = excluded.update_cadence,
    bias_notes = excluded.bias_notes,
    quality_notes = excluded.quality_notes,
    is_enabled = true;

insert into catalog.source_dataset (
    id,
    source_id,
    code,
    display_name,
    description,
    category,
    default_granularity,
    default_frequency,
    documentation_url,
    license_summary
) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'WDI', 'World Development Indicators', 'Core World Bank macro and development indicators.', 'MACROECONOMIC', 'COUNTRY', 'ANNUAL', 'https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation', 'Public access documented by the World Bank.'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'WGI', 'Worldwide Governance Indicators', 'Governance indicators published by the World Bank.', 'GOVERNANCE', 'COUNTRY', 'ANNUAL', 'https://www.worldbank.org/en/publication/worldwide-governance-indicators', 'Public access documented by the World Bank.'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'IMF_PUBLIC_DATA', 'IMF Public Data', 'Macro datasets published by the IMF.', 'MACROECONOMIC', 'COUNTRY', 'ANNUAL', 'https://data.imf.org/en/Resource-Pages/IMF-API', 'Public API for documented datasets.'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'OECD_PUBLIC_DATA', 'OECD Public Data', 'OECD statistical datasets.', 'MACROECONOMIC', 'COUNTRY', 'ANNUAL', 'https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html', 'Public API for documented datasets.'),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'EUROSTAT_PUBLIC_DATA', 'Eurostat Public Data', 'Eurostat data browser API datasets.', 'MACROECONOMIC', 'COUNTRY', 'ANNUAL', 'https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started', 'Public API for documented datasets.'),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', 'ILOSTAT_BULK', 'ILOSTAT Bulk Data', 'Labor market datasets from ILOSTAT bulk access.', 'LABOR', 'COUNTRY', 'ANNUAL', 'https://ilostat.ilo.org/data/bulk/', 'Bulk public access documented by ILOSTAT.'),
    ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', 'UNODC_HOMICIDE', 'UNODC Homicide Data', 'Country homicide and safety baseline indicators.', 'SAFETY', 'COUNTRY', 'ANNUAL', 'https://dataunodc.un.org/content/homicide-country-data', 'Public access dataset documented by UNODC.'),
    ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'VDEM_DATASET', 'V-Dem Dataset', 'Institutional and governance indicators.', 'GOVERNANCE', 'COUNTRY', 'ANNUAL', 'https://www.v-dem.net/data/the-v-dem-dataset/', 'Open research dataset.'),
    ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'GEONAMES_COUNTRY_INFO', 'GeoNames Country Info', 'Country and geographic metadata.', 'GEOSPATIAL', 'COUNTRY', 'AD_HOC', 'https://www.geonames.org/about.html', 'Open geographic reference data.'),
    ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'OSM_OVERPASS', 'OpenStreetMap Overpass', 'Queryable map and infrastructure metadata.', 'GEOSPATIAL', 'POINT', 'CONTINUOUS', 'https://wiki.openstreetmap.org/wiki/Overpass_API', 'Open community-maintained map data.'),
    ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000010', 'WIKIDATA_COUNTRY_GRAPH', 'Wikidata Country Graph', 'Country identifiers and open metadata graph.', 'REFERENCE', 'COUNTRY', 'CONTINUOUS', 'https://www.wikidata.org/wiki/Wikidata:Main_Page', 'Open knowledge graph data.'),
    ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', 'OECD_PRICE_LEVELS', 'OECD Price Level Indices', 'Comparative country price-level indices at GDP level with OECD = 100.', 'PRICES', 'COUNTRY', 'ANNUAL', 'https://www.oecd.org/en/data/indicators/price-level-indices.html', 'Public OECD SDMX CSV access for documented price-level datasets.'),
    ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003', 'OECD_HOUSING_PRICES', 'OECD Housing Prices', 'Quarterly real house-price indices with base year 2015 = 100.', 'HOUSING', 'COUNTRY', 'QUARTERLY', 'https://www.oecd.org/en/data/indicators/housing-prices.html', 'Public OECD SDMX CSV access for documented housing-price datasets.')
on conflict (source_id, code) do update
set
    display_name = excluded.display_name,
    description = excluded.description,
    category = excluded.category,
    default_granularity = excluded.default_granularity,
    default_frequency = excluded.default_frequency,
    documentation_url = excluded.documentation_url,
    license_summary = excluded.license_summary,
    is_enabled = true;

insert into catalog.indicator (
    code,
    display_name,
    topic,
    unit_label,
    description,
    preferred_frequency,
    source_dataset_id,
    is_core,
    methodology_notes
) values
    ('NY.GDP.MKTP.CD', 'GDP (current US$)', 'MACROECONOMIC', 'USD', 'Gross domestic product at current market prices in current US dollars.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Use only as one macro lens. Compare with GDP growth and population-aware indicators.'),
    ('NY.GDP.PCAP.CD', 'GDP per capita (current US$)', 'MACROECONOMIC', 'USD_PER_PERSON', 'Gross domestic product divided by midyear population.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Useful for cross-country scale adjustment, but sensitive to currency and inequality effects.'),
    ('NY.GDP.MKTP.KD.ZG', 'GDP growth (annual %)', 'MACROECONOMIC', 'PERCENT', 'Annual percentage growth rate of GDP at market prices based on constant local currency.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Trend signal should always be read with inflation and external balances.'),
    ('FP.CPI.TOTL.ZG', 'Inflation, consumer prices (annual %)', 'PRICES', 'PERCENT', 'Annual percentage change in the cost to the average consumer of acquiring a basket of goods and services.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Official CPI should later be compared with field-price proxies when available.'),
    ('WHV.PRICE.LEVEL.GDP.OECD100', 'Comparative price level index, GDP level (OECD = 100)', 'PRICES', 'INDEX_OECD_100', 'Relative general price level at GDP level, indexed to the OECD average = 100.', 'ANNUAL', '10000000-0000-0000-0000-000000000012', false, 'Useful for cross-country cost-level comparisons and travel affordability context, but it is not a direct household basket or housing affordability metric.'),
    ('WHV.HOUSING.PRICE.REAL.INDEX2015', 'Real house price index (2015 = 100)', 'HOUSING', 'INDEX_2015_100', 'Quarterly real house-price index with 2015 set to 100.', 'QUARTERLY', '10000000-0000-0000-0000-000000000013', false, 'Useful to detect structural housing heat and market cooling, but it does not directly measure rents or household affordability.'),
    ('WHV.SAFETY.HOMICIDE.RATE.P100K', 'Intentional homicide victims (per 100,000 people)', 'SAFETY', 'VICTIMS_PER_100K', 'Victims of intentional homicide per 100,000 population.', 'ANNUAL', '10000000-0000-0000-0000-000000000007', false, 'A useful safety baseline from UNODC, but it is not a complete crime score and must be read with strong caution about reporting quality and country comparability.'),
    ('SP.POP.TOTL', 'Population, total', 'DEMOGRAPHY', 'PEOPLE', 'Total population counts all residents regardless of legal status or citizenship.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Population is not a value judgment but a scaling baseline for many ratios.'),
    ('SL.UEM.TOTL.ZS', 'Unemployment (% of labor force)', 'LABOR', 'PERCENT', 'Share of the labor force that is without work but available for and seeking employment.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Definitions and survey methods vary. Later cross-check with ILOSTAT-specific labor series.'),
    ('SL.TLF.CACT.ZS', 'Labor force participation rate, total (% of total population ages 15+)', 'LABOR', 'PERCENT', 'Share of the population ages 15 and older that is economically active, either working or actively seeking work.', 'ANNUAL', '10000000-0000-0000-0000-000000000006', true, 'Critical complement to unemployment because low unemployment can hide discouraged workers when participation is weak.'),
    ('BN.CAB.XOKA.GD.ZS', 'Current account balance (% of GDP)', 'EXTERNAL_BALANCE', 'PERCENT_OF_GDP', 'Current account balance as share of GDP.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Important for external fragility, but should be read with reserves and FX context later.'),
    ('SP.DYN.LE00.IN', 'Life expectancy at birth (years)', 'SOCIAL', 'YEARS', 'Life expectancy at birth indicates the number of years a newborn infant would live if prevailing patterns of mortality stayed constant.', 'ANNUAL', '10000000-0000-0000-0000-000000000001', true, 'Not central to travel cost or FX, but useful to keep a broader country profile.')
on conflict (code) do update
set
    display_name = excluded.display_name,
    topic = excluded.topic,
    unit_label = excluded.unit_label,
    description = excluded.description,
    preferred_frequency = excluded.preferred_frequency,
    source_dataset_id = excluded.source_dataset_id,
    is_core = excluded.is_core,
    methodology_notes = excluded.methodology_notes;
