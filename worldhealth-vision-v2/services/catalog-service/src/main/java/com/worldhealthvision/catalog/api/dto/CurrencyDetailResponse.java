package com.worldhealthvision.catalog.api.dto;

/*
==============================================================================
FICHIER : CurrencyDetailResponse.java

ROLE
------------------------------------------------------------------------------
Representer la fiche detaillee d’une devise exposee par l’API catalog.

UTILITE
------------------------------------------------------------------------------
Cette vue permet plus tard :
- d’alimenter des panneaux de details devise
- de verifier les mappings pays -> devise
- de preparer le convertisseur et l'affordability
==============================================================================
*/

public record CurrencyDetailResponse(
        String code,
        String displayName,
        String symbol,
        String numericCode,
        short minorUnit,
        boolean active,
        int countryCount
) {
}