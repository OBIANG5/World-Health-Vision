package com.worldhealthvision.research.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Fail-closed, bounded writes independent of the browser's TypeScript checks. */
@Component
public class ResearchPlanValidation {
    private static final int MAX_BYTES = 200_000;
    private static final Set<String> PERSPECTIVES =
        Set.of("national", "regional", "international", "field", "media", "market", "other");
    private static final Set<String> STANCES = Set.of("supports", "challenges", "context");
    private final ObjectMapper mapper;

    public ResearchPlanValidation(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public String validate(TradeCaseModels.WriteRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()
            || request.title().length() > 120 || request.plan() == null || !request.plan().isObject()) {
            throw bad("Invalid research title or plan");
        }
        JsonNode plan = request.plan();
        if (plan.path("schemaVersion").asInt(-1) != 1 ||
            !text(plan, "instrument", 150) || !text(plan, "instrumentKind", 100) ||
            !oneOf(plan.path("direction"), "undecided", "long", "short") ||
            !oneOf(plan.path("mode"), "fundamental", "technical_exception")) {
            throw bad("Unsupported trade research plan");
        }
        JsonNode fields = plan.path("fields");
        if (!fields.isObject() || fields.size() > 100) throw bad("Too many research fields");
        var iterator = fields.fields();
        while (iterator.hasNext()) {
            var entry = iterator.next();
            if (entry.getKey().length() > 120 || !entry.getValue().isTextual()
                || entry.getValue().asText().length() > 10000) throw bad("Invalid research field");
        }
        JsonNode evidence = plan.path("evidence");
        if (!evidence.isArray() || evidence.size() > 50) throw bad("Too many sources");
        for (JsonNode e : evidence) {
            if (!e.isObject() || !text(e,"id",128) || !required(e,"name",240)
                || !required(e,"originalPublisher",240) || !required(e,"observation",3000)
                || !validHttps(e.path("url").asText()) ||
                !oneOf(e.path("perspective"), PERSPECTIVES) ||
                !oneOf(e.path("stance"), STANCES) ||
                !validDate(e.path("publishedAt").asText())) {
                throw bad("Invalid dated original-source reference");
            }
        }
        validateUpdates(plan.path("updates"));
        validateEvents(plan.path("events"));
        try {
            String serialized = mapper.writeValueAsString(plan);
            if (serialized.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
                throw bad("Research dossier exceeds 200KB");
            }
            return serialized;
        } catch (JsonProcessingException invalid) {
            throw bad("Unable to encode research dossier");
        }
    }

    private static void validateUpdates(JsonNode updates) {
        if (updates.isMissingNode()) return; // v1 exported pre-history cases
        if (!updates.isArray() || updates.size() > 30) throw bad("Invalid thesis revision list");
        for (JsonNode revision : updates) {
            JsonNode snapshot = revision.path("snapshot");
            if (!revision.isObject() || !required(revision, "id", 128) ||
                !validInstant(revision.path("recordedAt").asText()) ||
                !required(revision, "event", 2000) ||
                !required(revision, "newInformation", 2000) ||
                !required(revision, "conclusion", 2000) ||
                !oneOf(revision.path("disposition"), "watch", "reconsider", "reject") ||
                !snapshot.isObject() || !text(snapshot, "instrument", 150) ||
                !oneOf(snapshot.path("direction"), "undecided", "long", "short")) {
                throw bad("Invalid dated thesis revision");
            }
            for (String key : Set.of("theme", "pricedIn", "catalyst", "setup",
                    "initialEntry", "initialStop", "initialTarget")) {
                if (!text(snapshot, key, 8000)) throw bad("Invalid thesis snapshot field");
            }
            JsonNode publishers = snapshot.path("originalPublishers");
            if (!publishers.isArray() || publishers.size() > 50) {
                throw bad("Invalid original-source snapshot");
            }
            for (JsonNode publisher : publishers) {
                if (!publisher.isTextual() || publisher.asText().length() > 3000)
                    throw bad("Invalid original-source snapshot label");
            }
        }
    }

    private static void validateEvents(JsonNode events) {
        if (events.isMissingNode()) return;
        if (!events.isArray() || events.size() > 30) throw bad("Invalid event preparation list");
        for (JsonNode event : events) {
            if (!event.isObject() || !required(event, "id", 128) ||
                !required(event, "title", 240) || !validInstant(event.path("scheduledAt").asText()) ||
                !validInstant(event.path("preparedAt").asText()) ||
                !validInstant(event.path("expectationAsOf").asText()) ||
                !required(event, "expected", 100) || !text(event, "previous", 100) ||
                !required(event, "unit", 60) ||
                !required(event, "expectationPublisher", 240) ||
                !validHttps(event.path("expectationSourceUrl").asText()) ||
                !required(event, "higherScenario", 2000) ||
                !required(event, "lowerScenario", 2000)) {
                throw bad("Invalid sourced macro-event preparation");
            }
            if (!event.has("result")) continue;
            JsonNode result = event.path("result");
            if (!result.isObject() || !required(result, "actual", 100) ||
                !validInstant(result.path("publishedAt").asText()) ||
                !validHttps(result.path("originalUrl").asText()) ||
                !required(result, "reaction", 3000) ||
                !result.path("comparabilityReviewed").isBoolean()) {
                throw bad("Invalid dated macro-event result");
            }
        }
    }

    private static boolean validInstant(String value) {
        try {
            Instant.parse(value);
            return true;
        } catch (DateTimeParseException invalid) {
            return false;
        }
    }

    private static boolean text(JsonNode node, String key, int limit) {
        JsonNode value = node.get(key);
        return value != null && value.isTextual() && value.asText().length() <= limit;
    }

    private static boolean required(JsonNode node, String key, int limit) {
        return text(node, key, limit) && !node.get(key).asText().isBlank();
    }

    private static boolean oneOf(JsonNode value, String... allowed) {
        return oneOf(value, Set.of(allowed));
    }

    private static boolean oneOf(JsonNode value, Set<String> allowed) {
        return value.isTextual() && allowed.contains(value.asText());
    }

    private static boolean validDate(String value) {
        try {
            return LocalDate.parse(value).isBefore(LocalDate.now().plusDays(1));
        } catch (DateTimeParseException invalid) {
            return false;
        }
    }

    private static boolean validHttps(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null &&
                uri.getUserInfo() == null && uri.getFragment() == null;
        } catch (IllegalArgumentException invalid) {
            return false;
        }
    }

    static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
