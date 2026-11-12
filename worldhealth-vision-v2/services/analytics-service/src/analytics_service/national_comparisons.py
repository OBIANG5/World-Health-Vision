"""Country-first evidence comparison with NO silent methodology equivalence.

This module combines a documented national release (catalog) with *actually
stored* external observations (TimescaleDB). It deliberately does not infer
that matching indicator codes, similar values or the source being domestic
prove statistical comparability, and it does not compute a numerical 'gap'
until an explicit methodology review feature is introduced.

The result can be reused by a future editorial/media system without copying
unsourced numbers into scripts.
"""

from __future__ import annotations

import math
from datetime import UTC, date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from analytics_service.models import LatestSourceObservation


class NationalDocumentedRelease(BaseModel):
    releaseCode: str
    countryIso3: str
    sourceCode: str
    indicatorCode: str
    referenceYear: int
    valueNumeric: float
    unitLabel: str
    populationScope: str
    methodKind: str
    publicationStatus: str
    releaseDate: date
    title: str
    primaryEvidenceUrl: str
    corroborationUrl: str | None = None
    methodologyCaveat: str
    internationalComparisonNote: str
    verificationStatus: str
    reviewedOn: date


class LocalCatalogResponse(BaseModel):
    countryIso3: str
    localSourceCount: int
    localSources: list[dict] = Field(default_factory=list)
    documentedReleaseCount: int
    documentedReleases: list[NationalDocumentedRelease] = Field(default_factory=list)


class InternationalReference(BaseModel):
    sourceCode: str
    sourceDisplayName: str
    datasetCode: str
    periodStart: date
    periodEnd: date
    periodLabel: str
    numericValue: float
    valueStatus: Literal["OBSERVED", "ESTIMATED"]
    sourcePublishedAt: datetime | None = None
    fetchedAtUtc: datetime | None = None


class NationalReleaseComparison(BaseModel):
    releaseCode: str
    indicatorCode: str
    localSourceCode: str
    localReferenceYear: int
    internationalLatest: list[InternationalReference]
    status: Literal[
        "NO_INTERNATIONAL_OBSERVATIONS",
        "DIFFERENT_REFERENCE_PERIOD",
        "SAME_YEAR_METHOD_NOT_VERIFIED",
    ]
    comparableByMethod: bool = False
    numericalDifference: float | None = None
    explanation: str


class CountryNationalComparisons(BaseModel):
    countryIso3: str
    comparisonCount: int
    comparisons: list[NationalReleaseComparison]


def _select_independent_latest(
    country_iso3: str,
    indicator_code: str,
    observations: list[LatestSourceObservation],
) -> list[InternationalReference]:
    """Require matching ISO3/indicator, numeric finite values and publisher identity."""
    by_source: dict[str, LatestSourceObservation] = {}

    def fetch_epoch(item: LatestSourceObservation) -> float:
        # Normalize naive and timezone-aware provider timestamps consistently.
        stamp = item.fetchedAtUtc
        if stamp is None:
            return float("-inf")
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=UTC)
        return stamp.timestamp()

    for item in observations:
        if item.countryIso3 != country_iso3 or item.indicatorCode != indicator_code:
            continue
        if (
            item.numericValue is None
            or not math.isfinite(item.numericValue)
            or item.valueStatus not in {"OBSERVED", "ESTIMATED"}
            or not item.sourceCode
        ):
            continue
        # One publisher = one perspective, even if it offers multiple datasets.
        current = by_source.get(item.sourceCode)
        if current is None or (
            item.periodEnd, item.valueStatus == "OBSERVED", fetch_epoch(item)
        ) > (
            current.periodEnd, current.valueStatus == "OBSERVED",
            fetch_epoch(current),
        ):
            by_source[item.sourceCode] = item
    return [
        InternationalReference(
            sourceCode=item.sourceCode,
            sourceDisplayName=item.sourceDisplayName,
            datasetCode=item.datasetCode,
            periodStart=item.periodStart,
            periodEnd=item.periodEnd,
            periodLabel=item.periodLabel,
            numericValue=item.numericValue,
            valueStatus=item.valueStatus,
            sourcePublishedAt=item.sourcePublishedAt,
            fetchedAtUtc=item.fetchedAtUtc,
        )
        for item in sorted(by_source.values(), key=lambda x: x.sourceCode)
    ]


def compare_national_release(
    release: NationalDocumentedRelease,
    international: list[LatestSourceObservation],
) -> NationalReleaseComparison:
    """Avoid false conflict labels, independent of publication freshness."""
    candidates = _select_independent_latest(
        release.countryIso3, release.indicatorCode, international
    )
    if not candidates:
        status = "NO_INTERNATIONAL_OBSERVATIONS"
        explanation = (
            "This national release is documented, but no international observation "
            "for this indicator and country is currently stored. No missing or "
            "invented international numbers have been substituted."
        )
    elif any(
        record.periodStart.year == release.referenceYear
        and record.periodEnd.year == release.referenceYear
        and record.periodStart.month == 1
        and record.periodStart.day == 1
        and record.periodEnd.month == 12
        and record.periodEnd.day == 31
        for record in candidates
    ):
        status = "SAME_YEAR_METHOD_NOT_VERIFIED"
        explanation = (
            "At least one stored international record covers the same calendar "
            "year as the local release, but population coverage, census versus "
            "estimate and definitions have not been reviewed together. Values "
            "are shown side by side; no statistical agreement or numerical gap "
            "is asserted."
        )
    else:
        status = "DIFFERENT_REFERENCE_PERIOD"
        explanation = (
            "The local publication and the available international observations "
            "do not refer to the same complete calendar year. Differences in "
            "published numbers alone do not establish an error or a conflict. "
            "Compare dates, scope, sampling and revisions before drawing conclusions."
        )
    return NationalReleaseComparison(
        releaseCode=release.releaseCode,
        indicatorCode=release.indicatorCode,
        localSourceCode=release.sourceCode,
        localReferenceYear=release.referenceYear,
        internationalLatest=candidates,
        status=status,
        comparableByMethod=False,
        numericalDifference=None,
        explanation=explanation,
    )
