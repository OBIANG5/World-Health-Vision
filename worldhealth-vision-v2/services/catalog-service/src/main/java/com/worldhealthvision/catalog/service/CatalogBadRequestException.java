package com.worldhealthvision.catalog.service;

/** Validated internal contract violation; never silently convert to HTTP 500. */
public class CatalogBadRequestException extends RuntimeException {
    public CatalogBadRequestException(String message) {
        super(message);
    }
}
