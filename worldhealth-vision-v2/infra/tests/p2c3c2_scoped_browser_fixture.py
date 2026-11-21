#!/usr/bin/env python3
"""P2C3C2: three-Ed25519 CI ONLY synthetic scoped Atlas source package.

Never real provider data. V6 HTTP ingestion intentionally rejects scoped
data; this fixture directly seeds ONE disposable synthetic signed source-run
into an ephemeral Postgres for browser READ testing only, not real ingestion.
No private keys are ever written, printed, exported or deployed to services.
"""
from __future__ import annotations
import argparse
import base64
from datetime import datetime,UTC
import json
import os
from pathlib import Path
import secrets
from uuid import uuid4
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey,Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
from ingestion_service.evidence_items_fingerprint import items_sha256
from p2c2_signed_fixture import (
    SOURCE,DATASET,INDICATOR,COUNTRY,VALUE,PERIOD_START,PERIOD_END,
    LICENSE_NAME,LICENSE_URL,PUBLIC_CONTEXT,canonical,digest,quoted,
    public_der,encode_public,reviewer_payload,witness_payload,
    signed_bytes,build_sql
)

GEO_CODE="2025-SYNTH-GAB-WITHOUT-FICTIONAL-REGION"
GEO_VERSION="2025-A"
GEO_LABEL="SYNTHETIC QA ONLY — Gabon excluding FICTIONAL_TEST_TERRITORY"
GEO_URL="https://example.invalid/synthetic-geographic-metadata"
GEO_SHA=digest(b"SYNTHETIC GEOGRAPHY ONLY, NOT ANY GABON SOURCE\n")
GEO_UNIT="CI_UNITS"
GEO_METHOD="SYNTHETIC_QA_METHOD"

def geometry_payload(g):
    return signed_bytes([
        "WORLD_VISION_SCOPED_PUBLICATION_DECISION_V1",
        g["decision_id"],g["geographic_scope_id"],g["source_run_id"],
        g["attested_items_sha256"],g["source_code"],g["dataset_code"],
        g["indicator_code"],g["operation"],g["original_http_sha256"],
        g["source_metadata_sha256"],g["methodology_code"],g["unit_code"],
        g["period_start"],g["period_end"],g["valid_from_utc"],
        g["valid_until_utc"],g["issued_at_utc"],g["reviewer_id"],
        g["countersigner_id"],g["scope_metadata_label"],
        g["scope_metadata_url"],g["scope_native_code"],
        g["scope_native_version"],g["scope_country_iso3"],
        g["scope_coverage_kind"],g["signing_public_key_sha256"]
    ],16384)

def sql_values(*values):
    return ",".join("null" if value is None else quoted(value) for value in values)

def scoped_sql(rights,geo,batch,run_id,obs_id,scope_id,witness_sha,item_sha):
    item=batch["items"][0]
    notes=json.dumps(batch["notes"],ensure_ascii=False,sort_keys=True,separators=(",",":"))
    meta=json.dumps(item["sourceMetadata"],ensure_ascii=False,sort_keys=True,separators=(",",":"))
    quality=json.dumps(item["qualityFlags"],ensure_ascii=False,separators=(",",":"))
    statements=[
      "begin;",
      "insert into timeseries.geographic_scope_registry("
      "id,source_code,dataset_code,native_geo_code,native_geo_version,"
      "geo_reference_year,country_iso3,coverage_kind,display_label,"
      "territorial_exclusions,source_metadata_url,source_metadata_sha256"
      ") values ("+sql_values(
          scope_id,SOURCE,DATASET,GEO_CODE,GEO_VERSION,2025,COUNTRY,
          "PARTIAL_COUNTRY",GEO_LABEL,'["FICTIONAL_TEST_TERRITORY"]',
          GEO_URL,GEO_SHA)+");",
      "insert into timeseries.source_run("
      "id,source_code,dataset_code,run_key,fetched_at_utc,"
      "bronze_raw_payload_path,bronze_normalized_payload_path,record_count,"
      "status,notes,canonical_batch_sha256,evidence_attestation_sha256,"
      "attested_items_sha256) values ("+sql_values(
          run_id,SOURCE,DATASET,batch["runKey"],batch["fetchedAtUtc"],
          batch["bronzeRawPayloadPath"],batch["bronzeNormalizedPayloadPath"],
          1,"PERSISTED",notes,digest(canonical(batch)),witness_sha,item_sha)+");",
      "insert into timeseries.observation("
      "id,source_run_id,source_code,dataset_code,indicator_code,country_iso3,"
      "period_granularity,period_start,period_end,period_label,numeric_value,"
      "text_value,value_status,source_published_at,source_metadata,quality_flags"
      ") values ("+sql_values(
          obs_id,run_id,SOURCE,DATASET,item["indicatorCode"],COUNTRY,
          item["periodGranularity"],item["periodStart"],item["periodEnd"],
          item["periodLabel"],item["numericValue"],item["textValue"],
          item["valueStatus"],item["sourcePublishedAt"],meta,quality)+");",
      "insert into timeseries.source_run_rights_decision("
      "source_run_id,decision_id) values ("+
      sql_values(run_id,rights["decision_id"])+");"
    ]
    columns=[
      "decision_id","geographic_scope_id","source_run_id",
      "attested_items_sha256","source_code","dataset_code","indicator_code",
      "operation","original_http_sha256","source_metadata_sha256",
      "methodology_code","unit_code","period_start","period_end",
      "valid_from_utc","valid_until_utc","issued_at_utc","reviewer_id",
      "countersigner_id","scope_metadata_label","scope_metadata_url",
      "scope_native_code","scope_native_version","scope_country_iso3",
      "scope_coverage_kind","signing_public_key_sha256","signature_base64"
    ]
    statements.append(
      "insert into timeseries.scoped_publication_decision("
      +",".join(columns)+") values ("+
      sql_values(*(geo[name] for name in columns))+");")
    statements.append("commit;")
    return build_sql(rights)+"\n".join(statements)+"\n"

def prepare(directory):
    directory.mkdir(mode=0o700,parents=True,exist_ok=False)
    right,witness_key,scope_key=(Ed25519PrivateKey.generate() for _ in range(3))
    assert len({public_der(k) for k in (right,witness_key,scope_key)})==3
    time=datetime.now(UTC).replace(microsecond=0)
    stamp=time.isoformat().replace("+00:00","Z")
    now=int(time.timestamp())
    run_key="p2c3c2_ci_"+uuid4().hex
    run_id,obs_id,scope_id=str(uuid4()),str(uuid4()),str(uuid4())
    item={
      "indicatorCode":INDICATOR,"countryIso3":COUNTRY,
      "periodGranularity":"ANNUAL","periodStart":PERIOD_START,
      "periodEnd":PERIOD_END,"periodLabel":"2024",
      "numericValue":VALUE,"textValue":None,"valueStatus":"OBSERVED",
      "sourcePublishedAt":"2025-01-02T00:00:00Z",
      "sourceMetadata":{
        "sourceYear":"2024","syntheticTestOnly":True,
        "sourceNativeGeographyCode":GEO_CODE,
        "geographicVersion":GEO_VERSION,"geographicReferenceYear":2025,
        "methodologyCode":GEO_METHOD,"unitCode":GEO_UNIT
      },
      "qualityFlags":["SYNTHETIC_ONLY"]
    }
    raw=canonical({"ciOnly":True,"syntheticSource":SOURCE,
       "license":"NO ACTUAL SOURCE LICENSE","observation":item})
    normalized=canonical(item)
    raw_sha=digest(raw)
    manifest=canonical({"sourceCode":SOURCE,"datasetCode":DATASET,
       "runKey":run_key,"httpBodySha256":raw_sha,
       "normalizedNdjsonSha256":digest(normalized),"syntheticTestOnly":True})
    event=uuid4().hex
    journal=canonical({"acquisitionEventId":event,"runKey":run_key,
       "outcome":"SYNTHETIC_ONLY_SUCCESS","rawSha256":raw_sha,
       "normalizedSha256":digest(normalized)})
    notes={
      "httpBodySha256":raw_sha,"normalizedNdjsonSha256":digest(normalized),
      "manifestSha256":digest(manifest),"acquisitionEventId":event,
      "acquisitionOutcomeSha256":digest(journal),"syntheticTestOnly":True
    }
    request={
      "sourceCode":SOURCE,"datasetCode":DATASET,"runKey":run_key,
      "fetchedAtUtc":stamp,"bronzeRawPayloadPath":"ci/synthetic-raw.json",
      "bronzeNormalizedPayloadPath":"ci/synthetic-normalized.ndjson",
      "recordCount":1,"notes":notes,"items":[item]
    }
    item_sha=items_sha256(request["items"])
    witness={
      "schema":"WORLD_VISION_BRONZE_WITNESS_V1","operation":PUBLIC_CONTEXT,
      "sourceCode":SOURCE,"datasetCode":DATASET,"runKey":run_key,
      "fetchedAtEpochSec":now,"fetchedAtNano":0,
      "originalHttpSha256":raw_sha,"normalizedNdjsonSha256":digest(normalized),
      "manifestSha256":digest(manifest),"acquisitionEventId":event,
      "acquisitionOutcomeSha256":digest(journal),
      "itemsSha256":item_sha,"issuedAtEpochSec":now,"expiresAtEpochSec":now+420,
      "signingPublicKeySha256":digest(public_der(witness_key))
    }
    witness["signatureBase64"]=base64.b64encode(
        witness_key.sign(witness_payload(witness))).decode("ascii")
    notes["evidenceAttestation"]=witness
    rights={
      "decision_id":str(uuid4()),"source_code":SOURCE,"dataset_code":DATASET,
      "country_iso3":COUNTRY,"indicator_code":INDICATOR,
      "operation":PUBLIC_CONTEXT,"original_http_sha256":raw_sha,
      "period_start":"2020-01-01","period_end":"2027-12-31",
      "valid_from_utc":"2025-01-01T00:00:00Z",
      "valid_until_utc":"2029-12-31T00:00:00Z",
      "issued_at_utc":"2024-12-01T00:00:00Z",
      "reviewer_id":"P2C3C2_CI_SYNTHETIC_RIGHTS_REVIEWER",
      "countersigner_id":"P2C3C2_CI_SYNTHETIC_RIGHTS_COUNTERSIGNER",
      "license_identifier":LICENSE_NAME,"license_url":LICENSE_URL,
      "license_text_sha256":digest(b"SYNTHETIC ONLY NO REAL RIGHTS\n"),
      "attribution_text":"World-Vision CI SYNTHETIC QA ONLY — NOT REAL DATA",
      "signing_public_key_sha256":digest(public_der(right))
    }
    rights["signature_base64"]=base64.b64encode(
        right.sign(reviewer_payload(rights))).decode("ascii")
    geo={
      "decision_id":str(uuid4()),"geographic_scope_id":scope_id,
      "source_run_id":run_id,"attested_items_sha256":item_sha,
      "source_code":SOURCE,"dataset_code":DATASET,"indicator_code":INDICATOR,
      "operation":"PUBLIC_SCOPED_WEB_DISPLAY",
      "original_http_sha256":raw_sha,"source_metadata_sha256":GEO_SHA,
      "methodology_code":GEO_METHOD,"unit_code":GEO_UNIT,
      "period_start":PERIOD_START,"period_end":PERIOD_END,
      "valid_from_utc":"2026-01-01T00:00:00Z",
      "valid_until_utc":"2029-12-31T00:00:00Z",
      "issued_at_utc":"2025-12-01T00:00:00Z",
      "reviewer_id":"P2C3C2_CI_SYNTHETIC_GEO_REVIEWER",
      "countersigner_id":"P2C3C2_CI_SYNTHETIC_GEO_COUNTERSIGNER",
      "scope_metadata_label":GEO_LABEL,"scope_metadata_url":GEO_URL,
      "scope_native_code":GEO_CODE,"scope_native_version":GEO_VERSION,
      "scope_country_iso3":COUNTRY,"scope_coverage_kind":"PARTIAL_COUNTRY",
      "signing_public_key_sha256":digest(public_der(scope_key))
    }
    geo["signature_base64"]=base64.b64encode(
        scope_key.sign(geometry_payload(geo))).decode("ascii")
    proof={
      "reviewerPublicKeyBase64":encode_public(right),
      "witnessPublicKeyBase64":encode_public(witness_key),
      "geoPublicKeyBase64":encode_public(scope_key),
      "rights":rights,"witness":witness,"geography":geo,
      "expectedCountry":COUNTRY,"expectedIndicator":INDICATOR,
      "expectedScope":GEO_LABEL,"expectedValue":VALUE,
      "observationId":obs_id,"sourceRunId":run_id
    }
    files={
      "raw.json":raw,"normalized.ndjson":normalized,
      "manifest.json":manifest,"journal.json":journal,
      "signed-batch.json":canonical(request),"proof-public.json":canonical(proof),
      "seed.sql":scoped_sql(rights,geo,request,run_id,obs_id,scope_id,
          digest(witness_payload(witness)),item_sha).encode("utf-8"),
      "revoke-scope.sql":(
        "insert into timeseries.scoped_publication_revocation("
        "decision_id,operator_id,reason_code) values ("+
        quoted(geo["decision_id"])+",'CI_TEST_REVOKER','CI_SCOPED_REVOKED');\n"
      ).encode("utf-8")
    }
    for name,content in files.items():
        path=directory/name
        path.write_bytes(content)
        path.chmod(0o600)
    env=os.getenv("GITHUB_ENV")
    if not env: raise RuntimeError("Refuse outside disposable GitHub Actions runner")
    secret=secrets.token_hex(48)
    print("::add-mask::"+secret)
    with open(env,"a",encoding="utf-8") as out:
        out.write("WHV_RIGHTS_TRUST_PUBLIC_KEY_BASE64="+encode_public(right)+"\n")
        out.write("WHV_EVIDENCE_TRUST_PUBLIC_KEY_BASE64="+encode_public(witness_key)+"\n")
        out.write("WHV_SCOPE_TRUST_PUBLIC_KEY_BASE64="+encode_public(scope_key)+"\n")
        out.write("WHV_TIMESERIES_INTERNAL_INGESTION_KEY="+secret+"\n")
    print("PASS: three independent synthetic-only CI signers and scoped source bytes.")

def verify(directory):
    fs={n:(directory/n).read_bytes() for n in (
       "raw.json","normalized.ndjson","manifest.json","journal.json",
       "signed-batch.json","proof-public.json","seed.sql","revoke-scope.sql")}
    proof=json.loads(fs["proof-public.json"])
    batch=json.loads(fs["signed-batch.json"])
    assert json.loads(fs["raw.json"])["observation"]==json.loads(fs["normalized.ndjson"])
    assert batch["items"]==[json.loads(fs["normalized.ndjson"])]
    assert proof["expectedValue"]==17.0
    assert proof["expectedScope"]==GEO_LABEL
    assert digest(fs["raw.json"])==proof["rights"]["original_http_sha256"]
    assert digest(fs["normalized.ndjson"])==proof["witness"]["normalizedNdjsonSha256"]
    assert digest(fs["manifest.json"])==proof["witness"]["manifestSha256"]
    assert digest(fs["journal.json"])==proof["witness"]["acquisitionOutcomeSha256"]
    assert items_sha256(batch["items"])==proof["witness"]["itemsSha256"]
    for keyname,signature,payload in (
       ("reviewerPublicKeyBase64",proof["rights"]["signature_base64"],
        reviewer_payload(proof["rights"])),
       ("witnessPublicKeyBase64",proof["witness"]["signatureBase64"],
        witness_payload(proof["witness"])),
       ("geoPublicKeyBase64",proof["geography"]["signature_base64"],
        geometry_payload(proof["geography"]))
    ):
        key=serialization.load_der_public_key(base64.b64decode(proof[keyname]))
        assert isinstance(key,Ed25519PublicKey)
        key.verify(base64.b64decode(signature),payload)
    assert len({proof[k] for k in (
       "reviewerPublicKeyBase64","witnessPublicKeyBase64","geoPublicKeyBase64")})==3
    assert b"DS_POPULATIONS_REFERENCE" not in fs["seed.sql"]
    assert b"FICTIONAL_TEST_TERRITORY" in fs["seed.sql"]
    assert b"PUBLIC_SCOPED_WEB_DISPLAY" in fs["seed.sql"]
    assert b"PRIVATE KEY" not in fs["seed.sql"]
    print("PASS: three independent Ed25519 signatures and raw/normalized/manifest/journal synthetic SHA digests.")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("action",choices=("prepare","verify"))
    parser.add_argument("--directory",type=Path,required=True)
    opts=parser.parse_args()
    if opts.action=="prepare":prepare(opts.directory)
    else:verify(opts.directory)
