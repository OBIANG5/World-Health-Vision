package com.worldhealthvision.timeseries.service;

/** No public/private ingest of the pending-rights Brazil pilot, regardless of request flags. */
public final class ProtectedResearchPublicationException extends RuntimeException {
    public ProtectedResearchPublicationException() {
        super("Research dataset publication is blocked pending independently reviewed rights.");
    }
}
