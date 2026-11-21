package com.worldhealthvision.timeseries.service;

/** Fail-closed exception, with no source bytes or license details returned. */
public final class ScopedPublicationAuthorizationException extends RuntimeException {
    public ScopedPublicationAuthorizationException() {
        super("Missing or invalid independent geographical publication permission.");
    }
}
