#!/usr/bin/env python3
"""PRODUCT-P2C2: CI-ONLY signed synthetic source package.

This is NOT a source-licensing service and is NEVER part of the runtime app.
Creates a genuine ephemeral, auditable Ed25519 reviewer grant and a DIFFERENT
ephemeral Bronze witness signature over test-only bytes. The private keys stay
in this short-lived Python process and are NEVER written to disk.

The raw/normalized/manifest/journal content is synthetic (not provider data).
A second invocation ("verify") independently checks all byte hashes,
observation fingerprint and both signatures before deployment.
"""
from __future__ import annotations

import argparse
import base64
from datetime import UTC, datetime
from hashlib import sha256
import json
import os
from pathlib import Path
import secrets
import struct
from typing import Any
from uuid import uuid4

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from ingestion_service.evidence_items_fingerprint import items_sha256


SOURCE = "WHV_SYNTHETIC_QA"
DATASET = "WHV_CI_DEMO"
INDICATOR = "SYNTH.P2C2.QA"
COUNTRY = "GAB"
VALUE = 17.0
PERIOD_START = "2024-01-01"
PERIOD_END = "2024-12-31"
# These domains and labels must NEVER be used to imply a provider license.
LICENSE_URL = "https://example.invalid/worldvision-ci-synthetic-only"
LICENSE_NAME = "WHV_CI_ONLY_NO_REAL_PROVIDER_LICENSE"
PUBLIC_CONTEXT = "PUBLIC_API_INGEST"


def canonical(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True,
                       separators=(",", ":")) + "\n").encode("utf-8")


def digest(value: bytes) -> str:
    return sha256(value).hexdigest()


def public_der(key: Ed25519PrivateKey) -> bytes:
    return key.public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )


def encode_public(key: Ed25519PrivateKey) -> str:
    return base64.b64encode(public_der(key)).decode("ascii")


def signed_bytes(fields: list[str], max_length: int) -> bytes:
    data = bytearray()
    for field in fields:
        assert isinstance(field, str)
        raw = field.encode("utf-8")
        if len(raw) > max_length:
            raise ValueError("Signing protocol field exceeds defined bound")
        data.extend(struct.pack(">I", len(raw)))
        data.extend(raw)
    return bytes(data)


def reviewer_payload(record: dict[str, Any]) -> bytes:
    # BYTE-FOR-BYTE SignedRightsDecision.java, including its signing domain.
    return signed_bytes([
        "WORLD_VISION_SIGNED_RIGHTS_DECISION_V1", record["decision_id"],
        record["source_code"], record["dataset_code"], record["country_iso3"],
        record["indicator_code"], record["operation"], record["original_http_sha256"],
        record["period_start"], record["period_end"], record["valid_from_utc"],
        record["valid_until_utc"], record["issued_at_utc"],
        record["reviewer_id"], record["countersigner_id"], record["license_identifier"],
        record["license_url"], record["license_text_sha256"],
        record["attribution_text"], record["signing_public_key_sha256"],
    ], 16384)


def witness_payload(token: dict[str, Any]) -> bytes:
    # EXACT SignedEvidenceAttestation.java token domain.
    return signed_bytes([
        "WORLD_VISION_BRONZE_WITNESS_V1", token["schema"],
        token["operation"], token["sourceCode"], token["datasetCode"],
        token["runKey"], str(token["fetchedAtEpochSec"]),
        str(token["fetchedAtNano"]), token["originalHttpSha256"],
        token["normalizedNdjsonSha256"], token["manifestSha256"],
        token["acquisitionEventId"], token["acquisitionOutcomeSha256"],
        token["itemsSha256"], str(token["issuedAtEpochSec"]),
        str(token["expiresAtEpochSec"]), token["signingPublicKeySha256"],
    ], 4096)


def quoted(value: Any) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def build_sql(review: dict[str, Any]) -> str:
    # Catalogue entries exist ONLY in the disposable CI database. They do not
    # imply a real institutional source is connected or licensed.
    source_id, dataset_id = str(uuid4()), str(uuid4())
    def values(*args: Any) -> str:
        return ", ".join(quoted(v) for v in args)
    columns = (
        "decision_id", "source_code", "dataset_code", "country_iso3", "indicator_code",
        "operation", "original_http_sha256", "period_start", "period_end",
        "valid_from_utc", "valid_until_utc", "issued_at_utc", "reviewer_id",
        "countersigner_id", "license_identifier", "license_url", "license_text_sha256",
        "attribution_text", "signing_public_key_sha256", "signature_base64",
    )
    statements = [
        "begin;",
        "insert into catalog.source (id,code,display_name,type,organization_name,"
        "homepage_url,documentation_url,access_model,license_summary,"
        "geographic_scope,temporal_granularity,update_cadence,bias_notes,quality_notes) "
        "values (" + values(
            source_id, SOURCE, "WHV SYNTHETIC CI ONLY — not an institution", "RESEARCH",
            "World-Vision CI ephemeral test", LICENSE_URL, LICENSE_URL, "OPEN",
            "SYNTHETIC QA ONLY; no third-party commercial/data rights",
            "CI isolated database only", "ANNUAL", "Never",
            "Fictional value, not an official estimate or measurement",
            "Source and dataset for automated CI evidence only",
        ) + ");",
        "insert into catalog.source_dataset (id,source_id,code,display_name,"
        "description,category,default_granularity,default_frequency,documentation_url,license_summary) "
        "values (" + values(
            dataset_id, source_id, DATASET, "Synthetic CI demo — no provider",
            "Disposable synthetic observations, not institutional data", "CI_TEST",
            "ANNUAL", "ANNUAL", LICENSE_URL, "TEST ONLY; not a provider license",
        ) + ");",
        "insert into catalog.indicator (code,display_name,topic,unit_label,"
        "description,preferred_frequency,source_dataset_id,is_core,methodology_notes) "
        "values (" + values(
            INDICATOR, "Synthetic QA indicator — NOT REAL DATA",
            "CI_VERIFICATION", "CI test units",
            "A fictitious number for World-Vision end-to-end tests only",
            "ANNUAL", dataset_id, False,
            "Synthetic test method. No statistical inference or provider authority.",
        ).replace("'False'", "false") + ");",
        "insert into timeseries.rights_decision (" + ", ".join(columns) + ") "
        "values (" + values(*(review[key] for key in columns)) + ");",
        "commit;",
    ]
    return "\n".join(statements) + "\n"


def prepare(directory: Path) -> None:
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    # Distinct, random ephemeral keypairs. Never export either private key.
    reviewer_key = Ed25519PrivateKey.generate()
    witness_key = Ed25519PrivateKey.generate()
    assert public_der(reviewer_key) != public_der(witness_key)

    timestamp = datetime.now(UTC).replace(microsecond=0)
    fetched_at = timestamp.isoformat().replace("+00:00", "Z")
    fetched_second = int(timestamp.timestamp())
    event_id = uuid4().hex
    run_key = "p2c2_ci_" + uuid4().hex
    item = {
        "indicatorCode": INDICATOR, "countryIso3": COUNTRY,
        "periodGranularity": "ANNUAL",
        "periodStart": PERIOD_START, "periodEnd": PERIOD_END, "periodLabel": "2024",
        "numericValue": VALUE, "textValue": None, "valueStatus": "OBSERVED",
        "sourcePublishedAt": "2025-01-02T00:00:00Z",
        "sourceMetadata": {"sourceYear": "2024", "syntheticTestOnly": True},
        "qualityFlags": ["SYNTHETIC_ONLY"],
    }
    original = {
        "ciOnly": True, "syntheticSource": SOURCE,
        "license": "NO REAL LICENSE", "observation": item,
    }
    original_bytes = canonical(original)
    # Deterministic CI parser: normalizes exactly the generated original.
    decoded = json.loads(original_bytes)
    if decoded.get("syntheticSource") != SOURCE or decoded["observation"] != item:
        raise ValueError("Synthetic raw→normalized replay did not match")
    normalized_bytes = canonical(decoded["observation"])
    if json.loads(normalized_bytes) != item:
        raise ValueError("Normalized synthetic observation not reproducible")
    original_sha = digest(original_bytes)
    normalized_sha = digest(normalized_bytes)
    manifest = {
        "sourceCode": SOURCE, "datasetCode": DATASET,
        "runKey": run_key, "httpBodySha256": original_sha,
        "normalizedNdjsonSha256": normalized_sha,
        "syntheticTestOnly": True,
    }
    manifest_bytes = canonical(manifest)
    journal = {
        "acquisitionEventId": event_id,
        "runKey": run_key,
        "outcome": "SYNTHETIC_TEST_SUCCESS",
        "rawSha256": original_sha, "normalizedSha256": normalized_sha,
    }
    journal_bytes = canonical(journal)
    notes = {
        "httpBodySha256": original_sha,
        "normalizedNdjsonSha256": normalized_sha,
        "manifestSha256": digest(manifest_bytes),
        "acquisitionEventId": event_id,
        "acquisitionOutcomeSha256": digest(journal_bytes),
        "syntheticTestOnly": True,
    }
    request = {
        "sourceCode": SOURCE, "datasetCode": DATASET, "runKey": run_key,
        "fetchedAtUtc": fetched_at,
        "bronzeRawPayloadPath": "ci-private/raw.json",
        "bronzeNormalizedPayloadPath": "ci-private/normalized.ndjson",
        "recordCount": 1, "notes": notes, "items": [item],
    }
    item_sha = items_sha256(request["items"])
    witness = {
        "schema": "WORLD_VISION_BRONZE_WITNESS_V1",
        "operation": PUBLIC_CONTEXT, "sourceCode": SOURCE, "datasetCode": DATASET,
        "runKey": run_key, "fetchedAtEpochSec": fetched_second,
        "fetchedAtNano": 0, "originalHttpSha256": original_sha,
        "normalizedNdjsonSha256": normalized_sha,
        "manifestSha256": digest(manifest_bytes),
        "acquisitionEventId": event_id,
        "acquisitionOutcomeSha256": digest(journal_bytes),
        "itemsSha256": item_sha, "issuedAtEpochSec": fetched_second,
        "expiresAtEpochSec": fetched_second + 420,
        "signingPublicKeySha256": digest(public_der(witness_key)),
    }
    witness["signatureBase64"] = base64.b64encode(
        witness_key.sign(witness_payload(witness))).decode("ascii")
    request["notes"]["evidenceAttestation"] = witness

    rights = {
        "decision_id": str(uuid4()), "source_code": SOURCE, "dataset_code": DATASET,
        "country_iso3": COUNTRY, "indicator_code": INDICATOR,
        "operation": PUBLIC_CONTEXT, "original_http_sha256": original_sha,
        "period_start": "2020-01-01", "period_end": "2027-12-31",
        "valid_from_utc": "2025-01-01T00:00:00Z",
        "valid_until_utc": "2029-12-31T00:00:00Z",
        "issued_at_utc": "2024-12-01T00:00:00Z",
        "reviewer_id": "P2C2_CI_EPHEMERAL_REVIEWER",
        "countersigner_id": "P2C2_CI_INDEPENDENT_COUNTERSIGNER",
        "license_identifier": LICENSE_NAME, "license_url": LICENSE_URL,
        "license_text_sha256": digest(b"SYNTHETIC QA ONLY. NO THIRD-PARTY LICENSE.\n"),
        "attribution_text": "World-Vision CI SYNTHETIC ONLY: NO REAL STATISTIC",
        "signing_public_key_sha256": digest(public_der(reviewer_key)),
    }
    rights["signature_base64"] = base64.b64encode(
        reviewer_key.sign(reviewer_payload(rights))).decode("ascii")

    protected = {
        "reviewerPublicKeyBase64": encode_public(reviewer_key),
        "witnessPublicKeyBase64": encode_public(witness_key),
        "decision": rights, "attestation": witness,
        "expectedIndicator": INDICATOR, "expectedCountry": COUNTRY,
    }
    (directory / "raw.json").write_bytes(original_bytes)
    (directory / "normalized.ndjson").write_bytes(normalized_bytes)
    (directory / "manifest.json").write_bytes(manifest_bytes)
    (directory / "journal.json").write_bytes(journal_bytes)
    (directory / "signed-batch.json").write_bytes(canonical(request))
    (directory / "seed.sql").write_text(build_sql(rights), encoding="utf-8")
    (directory / "revoke.sql").write_text(
        "insert into timeseries.rights_revocation(decision_id,operator_id,reason_code) "
        "values (" + quoted(rights["decision_id"]) +
        ", 'WORLD_VISION_CI_REVOKER', 'CI_TEST_PERMISSION_WITHDRAWN');\n",
        encoding="utf-8",
    )
    (directory / "proof-public.json").write_bytes(canonical(protected))
    for file in directory.iterdir():
        file.chmod(0o600)

    # Only public X.509 DER keys go to Timeseries, never either private signer.
    # Ingestion key is masked from GitHub logs and stays in disposable runner.
    ingestion_key = secrets.token_hex(40)
    print(f"::add-mask::{ingestion_key}")
    envfile = os.getenv("GITHUB_ENV")
    if not envfile:
        raise RuntimeError("Prepare only inside ephemeral GitHub Actions runner")
    with open(envfile, "a", encoding="utf-8") as output:
        output.write("WHV_RIGHTS_TRUST_PUBLIC_KEY_BASE64=" + encode_public(reviewer_key) + "\n")
        output.write("WHV_EVIDENCE_TRUST_PUBLIC_KEY_BASE64=" + encode_public(witness_key) + "\n")
        output.write("WHV_TIMESERIES_INTERNAL_INGESTION_KEY=" + ingestion_key + "\n")
    # Important: do not print signed body, secret, private key or grant SQL.
    print("PASS: two ephemeral independent CI signatures and synthetic Bronze files generated.")


def verify(directory: Path) -> None:
    bundle = json.loads((directory / "proof-public.json").read_bytes())
    raw = (directory / "raw.json").read_bytes()
    normalized = (directory / "normalized.ndjson").read_bytes()
    manifest = (directory / "manifest.json").read_bytes()
    journal = (directory / "journal.json").read_bytes()
    batch = json.loads((directory / "signed-batch.json").read_bytes())
    witness = bundle["attestation"]
    rights = bundle["decision"]
    assert raw.startswith(b'{"ciOnly":true')
    assert json.loads(raw)["observation"] == json.loads(normalized)
    assert batch["items"] == [json.loads(normalized)]
    assert digest(raw) == rights["original_http_sha256"] == witness["originalHttpSha256"]
    assert digest(normalized) == witness["normalizedNdjsonSha256"]
    assert digest(manifest) == witness["manifestSha256"]
    assert digest(journal) == witness["acquisitionOutcomeSha256"]
    assert witness["itemsSha256"] == items_sha256(batch["items"])
    assert bundle["reviewerPublicKeyBase64"] != bundle["witnessPublicKeyBase64"]
    assert witness["operation"] == PUBLIC_CONTEXT == rights["operation"]
    def check(key: str, signature: str, payload: bytes) -> None:
        material = base64.b64decode(key, validate=True)
        public = serialization.load_der_public_key(material)
        assert isinstance(public, Ed25519PublicKey)
        public.verify(base64.b64decode(signature, validate=True), payload)
    check(bundle["reviewerPublicKeyBase64"], rights["signature_base64"], reviewer_payload(rights))
    check(bundle["witnessPublicKeyBase64"], witness["signatureBase64"], witness_payload(witness))
    assert (directory / "revoke.sql").is_file()
    print("PASS: independent readback verified raw/normalized/manifest/journal, two public signatures and exact items projection.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("prepare", "verify"))
    parser.add_argument("--directory", type=Path, required=True)
    args = parser.parse_args()
    if args.action == "prepare":
        prepare(args.directory)
    else:
        verify(args.directory)
