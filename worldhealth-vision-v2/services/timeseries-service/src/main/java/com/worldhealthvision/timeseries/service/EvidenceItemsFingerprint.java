package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * DATA-1C-A2B: reconstruct the EXACT typed projection signed by the private
 * Bronze witness. Never accept an "itemsSha256" value from client notes as
 * proof: calculate from actually submitted and normalized observations.
 *
 * The protocol matches evidence_items_fingerprint.py byte-by-byte. Maps have
 * ASCII-only keys sorted by UTF-8 bytes; numbers are typed and double values
 * serialize as IEEE754 binary64. No JSON serialization ambiguity.
 */
@Component
public final class EvidenceItemsFingerprint {
    private static final byte[] DOMAIN = "WORLD_VISION_ITEMS_PROJECTION_V1\0"
            .getBytes(StandardCharsets.UTF_8);
    private static final int MAX_ITEMS = 256;
    private static final int MAX_BYTES = 2_000_000;

    public String calculate(IngestionObservationBatchRequest request) {
        if (request.items().isEmpty() || request.items().size() > MAX_ITEMS) {
            throw new IllegalArgumentException("Unbounded evidence items");
        }
        List<IngestionObservationWriteRequest> ordered = request.items().stream()
                .sorted(Comparator.comparing(IngestionObservationWriteRequest::indicatorCode)
                        .thenComparing(IngestionObservationWriteRequest::countryIso3)
                        .thenComparing(IngestionObservationWriteRequest::periodGranularity)
                        .thenComparing(IngestionObservationWriteRequest::periodStart))
                .toList();
        Set<String> distinct = new HashSet<>();
        List<Object> projections = new ArrayList<>();
        for (var item : ordered) {
            String identity = item.indicatorCode() + "/" + item.countryIso3()
                    + "/" + item.periodGranularity() + "/" + item.periodStart();
            if (!distinct.add(identity) || item.textValue() != null) {
                throw new IllegalArgumentException("Invalid evidence item identity/text field");
            }
            projections.add(Arrays.asList(
                    item.indicatorCode(), item.countryIso3(),
                    item.periodGranularity(), item.periodStart().toString(),
                    item.periodEnd().toString(), item.periodLabel(),
                    item.valueStatus(), item.numericValue(), null,
                    publishedInstant(item.sourcePublishedAt()),
                    item.sourceMetadata(), item.qualityFlags()
            ));
        }
        try {
            ByteArrayOutputStream target = new ByteArrayOutputStream();
            DataOutputStream output = new DataOutputStream(target);
            output.write(DOMAIN);
            writeTyped(output, projections, 0);
            if (target.size() > MAX_BYTES) {
                throw new IllegalArgumentException("Evidence item projection too large");
            }
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(target.toByteArray()));
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Cannot calculate evidence item fingerprint", exception);
        }
    }

    private static String publishedInstant(OffsetDateTime value) {
        if (value == null) return null;
        var instant = value.toInstant();
        return instant.getEpochSecond() + "."
                + String.format(Locale.ROOT, "%09d", instant.getNano());
    }

    private static void bytes(DataOutputStream output, byte[] data) throws IOException {
        if (data.length > MAX_BYTES) {
            throw new IllegalArgumentException("Evidence field exceeds size limit");
        }
        output.writeInt(data.length);
        output.write(data);
    }

    private static void writeTyped(
            DataOutputStream output, Object value, int depth
    ) throws IOException {
        if (depth > 8) {
            throw new IllegalArgumentException("Evidence metadata nesting exceeds limit");
        }
        if (value == null) {
            output.writeByte(0);
        } else if (value instanceof Boolean bool) {
            output.writeByte(1);
            output.writeByte(bool ? 1 : 0);
        } else if (value instanceof String string) {
            output.writeByte(2);
            bytes(output, string.getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof Byte || value instanceof Short
                || value instanceof Integer || value instanceof Long
                || value instanceof java.math.BigInteger) {
            output.writeByte(3);
            bytes(output, value.toString().getBytes(StandardCharsets.US_ASCII));
        } else if (value instanceof Float || value instanceof Double
                || value instanceof java.math.BigDecimal) {
            double number = ((Number) value).doubleValue();
            if (!Double.isFinite(number)) {
                throw new IllegalArgumentException("Non-finite evidence numeric field");
            }
            output.writeByte(4);
            output.writeLong(Double.doubleToRawLongBits(number));
        } else if (value instanceof List<?> items) {
            if (items.size() > MAX_ITEMS) {
                throw new IllegalArgumentException("Evidence array too large");
            }
            output.writeByte(5);
            output.writeInt(items.size());
            for (Object child : items) {
                writeTyped(output, child, depth + 1);
            }
        } else if (value instanceof Map<?, ?> map) {
            if (map.size() > MAX_ITEMS) {
                throw new IllegalArgumentException("Evidence object too large");
            }
            List<String> keys = new ArrayList<>();
            for (Object key : map.keySet()) {
                if (!(key instanceof String str) || !str.matches("[A-Za-z0-9_.-]{1,128}")) {
                    throw new IllegalArgumentException("Invalid evidence metadata key");
                }
                keys.add(str);
            }
            keys.sort(Comparator.naturalOrder()); // restricted ASCII UTF8 == Java String
            output.writeByte(6);
            output.writeInt(keys.size());
            for (String key : keys) {
                writeTyped(output, key, depth + 1);
                writeTyped(output, map.get(key), depth + 1);
            }
        } else {
            throw new IllegalArgumentException("Unsupported evidence value type");
        }
    }
}
