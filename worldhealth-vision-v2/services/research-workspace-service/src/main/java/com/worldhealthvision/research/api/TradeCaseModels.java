package com.worldhealthvision.research.api;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

/** Only user authored research. A case is NOT a quote, trade order or advice. */
public final class TradeCaseModels {
    private TradeCaseModels() {}

    public record WriteRequest(String title, JsonNode plan) {}

    public record CaseView(
        UUID id, String title, JsonNode plan, long version, Instant createdAt, Instant updatedAt
    ) {}

    public record CaseSummary(
        UUID id, String title, long version, Instant createdAt, Instant updatedAt
    ) {}

    public record RevisionView(
        long version, String title, JsonNode plan, Instant savedAt
    ) {}
}
