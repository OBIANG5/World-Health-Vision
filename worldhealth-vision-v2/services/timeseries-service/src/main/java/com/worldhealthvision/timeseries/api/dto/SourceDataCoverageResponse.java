package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Vérification factuelle de la couverture d'une source répertoriée dans la V2.
 *
 * Les compteurs sont calculés sur timeseries.latest_observation (donc sans
 * doubler les observations réingérées). Seules les valeurs réellement
 * disponibles OBSERVED / ESTIMATED sont comptées ; les MISSING et SUPPRESSED
 * ne prouvent jamais qu'une source propose une donnée utilisable.
 *
 * Un enregistrement dans catalog.source ne signifie PAS qu'une donnée a
 * effectivement été collectée. Les dates servent à vérifier la fraîcheur,
 * pas à garantir une couverture continue ou la qualité méthodologique.
 */
public record SourceDataCoverageResponse(
        String sourceCode,
        String sourceDisplayName,
        long observedRecordCount,
        long estimatedRecordCount,
        long observedNumericCount,
        long coveredCountryCount,
        LocalDate latestAvailablePeriodStart,
        OffsetDateTime latestDataFetchedAtUtc
) {
}
