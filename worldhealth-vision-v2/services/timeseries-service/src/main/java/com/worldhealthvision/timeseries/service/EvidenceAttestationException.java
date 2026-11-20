package com.worldhealthvision.timeseries.service;

/** Generic fail-closed response: never disclose token, source path or raw values. */
public final class EvidenceAttestationException extends RuntimeException {
    public EvidenceAttestationException() {
        super("Original Bronze witness attestation absent, expired or invalid.");
    }
}
