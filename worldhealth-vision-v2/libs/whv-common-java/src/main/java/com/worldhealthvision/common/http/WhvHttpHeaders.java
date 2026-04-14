package com.worldhealthvision.common.http;

/*
==============================================================================
FICHIER : WhvHttpHeaders.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Centraliser les noms d'en-tetes HTTP transverses du backend V2.

Cela evite :
- les fautes de frappe
- les divergences entre services
- les conventions implicites non documentees
==============================================================================
*/

public final class WhvHttpHeaders {

    public static final String X_CORRELATION_ID = "X-Correlation-Id";
    public static final String X_REQUEST_ID = "X-Request-Id";
    public static final String X_SOURCE_RUN_ID = "X-Source-Run-Id";

    private WhvHttpHeaders() {
    }
}
