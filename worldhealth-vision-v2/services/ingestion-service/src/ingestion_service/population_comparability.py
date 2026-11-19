"""DATA-1B3A: provenance-aware IBGE Census vs WDI population comparison.

The primary scientific output is a methodological assessment, NOT a percentage
difference. Sources may share national statistical-office inputs. A Census
resident count with imputations (reference 31 July 2022) is not a second
independent midyear WDI population estimate (approx. July 2022).

No API, Timeseries write, commercial release or automatic rights approval.
"""
from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PopulationMethod(str, Enum):
    NATIONAL_RESIDENT_CENSUS_WITH_IMPUTATION = "NATIONAL_RESIDENT_CENSUS_WITH_IMPUTATION"
    INTERNATIONAL_DE_FACTO_MIDYEAR_ESTIMATE = "INTERNATIONAL_DE_FACTO_MIDYEAR_ESTIMATE"


class ComparableStatus(str, Enum):
    MISSING_SOURCE = "MISSING_SOURCE"
    INCOMPATIBLE_COUNTRY = "INCOMPATIBLE_COUNTRY"
    INCOMPATIBLE_YEAR = "INCOMPATIBLE_YEAR"
    INCOMPATIBLE_UNIT = "INCOMPATIBLE_UNIT"
    INCOMPATIBLE_POPULATION_CONCEPT = "INCOMPATIBLE_POPULATION_CONCEPT"
    REFERENCE_TIME_AND_METHOD_DIFFER = "REFERENCE_TIME_AND_METHOD_DIFFER"
    METHOD_REVIEW_REQUIRED = "METHOD_REVIEW_REQUIRED"


class PopulationSourceSpec(BaseModel):
    """Typed source reference. The research numeric value is never serialized."""
    model_config = ConfigDict(frozen=True, extra="forbid")
    institution_code: str
    dataset_code: str
    indicator_code: str
    country_iso3: str = Field(pattern=r"^[A-Z]{3}$")
    year: int = Field(ge=1800, le=2200)
    unit: Literal["PERSONS", "THOUSANDS_OF_PERSONS"]
    population_concept: Literal["RESIDENT_DE_JURE", "DE_FACTO_RESIDENT"]
    method: PopulationMethod
    reference_instant: Literal["2022-07-31_CENSUS", "2022_MIDYEAR_ESTIMATE", "UNKNOWN"]
    source_data_dependency: Literal[
        "PRIMARY_FIELD_ENUMERATION_WITH_IMPUTATION",
        "UNRESOLVED_NATIONAL_AND_UN_MODEL_INPUTS",
        "UNKNOWN",
    ]
    response_sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    evidence_level: Literal["VERIFIED_PRIVATE_BRONZE", "NO_VERIFIED_SOURCE"]
    rights_status: Literal["REVIEW_REQUIRED", "REVIEWED_WITH_CONDITIONS", "DENIED"]
    method_document_url: str
    observation_value: int | None = Field(default=None, exclude=True, repr=False)

    @model_validator(mode="after")
    def verify_private_value(self):
        if self.evidence_level == "VERIFIED_PRIVATE_BRONZE":
            if (self.observation_value is None or isinstance(self.observation_value, bool)
                or not 1 <= self.observation_value <= 1_000_000_000):
                raise ValueError("Verified population source requires sane private integer")
        elif self.observation_value is not None:
            raise ValueError("Missing source may not invent a numeric observation")
        return self


class PopulationComparabilityAssessment(BaseModel):
    """Conservative decision: never infer a statistical conflict from two rows."""
    model_config = ConfigDict(frozen=True, extra="forbid")
    country_iso3: str
    requested_year: int
    status: ComparableStatus
    reasons: tuple[str, ...]
    source_ids: tuple[str, str]
    source_response_sha256s: tuple[str, str]
    first_reference: str
    second_reference: str
    shared_upstream_input_status: Literal[
        "UNKNOWN_POSSIBLE_SHARED_NATIONAL_STATISTICAL_INPUT"
    ] = "UNKNOWN_POSSIBLE_SHARED_NATIONAL_STATISTICAL_INPUT"
    independent_corrobation_established: Literal[False] = False
    numeric_delta_persons: None = None
    numeric_difference_percent: None = None
    headline_agreement_or_disagreement: None = None
    full_methodological_comparability_approved: Literal[False] = False
    commercial_display_authorized: Literal[False] = False
    timeseries_publication: Literal["NOT_ATTEMPTED"] = "NOT_ATTEMPTED"
    publication_status: Literal["RESEARCH_ONLY_BLOCKED"] = "RESEARCH_ONLY_BLOCKED"


def assess_population_comparability(
    national: PopulationSourceSpec | None,
    international: PopulationSourceSpec | None,
) -> PopulationComparabilityAssessment:
    """No averaging, ranking, correlation score, or invented agreement.

    The explicit country/year/unit/concept checks precede any method decision.
    In particular, SAME_YEAR and both values present are never enough to
    permit subtracting them or claiming either provider is wrong.
    """
    if national is None or international is None:
        reference = national or international
        return PopulationComparabilityAssessment(
            country_iso3=reference.country_iso3 if reference else "BRA",
            requested_year=reference.year if reference else 2022,
            status=ComparableStatus.MISSING_SOURCE,
            reasons=("BOTH_PRIVATE_SOURCE_VERSIONS_REQUIRED",),
            source_ids=(
                national.institution_code if national else "MISSING",
                international.institution_code if international else "MISSING",
            ),
            source_response_sha256s=(
                national.response_sha256 if national else "MISSING",
                international.response_sha256 if international else "MISSING",
            ),
            first_reference=national.reference_instant if national else "UNKNOWN",
            second_reference=international.reference_instant if international else "UNKNOWN",
        )
    reasons: list[str] = []
    if (national.evidence_level != "VERIFIED_PRIVATE_BRONZE"
        or international.evidence_level != "VERIFIED_PRIVATE_BRONZE"):
        status = ComparableStatus.MISSING_SOURCE
        reasons.append("PRIVATE_BYTES_AND_ACQUISITION_EVENTS_MUST_BE_VERIFIED")
    elif national.country_iso3 != international.country_iso3:
        status = ComparableStatus.INCOMPATIBLE_COUNTRY
        reasons.append("DIFFERENT_COUNTRY_SCOPES")
    elif national.year != international.year:
        status = ComparableStatus.INCOMPATIBLE_YEAR
        reasons.append("DIFFERENT_REFERENCE_YEARS")
    elif national.unit != international.unit:
        status = ComparableStatus.INCOMPATIBLE_UNIT
        reasons.append("UNIT_SCALE_DIFFERENCE_MUST_BE_TRANSFORMED_WITH_EVIDENCE")
    elif national.population_concept != international.population_concept:
        # NB: the two concepts differ even though both refer broadly to residents.
        status = ComparableStatus.INCOMPATIBLE_POPULATION_CONCEPT
        reasons.append("DE_JURE_CENSUS_VS_DE_FACTO_ESTIMATE_CONCEPTS")
    elif national.reference_instant != international.reference_instant:
        status = ComparableStatus.REFERENCE_TIME_AND_METHOD_DIFFER
        reasons.append("CENSUS_31_JULY_VS_WDI_MIDYEAR_REFERENCE")
    else:
        status = ComparableStatus.METHOD_REVIEW_REQUIRED
        reasons.append("SAME_REFERENCE_DOES_NOT_PROVE_METHOD_EQUIVALENCE")
    reasons.extend((
        "NATIONAL_CENSUS_INCLUDES_DOCUMENTED_IMPUTATION",
        "INTERNATIONAL_ESTIMATE_CAN_INCLUDE_NATIONAL_STATISTICAL_OFFICE_INPUTS",
        "BRAZIL_SPECIFIC_UPSTREAM_WDI_INPUT_RELATION_NOT_VERIFIED",
        "IBGE_DATASET_REUSE_RIGHTS_NOT_GRANTED",
        "NO_HUMAN_APPROVED_NORMALIZATION_TO_COMMON_REFERENCE_INSTANT",
    ))
    return PopulationComparabilityAssessment(
        country_iso3=national.country_iso3,
        requested_year=national.year,
        status=status,
        reasons=tuple(reasons),
        source_ids=(national.institution_code, international.institution_code),
        source_response_sha256s=(national.response_sha256, international.response_sha256),
        first_reference=national.reference_instant,
        second_reference=international.reference_instant,
    )
