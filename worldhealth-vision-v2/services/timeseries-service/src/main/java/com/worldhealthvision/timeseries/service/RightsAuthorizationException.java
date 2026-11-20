package com.worldhealthvision.timeseries.service;

/** No decision, wrong operation, expired/revoked, wrong SHA, or bad signature. */
public final class RightsAuthorizationException extends RuntimeException {
    public RightsAuthorizationException() {
        super("No currently verified, authorized source rights decision for requested public API ingest.");
    }
}
