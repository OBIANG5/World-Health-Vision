package com.worldhealthvision.catalog.api.dto;

/*
==============================================================================
FICHIER : CurrencySummaryResponse.java

ROLE
------------------------------------------------------------------------------
Representer une devise dans une vue "liste".

UTILITE PRODUIT
------------------------------------------------------------------------------
Cette vue sera utile pour :
- l’exploration des devises
- les futurs selecteurs de conversion
- les comparaisons
- l’administration/reference
==============================================================================
*/

public record CurrencySummaryResponse(
        String code,
        String displayName,
        String symbol,
        String numericCode,
        short minorUnit,
        boolean active,
        int countryCount
) {
}