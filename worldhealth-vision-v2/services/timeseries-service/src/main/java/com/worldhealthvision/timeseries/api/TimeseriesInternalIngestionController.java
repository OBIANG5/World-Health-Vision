package com.worldhealthvision.timeseries.api;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionBatchAcceptedResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.TimeseriesIngestionService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ingestion is DENIED by default even if the URL contains "internal".
 * Enable only by provisioning a high-entropy, >=32-character shared secret
 * over an authenticated PRIVATE network with TLS. The secret must never be
 * checked into GitHub, exposed in HTTP logs or used as a public browser token.
 *
 * This is a minimal first barrier, not end-to-end OIDC/mTLS or permission
 * registry. A future DATA-1C revision must deploy workload identity, network
 * ACLs, rotation and observability before any sensitive public operation.
 */
@RestController
@RequestMapping("/internal/timeseries/ingestion")
public class TimeseriesInternalIngestionController {
    private final TimeseriesIngestionService timeseriesIngestionService;
    private final String expectedPrivateKey;

    public TimeseriesInternalIngestionController(
            TimeseriesIngestionService timeseriesIngestionService,
            @Value("${whv.timeseries.internal-ingestion-key:}") String expectedPrivateKey
    ) {
        this.timeseriesIngestionService = timeseriesIngestionService;
        this.expectedPrivateKey = expectedPrivateKey;
    }

    @PostMapping("/observation-batches")
    public ResponseEntity<IngestionBatchAcceptedResponse> ingestObservationBatch(
            @RequestHeader(value = "X-WHV-Ingestion-Key", required = false) String presentedKey,
            @Valid @RequestBody IngestionObservationBatchRequest request
    ) {
        if (expectedPrivateKey == null || expectedPrivateKey.length() < 32) {
            // An environment with no configured secret never silently permits
            // writes. This includes an accidentally internet-exposed port.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (presentedKey == null || presentedKey.length() < 32
                || !MessageDigest.isEqual(
                    expectedPrivateKey.getBytes(StandardCharsets.UTF_8),
                    presentedKey.getBytes(StandardCharsets.UTF_8)
                )) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(timeseriesIngestionService.ingestObservationBatch(request));
    }
}
