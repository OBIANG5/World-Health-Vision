package com.worldhealthvision.timeseries.persistence;

/** Conflict is intentionally value-free: never leak source payloads or secrets. */
public final class ImmutableSourceRunConflictException extends RuntimeException {
    public ImmutableSourceRunConflictException() {
        super("Source run identity already exists with different or unverified provenance.");
    }
}
