"""Cautious national-source availability audit, NOT an economic-data ingestion.

Reads the REAL catalog and checks each distinct registered institution's
homepage with one HEAD request. NEVER parses site content or decides whether
a statistic changed. NEVER sends unreviewed URLs to the network. The report
is designed for editor review and can support the future media source radar.

A successful HTTP response proves only the host answered that request.
HTTP 403/405/429 are NOT claims that an institution is unavailable.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import UTC, datetime
import json
import os
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlsplit

import httpx

# A manually reviewed host allowlist prevents catalog poisoning / SSRF.
# New institutions must have their host approved in a code-reviewed change.
# This is deliberately not a list of *all* trusted countries or websites.
APPROVED_HOSTS = frozenset({
    "new.instatgabon.org",
    "agpgabon.ga",
    "www.beac.int",
    "www.insee.fr",
    "www.banque-france.fr",
    "webstat.banque-france.fr",
    "www.nigerianstat.gov.ng",
    "www.cbn.gov.ng",
    "www.census.gov",
    "www.bea.gov",
})

MAX_COUNTRY_RECORDS = 500
MAX_UNIQUE_SOURCE_CHECKS = 40


def approved_https_url(candidate: str) -> bool:
    """Only pre-reviewed HTTPS hosts on port 443, without credentials."""
    try:
        parsed = urlsplit(candidate)
        return (
            parsed.scheme == "https"
            and parsed.hostname in APPROVED_HOSTS
            and parsed.port in (None, 443)
            and parsed.username is None
            and parsed.password is None
            and bool(parsed.netloc)
            and len(candidate) < 1024
        )
    except (ValueError, TypeError):
        return False


def load_registered_country_sources(catalog_client: httpx.Client) -> list[dict[str, Any]]:
    """Read the canonical real registry, with no fabricated country fallback."""
    response = catalog_client.get(
        "/api/catalog/local-sources/coverage",
        params={"limit": MAX_COUNTRY_RECORDS, "offset": 0},
    )
    response.raise_for_status()
    coverage = response.json()
    items = coverage.get("items")
    if not isinstance(items, list) or not isinstance(coverage.get("totalCountryCount"), int):
        raise ValueError("Invalid country source coverage API response")
    if coverage["totalCountryCount"] <= 0 or coverage["totalCountryCount"] > MAX_COUNTRY_RECORDS:
        raise ValueError("Country coverage exceeds the bounded complete registry scan")
    if len(items) != coverage["totalCountryCount"]:
        raise ValueError("Country registry page is incomplete; refusing partial results")

    # One organization may serve many countries (BEAC/CEMAC). Check its
    # official website once, then retain EVERY applicable country code.
    by_organization: dict[str, dict[str, Any]] = {}
    for country in items:
        iso3 = country.get("countryIso3")
        listed_count = country.get("listedSourceCount")
        if not isinstance(iso3, str) or len(iso3) != 3 or not iso3.isalpha():
            raise ValueError("Invalid country ISO3 in catalog source coverage")
        if not isinstance(listed_count, int) or listed_count < 0:
            raise ValueError("Invalid country listed-source count")
        if listed_count == 0:
            continue
        detail_response = catalog_client.get(f"/api/catalog/countries/{iso3}/local-context")
        detail_response.raise_for_status()
        details = detail_response.json()
        sources = details.get("localSources")
        if details.get("countryIso3") != iso3 or not isinstance(sources, list):
            raise ValueError("Country source API returned a foreign/malformed record")
        if len(sources) != listed_count:
            raise ValueError("Country source count differs between catalog endpoints")

        for entry in sources:
            code, url = entry.get("sourceCode"), entry.get("homepageUrl")
            if not isinstance(code, str) or not code or not isinstance(url, str):
                raise ValueError("Source record lacks organization identity or homepage")
            current = by_organization.get(code)
            if current is None:
                by_organization[code] = {
                    "sourceCode": code,
                    "displayName": entry.get("displayName"),
                    "sourceType": entry.get("sourceType"),
                    "homepageUrl": url,
                    "countryIso3s": [iso3],
                    "connectionState": entry.get("connectionState"),
                }
            else:
                if current["homepageUrl"] != url or current["sourceType"] != entry.get("sourceType"):
                    raise ValueError("Shared organization has contradictory URL or source type")
                if iso3 not in current["countryIso3s"]:
                    current["countryIso3s"].append(iso3)

        if len(by_organization) > MAX_UNIQUE_SOURCE_CHECKS:
            raise ValueError("Source availability audit exceeds reviewed per-run capacity")

    results = sorted(by_organization.values(), key=lambda item: item["sourceCode"])
    for item in results:
        item["countryIso3s"].sort()
    return results


def probe_homepage(url: str, client: httpx.Client) -> dict[str, Any]:
    """One metadata-only network request; redirects are NOT auto-followed."""
    if not approved_https_url(url):
        return {
            "status": "UNAPPROVED_HOST",
            "httpStatus": None,
            "redirectTarget": None,
        }
    try:
        response = client.head(
            url,
            follow_redirects=False,
            headers={
                "User-Agent": "WorldHealthVision-V2-Source-Availability-Audit/1.0",
                "Accept": "*/*",
            },
        )
    except httpx.TimeoutException:
        return {"status": "TIMEOUT", "httpStatus": None, "redirectTarget": None}
    except httpx.HTTPError:
        return {"status": "TRANSPORT_ERROR", "httpStatus": None, "redirectTarget": None}

    status = response.status_code
    safe_target = None
    if 300 <= status < 400:
        raw = response.headers.get("location", "")
        target = urljoin(url, raw)
        if approved_https_url(target):
            safe_target = target
        label = "REDIRECT_REVIEW_REQUIRED"
    elif status in (401, 403):
        label = "ACCESS_RESTRICTED"
    elif status == 429:
        label = "RATE_LIMITED"
    elif status in (405, 501):
        label = "HEAD_NOT_SUPPORTED"
    elif status >= 500:
        label = "UPSTREAM_ERROR"
    elif 200 <= status < 300:
        label = "SITE_RESPONDED"
    else:
        label = "HTTP_UNEXPECTED"

    return {"status": label, "httpStatus": status, "redirectTarget": safe_target}


def run_country_source_availability_audit(
    catalog_client: httpx.Client,
    public_site_client: httpx.Client,
) -> dict[str, Any]:
    sources = load_registered_country_sources(catalog_client)
    if not sources:
        raise ValueError("No reviewed country sources exist in catalog")
    results = []
    for source in sources:
        probe = probe_homepage(source["homepageUrl"], public_site_client)
        results.append({**source, **probe})

    statuses = dict(sorted(Counter(item["status"] for item in results).items()))
    return {
        "auditType": "COUNTRY_SOURCE_HOME_PAGE_AVAILABILITY_ONLY",
        "checkedAtUtc": datetime.now(UTC).isoformat(),
        "uniqueOrganizationCount": len(results),
        "applicableCountryCount": len({
            iso3 for item in results for iso3 in item["countryIso3s"]
        }),
        "statusCounts": statuses,
        "checks": results,
        "limitations": [
            "HTTP HEAD response is not evidence of a new published report or reliable statistics.",
            "ACCESS_RESTRICTED, HEAD_NOT_SUPPORTED, REDIRECT_REVIEW_REQUIRED and RATE_LIMITED need manual review, not automatic source rejection.",
            "No article body or statistics were downloaded, parsed, altered or republished.",
            "No dataset-specific reuse licence has been verified by this health audit.",
            "This is a finite, manual-run source availability audit, not permanent monitoring or a production data connector.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Read real national source catalog and emit one safe HEAD availability audit"
    )
    parser.add_argument(
        "--catalog-base-url",
        default=os.getenv("WHV_INGEST_CATALOG_BASE_URL", "http://localhost:8082"),
        help="Internal trusted catalog-service origin (or gateway)",
    )
    parser.add_argument("--output", default="-", help="JSON report path; '-' for stdout")
    args = parser.parse_args()

    with httpx.Client(
        base_url=args.catalog_base_url,
        timeout=12,
        trust_env=False,
    ) as catalog, httpx.Client(
        timeout=9,
        trust_env=False,
        follow_redirects=False,
        limits=httpx.Limits(max_connections=3),
    ) as websites:
        report = run_country_source_availability_audit(catalog, websites)

    serialized = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output == "-":
        print(serialized)
    else:
        path = Path(args.output)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(serialized + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
