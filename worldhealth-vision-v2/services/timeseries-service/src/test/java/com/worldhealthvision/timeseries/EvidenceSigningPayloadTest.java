package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.worldhealthvision.timeseries.service.SignedEvidenceAttestation;
import org.junit.jupiter.api.Test;

/** Immutable cross-language witness signed-byte contract; no DB or credentials. */
class EvidenceSigningPayloadTest {
    private static final String VECTOR =
            "1f32b6b91178a9019266999ca478385d1613d1481f15bfd02f67111029d20acb";

    @Test
    void researchWitnessPythonAndJavaHaveSameLengthPrefixedSignedBytes() {
        var proof = new SignedEvidenceAttestation(
                "WORLD_VISION_BRONZE_WITNESS_V1",
                "PRIVATE_RESEARCH_VALIDATION", "IBGE", "CENSO2022_4714",
                "sha256-" + "b".repeat(64),
                1795176000L, 123456000,
                "b".repeat(64), "c".repeat(64), "d".repeat(64),
                "e".repeat(32), "f".repeat(64),
                "cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d",
                1795176000L, 1795176180L, "a".repeat(64), ""
        );
        assertEquals(VECTOR, proof.signedPayloadSha256());
    }
}
