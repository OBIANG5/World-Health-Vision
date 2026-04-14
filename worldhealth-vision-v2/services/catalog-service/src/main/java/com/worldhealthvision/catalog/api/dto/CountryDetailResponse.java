package com.worldhealthvision.catalog.api.dto;

/*
==============================================================================
FICHIER : CountryDetailResponse.java

ROLE
------------------------------------------------------------------------------
Representer la fiche detaillee d’un pays exposee par le catalog-service.

EVOLUTION V5
------------------------------------------------------------------------------
On enrichit maintenant la fiche pays avec la devise de reference :
- code ISO devise
- nom
- symbole
- minor unit

C’est une brique essentielle pour :
- le convertisseur
- la lecture budget / affordability
- les comparaisons futures
==============================================================================
*/

public record CountryDetailResponse(
        String iso3,
        String iso2,
        String displayName,
        String regionCode,
        String regionName,
        String subregionCode,
        String subregionName,
        String worldBankIncomeGroup,
        String lendingType,
        String capitalCity,
        Double latitude,
        Double longitude,
        String sovereignState,
        String currencyCode,
        String currencyName,
        String currencySymbol,
        Short currencyMinorUnit,
        boolean aggregate,
        boolean active,
        short dataQualityTier
) {
}