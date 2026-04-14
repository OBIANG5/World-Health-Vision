package com.worldhealthvision.catalog.api.dto;

/*
==============================================================================
FICHIER : CountrySummaryResponse.java

ROLE
------------------------------------------------------------------------------
Representer la version "liste" d’un pays exposee par l’API catalog.

EVOLUTION V5
------------------------------------------------------------------------------
On enrichit maintenant la reponse avec la devise courante du pays.

Pourquoi dans la version summary aussi ?
- parce qu’une liste de pays utile pour le produit V2 doit deja pouvoir
  afficher ou filtrer par devise
- cela preparera mieux les comparaisons et le futur front adapte
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
        boolean aggregate,
        boolean active
) {
}