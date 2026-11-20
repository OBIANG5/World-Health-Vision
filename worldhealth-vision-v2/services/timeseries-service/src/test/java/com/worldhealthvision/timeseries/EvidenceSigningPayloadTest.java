package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.worldhealthvision.timeseries.service.SignedEvidenceAttestation;
import org.junit.jupiter.api.Test;

/** Immutable cross-language witness signed-byte contract; no DB or credentials. */
class EvidenceSigningPayloadTest {
    private static final String VECTOR =
            "ad6c456304ac78a48209327f056ce4e1fe35b02a693410359fd8a6635014d72d";

    @Test
    void researchWitnessPythonAndJavaHaveSameLengthPrefixedSignedBytes() {
        var proof = new SignedEvidenceAttestation(
                "WORLD_VISION_BRONZE_WITNESS_V2",
                "PRIVATE_RESEARCH_VALIDATION", "IBGE", "CENSO2022_4714",
                "sha256-" + "b".repeat(64),
                1795176000L, 123456000,
                "b".repeat(64), "c".repeat(64), "d".repeat(64),
                "e".repeat(32), "f".repeat(64),
                "cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d",
                "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1", "9".repeat(64),
                1795176000L, 1795176180L, "a".repeat(64), ""
        );
        assertEquals(VECTOR, proof.signedPayloadSha256());
    }
}
