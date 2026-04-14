package com.worldhealthvision.common.api;

/*
==============================================================================
FICHIER : ApiErrorResponse.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Ce record represente un format d'erreur HTTP stable et explicite.

Il permet a plusieurs services Java de renvoyer un socle d'information commun :
- horodatage
- statut HTTP
- type d'erreur
- message
- chemin appele
- correlation id

Pourquoi c'est important ?
Parce qu'un backend pro ne doit pas renvoyer des erreurs incoherentes d'un
service a l'autre.
==============================================================================
*/

import java.time.OffsetDateTime;

public record ApiErrorResponse(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        String correlationId
) {
}
