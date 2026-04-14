package com.worldhealthvision.catalog.bootstrap;

/*
==============================================================================
FICHIER : WorldBankCountrySeedRecord.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Mapper le snapshot officiel World Bank des pays charge depuis les resources.

Le but est de garder un format de seed :
- lisible
- versionne
- derive d'une source ouverte reelle
==============================================================================
*/

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record WorldBankCountrySeedRecord(
        @JsonProperty("id") String id,
        @JsonProperty("iso2Code") String iso2Code,
        @JsonProperty("name") String name,
        @JsonProperty("region") WorldBankLabeledValue region,
        @JsonProperty("adminregion") WorldBankLabeledValue adminregion,
        @JsonProperty("incomeLevel") WorldBankLabeledValue incomeLevel,
        @JsonProperty("lendingType") WorldBankLabeledValue lendingType,
        @JsonProperty("capitalCity") String capitalCity,
        @JsonProperty("longitude") String longitude,
        @JsonProperty("latitude") String latitude
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WorldBankLabeledValue(
            @JsonProperty("id") String id,
            @JsonProperty("value") String value
    ) {
    }
}
