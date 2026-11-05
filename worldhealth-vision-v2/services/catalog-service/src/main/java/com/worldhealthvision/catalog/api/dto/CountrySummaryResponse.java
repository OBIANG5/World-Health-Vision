package com.worldhealthvision.catalog.api.dto;

/*
==============================================================================
FICHIER : CountrySummaryResponse.java

ROLE
------------------------------------------------------------------------------
Representer la version "liste" d’un pays exposee par l’API catalog.

EVOLUTION V5
------------------------------------------------------------------------------
Enrichi avec devise (currencyCode, currencyName, currencySymbol) pour
permettre le filtrage et le convertisseur FX dans le front.

EVOLUTION V7 (tooltip riche)
------------------------------------------------------------------------------
Ajout de capitalCity dans la summary : permet d’afficher la capitale
directement dans le tooltip de la carte sans appel supplementaire au
backend. Charge marginale negligeable (< 20 octets / pays).
==============================================================================
*/

public record CountrySummaryResponse(
        String iso3,
        String iso2,
        String displayName,
        String regionCode,
        String regionName,
        String subregionCode,
        String subregionName,
        String currencyCode,
        String currencyName,
        String currencySymbol,
        String capitalCity,
        boolean aggregate,
        boolean active
) {
}