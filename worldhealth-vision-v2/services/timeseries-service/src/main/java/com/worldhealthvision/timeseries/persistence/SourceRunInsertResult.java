package com.worldhealthvision.timeseries.persistence;

import java.util.UUID;

/** Immutable first-write or exact replay; never changes an existing source run. */
public record SourceRunInsertResult(UUID sourceRunId, boolean newlyInserted) {
}
