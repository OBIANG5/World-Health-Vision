package com.worldhealthvision.timeseries;

/*
==============================================================================
FICHIER : TimeseriesServiceApplication.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Point d'entree principal du timeseries-service.

Ce service porte la representation canonique des observations multi-sources.
Il ne remplace pas les fichiers bronze :
- le bronze garde le payload source
- ce service garde la forme exploitable, tracee et requetable
==============================================================================
*/

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TimeseriesServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimeseriesServiceApplication.class, args);
    }
}
