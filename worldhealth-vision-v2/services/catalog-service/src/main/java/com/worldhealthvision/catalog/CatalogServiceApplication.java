package com.worldhealthvision.catalog;

/*
==============================================================================
FICHIER : CatalogServiceApplication.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Point d'entree principal du catalog-service.

Ce service a une responsabilite strategique :
il porte le langage de reference du backend V2.

Sans un catalogue solide, le projet ne peut pas construire des API multi-
sources coherentes ni exposer la provenance des donnees de facon serieuse.
==============================================================================
*/

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogServiceApplication.class, args);
    }
}
