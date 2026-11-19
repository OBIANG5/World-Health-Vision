"""Dataset-specific reuse-rights review contracts for World-Vision (DATA-1B2A).

A URL, public dataset or successful API response is NOT a redistribution grant.
This module is an internal research record, not authentication, a legal opinion,
a signature verifier, or permission to publish data.
"""
from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class ReviewStatus(str, Enum):
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    NEEDS_PROVIDER_CLARIFICATION = "NEEDS_PROVIDER_CLARIFICATION"
    APPROVED_WITH_CONDITIONS = "APPROVED_WITH_CONDITIONS"
    DENIED = "DENIED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class EvidenceApplicability(str, Enum):
    GENERAL_CONTEXT_ONLY = "GENERAL_CONTEXT_ONLY"
    DATASET_SPECIFIC_TERMS = "DATASET_SPECIFIC_TERMS"
    PROVIDER_WRITTEN_CONFIRMATION = "PROVIDER_WRITTEN_CONFIRMATION"
    DIFFERENT_PRODUCT_NOT_APPLICABLE = "DIFFERENT_PRODUCT_NOT_APPLICABLE"


class ReviewedRight(str, Enum):
    PUBLIC_DISPLAY = "PUBLIC_DISPLAY"
    PUBLIC_COMMERCIAL_DISPLAY = "PUBLIC_COMMERCIAL_DISPLAY"
    API_REDISTRIBUTION = "API_REDISTRIBUTION"
    HISTORICAL_ARCHIVE = "HISTORICAL_ARCHIVE"


class RightsEvidence(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    reference_url: HttpUrl
    applicability: EvidenceApplicability
    document_title: str = Field(min_length=3, max_length=250)
    observed_at_utc: datetime
    applicable_dataset_code: str | None = None
    content_sha256: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")
    caveat: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def validate_source_scope(self):
        if self.observed_at_utc.tzinfo is None:
            raise ValueError("Evidence observation time must be timezone-aware")
        if self.applicability in {
            EvidenceApplicability.DATASET_SPECIFIC_TERMS,
            EvidenceApplicability.PROVIDER_WRITTEN_CONFIRMATION,
        } and not self.applicable_dataset_code:
            raise ValueError("Dataset-specific evidence must name the dataset")
        return self


class RightsReviewDossier(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    institution_code: str = Field(pattern=r"^[A-Z][A-Z0-9_]{1,31}$")
    dataset_code: str = Field(pattern=r"^[A-Z][A-Z0-9_]{2,127}$")
    jurisdiction_iso3: str = Field(pattern=r"^[A-Z]{3}$")
    review_status: ReviewStatus
    evaluated_at_utc: datetime
    evaluator_id: str | None = None
    valid_until_utc: datetime | None = None
    reviewed_rights: frozenset[ReviewedRight] = frozenset()
    evidence: tuple[RightsEvidence, ...] = ()
    unresolved_questions: tuple[str, ...] = ()
    attribution_instructions: str | None = None
    reviewer_notes: str | None = None

    @model_validator(mode="after")
    def validate_dossier(self):
        if self.evaluated_at_utc.tzinfo is None:
            raise ValueError("Evaluation must use a timezone-aware timestamp")
        if self.valid_until_utc is not None:
            if self.valid_until_utc.tzinfo is None or self.valid_until_utc <= self.evaluated_at_utc:
                raise ValueError("Review expiry must be after evaluation")
        if self.review_status is ReviewStatus.APPROVED_WITH_CONDITIONS:
            if not self.evaluator_id or not self.evaluator_id.strip():
                raise ValueError("A specific human reviewer is required")
            if self.valid_until_utc is None or not self.reviewed_rights:
                raise ValueError("Approved conditions must have explicit expiry and rights")
            if not self.attribution_instructions:
                raise ValueError("Attribution instructions must be explicit, even if 'none'")
            has_dataset_specific_evidence = any(
                e.applicability in {
                    EvidenceApplicability.DATASET_SPECIFIC_TERMS,
                    EvidenceApplicability.PROVIDER_WRITTEN_CONFIRMATION,
                }
                and e.applicable_dataset_code == self.dataset_code
                for e in self.evidence
            )
            if not has_dataset_specific_evidence:
                raise ValueError("General open-data pages cannot approve exact dataset")
        elif self.reviewed_rights:
            raise ValueError("Unapproved review cannot grant redistribution permissions")
        return self


class ReuseAdvice(BaseModel):
    model_config = ConfigDict(frozen=True)
    status: Literal["BLOCKED", "REVIEWED_CONDITIONS_RECORDED"]
    reasons: tuple[str, ...]


def inspect_reuse_claim(
    dossier: RightsReviewDossier,
    *,
    institution_code: str,
    dataset_code: str,
    jurisdiction_iso3: str,
    operation: ReviewedRight,
    evaluated_at: datetime,
) -> ReuseAdvice:
    """Advisory review ONLY: even a positive review cannot unlock public services.

    Production authorisation additionally requires a separately authenticated,
    audited rights registry and verified deployment policy. No caller in
    ingestion, Timeseries or Gateway may interpret this as a publication token.
    """
    reasons: list[str] = []
    if evaluated_at.tzinfo is None:
        raise ValueError("Gate evaluation requires timezone-aware time")
    if (
        dossier.institution_code != institution_code
        or dossier.dataset_code != dataset_code
        or dossier.jurisdiction_iso3 != jurisdiction_iso3
    ):
        reasons.append("SOURCE_DATASET_JURISDICTION_MISMATCH")
    if dossier.review_status is not ReviewStatus.APPROVED_WITH_CONDITIONS:
        reasons.append("DATASET_REUSE_NOT_APPROVED")
    if dossier.evaluated_at_utc > evaluated_at:
        reasons.append("REVIEW_NOT_YET_VALID")
    if dossier.valid_until_utc is None or dossier.valid_until_utc <= evaluated_at:
        reasons.append("RIGHTS_REVIEW_EXPIRED_OR_UNDATED")
    if operation not in dossier.reviewed_rights:
        reasons.append("REQUESTED_OPERATION_NOT_GRANTED")
    if reasons:
        return ReuseAdvice(status="BLOCKED", reasons=tuple(reasons))
    return ReuseAdvice(
        status="REVIEWED_CONDITIONS_RECORDED",
        reasons=("HUMAN_REVIEW_ALONE_DOES_NOT_AUTHORIZE_PRODUCTION_PUBLICATION",),
    )


def ibge_census_4714_initial_review(*, observed_at: datetime | None = None) -> RightsReviewDossier:
    """Context-only registry: never claim that the exact table is licensed."""
    now = observed_at or datetime.now(UTC)
    return RightsReviewDossier(
        institution_code="IBGE",
        dataset_code="CENSO2022_4714",
        jurisdiction_iso3="BRA",
        review_status=ReviewStatus.NEEDS_PROVIDER_CLARIFICATION,
        evaluated_at_utc=now,
        evidence=(
            RightsEvidence(
                reference_url="https://www.ibge.gov.br/acesso-informacao/dados-abertos.html",
                document_title="IBGE Dados Abertos portal",
                applicability=EvidenceApplicability.GENERAL_CONTEXT_ONLY,
                observed_at_utc=now,
                caveat="A general open data policy is not the license for this exact SIDRA table.",
            ),
            RightsEvidence(
                reference_url="https://www.ibge.gov.br/np_download/novoportal/documentos_institucionais/Plano_de_Dados_Abertos_IBGE_2024_2025.pdf",
                document_title="IBGE Plano de Dados Abertos 2024-2025",
                applicability=EvidenceApplicability.GENERAL_CONTEXT_ONLY,
                observed_at_utc=now,
                caveat="Plan and definition of open licenses do not prove actual conditions for table 4714/variable 93.",
            ),
            RightsEvidence(
                reference_url="https://servicodados.ibge.gov.br/api/docs/agregados?versao=3",
                document_title="IBGE aggregated data API documentation",
                applicability=EvidenceApplicability.GENERAL_CONTEXT_ONLY,
                observed_at_utc=now,
                caveat="Public query endpoint documents technical access, not permission to resell or redistribute.",
            ),
        ),
        unresolved_questions=(
            "Locate the exact dataset-level reuse terms for aggregate 4714 / variable 93.",
            "Determine commercial display, API redistribution, historical archiving and attribution conditions separately.",
            "Verify quota, rate, cache, modification semantics and official correction history.",
            "Preserve a dated evidence digest; request written clarification if terms remain ambiguous.",
        ),
        reviewer_notes="Not approved for public Atlas, exports, commercial reuse or Timeseries publication.",
    )
