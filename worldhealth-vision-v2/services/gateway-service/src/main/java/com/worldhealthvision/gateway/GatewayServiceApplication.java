package com.worldhealthvision.gateway;

/*
==============================================================================
FICHIER : GatewayServiceApplication.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Cette classe est le point d'entree du microservice gateway-service.

Quand on demarre l'application Spring Boot,
c'est ce fichier qui sert de point d'entree.

Image mentale :
cette classe est la cle de contact de la voiture.
Sans elle, le moteur ne demarre pas.

RESPONSABILITES DE CE FICHIER
------------------------------------------------------------------------------
- demarrer l'application Spring Boot
- declarer le point d'entree principal du service

CE FICHIER N'EST PAS RESPONSABLE DE
------------------------------------------------------------------------------
- definir les routes metier
- gerer la securite detaillee
- ecrire les algorithmes metier

ORDRE CHRONOLOGIQUE
------------------------------------------------------------------------------
Ce fichier est cree au tout debut du service.

FICHIERS LIES
------------------------------------------------------------------------------
- lie a pom.xml
- lie a application.yml
- utilise par Spring Boot au demarrage
==============================================================================
*/

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GatewayServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}
