"""WHV Advisor — data-driven chat response builder."""

from __future__ import annotations

import re
from typing import Any

_TOPIC_PATTERNS_FR = {
    "cost": r"coût|prix|cher|dépens|abordable|afford|budget|pouvoir d'achat",
    "health": r"santé|health|espérance|médecin|hôpital|soin|couverture|vaccin|life expect",
    "retirement": r"retraite|retire|pension|expatri|s'installer|vivre à|vivre en",
    "economy": r"économi|croissance|pib|gdp|prospérit|richesse|revenus|salaire",
    "debt": r"dette|fiscal|budgétaire|déficit|endettement",
    "trade": r"commerce|export|import|ouverture|compétitiv",
    "labor": r"chômage|emploi|travail|labour|marché du travail|workforce",
    "inflation": r"inflation|prix|hausse des prix|pouvoir d'achat",
    "safety": r"sécurité|safe|crime|risque",
    "balance": r"balance|compte courant|extérieur|current account",
}

_TOPIC_PATTERNS_EN = {
    "cost": r"cost|price|expensive|afford|budget|purchasing power",
    "health": r"health|life expect|hospital|doctor|care|coverage|vaccine",
    "retirement": r"retire|pension|expat|live in|move to|settling",
    "economy": r"econom|growth|gdp|prosperity|wealth|income|salary",
    "debt": r"debt|fiscal|budget|deficit",
    "trade": r"trade|export|import|openness|competit",
    "labor": r"unemployment|employ|labor|labour|workforce|job",
    "inflation": r"inflation|price|purchasing power",
    "safety": r"safe|crime|risk|security",
    "balance": r"balance|current account|external",
}

_LENS_TOPIC_MAP = {
    "PROSPERITY_LEVEL": "economy",
    "GROWTH_MOMENTUM": "economy",
    "PRICE_PRESSURE": "inflation",
    "LABOR_STRESS": "labor",
    "EXTERNAL_BALANCE": "balance",
    "ECONOMIC_SCALE": "economy",
    "HEALTH_EXPENDITURE": "health",
    "LIFE_EXPECTANCY": "health",
    "FISCAL_HEALTH": "debt",
    "TRADE_OPENNESS": "trade",
    "GENERAL_COST_LEVEL": "cost",
    "HOUSING_MARKET_HEAT": "cost",
    "CONSUMER_PRICE_PRESSURE": "inflation",
}

_TONE_LABEL_FR = {
    "POSITIVE": "positif",
    "BALANCED": "équilibré",
    "WATCH": "à surveiller",
    "STRESS": "sous pression",
    "CONTEXT": "contextuel",
}
_TONE_LABEL_EN = {
    "POSITIVE": "positive",
    "BALANCED": "balanced",
    "WATCH": "watch",
    "STRESS": "under pressure",
    "CONTEXT": "contextual",
}


def _detect_topics(question: str, lang: str) -> list[str]:
    q = question.lower()
    patterns = _TOPIC_PATTERNS_FR if lang == "fr" else _TOPIC_PATTERNS_EN
    return [topic for topic, pat in patterns.items() if re.search(pat, q)]


def _lens_list(snapshot: Any) -> list[Any]:
    if snapshot is None:
        return []
    return getattr(snapshot, "lenses", []) or []


def _country_name(eco_snapshot: Any, cost_snapshot: Any) -> str:
    for snap in (eco_snapshot, cost_snapshot):
        if snap is None:
            continue
        country = getattr(snap, "country", None)
        if country:
            name = getattr(country, "name", None) or getattr(country, "displayName", None)
            if name:
                return str(name)
    return ""


def _build_context_block(
    topics: list[str],
    eco_snapshot: Any,
    cost_snapshot: Any,
    lang: str,
) -> str:
    """Return bullet-point context lines for the detected topics, sourced from snapshot lenses."""
    all_lenses = _lens_list(eco_snapshot) + _lens_list(cost_snapshot)
    if not all_lenses:
        return ""

    tone_label = _TONE_LABEL_FR if lang == "fr" else _TONE_LABEL_EN
    lines: list[str] = []

    # Topics → relevant lens_codes
    relevant_codes = {code for code, t in _LENS_TOPIC_MAP.items() if t in topics}

    for lens in all_lenses:
        code = getattr(lens, "lensCode", None)
        if code not in relevant_codes:
            continue
        headline = getattr(lens, "headline", None)
        tone = getattr(lens, "tone", None)
        latest_val = getattr(lens, "latestValue", None)
        display_name = getattr(lens, "lensDisplayName", code)
        confidence = getattr(lens, "confidence", None)

        tone_str = tone_label.get(str(tone), str(tone).lower()) if tone else ""
        val_str = f" ({latest_val:.1f})" if latest_val is not None else ""
        conf_str = f" — confiance {confidence:.0%}" if confidence is not None else ""

        if lang == "fr":
            lines.append(f"- **{display_name}** : {headline}{val_str} [{tone_str}{conf_str}]")
        else:
            lines.append(f"- **{display_name}**: {headline}{val_str} [{tone_str}{conf_str}]")

    return "\n".join(lines)


def _no_data_response(lang: str, iso3: str | None) -> dict:
    country_hint = f" pour {iso3}" if iso3 else ""
    if lang == "fr":
        text = (
            f"Je n'ai pas encore de données économiques suffisantes{country_hint} "
            "pour répondre précisément à votre question. "
            "Essayez de sélectionner un pays avec des données disponibles, "
            "ou posez une question plus générale sur les indicateurs économiques."
        )
    else:
        text = (
            f"I don't have sufficient economic data{country_hint} "
            "to answer your question precisely yet. "
            "Try selecting a country with available data, "
            "or ask a more general question about economic indicators."
        )
    return {"answer": text, "sourcesUsed": [], "dataPoints": 0}


def build_advisor_response(
    question: str,
    iso3: str | None,
    lang: str,
    eco_snapshot: Any,
    cost_snapshot: Any,
) -> dict:
    topics = _detect_topics(question, lang)
    country_name = _country_name(eco_snapshot, cost_snapshot)
    all_lenses = _lens_list(eco_snapshot) + _lens_list(cost_snapshot)

    if not all_lenses:
        return _no_data_response(lang, iso3)

    context_block = _build_context_block(topics or list(_LENS_TOPIC_MAP.values()), eco_snapshot, cost_snapshot, lang)

    highlights = getattr(eco_snapshot, "highlights", None) if eco_snapshot else None
    highlights_text = ""
    if highlights:
        strength = getattr(highlights, "topStrength", None)
        risk = getattr(highlights, "topRisk", None)
        if lang == "fr":
            if strength:
                highlights_text += f"\n**Point fort** : {getattr(strength, 'headline', '')}."
            if risk:
                highlights_text += f"\n**Point de vigilance** : {getattr(risk, 'headline', '')}."
        else:
            if strength:
                highlights_text += f"\n**Strength**: {getattr(strength, 'headline', '')}."
            if risk:
                highlights_text += f"\n**Risk**: {getattr(risk, 'headline', '')}."

    sources_used: list[str] = []
    for lens in all_lenses:
        audit = getattr(lens, "sourceAudit", None)
        if audit:
            evidence = getattr(audit, "evidence", []) or []
            for ev in evidence:
                sc = getattr(ev, "sourceCodes", []) or []
                sources_used.extend(sc)
    sources_used = list(dict.fromkeys(sources_used))  # deduplicate, preserve order

    if lang == "fr":
        country_str = f" pour **{country_name}**" if country_name else ""
        intro = f"Voici ce que les données WHV indiquent{country_str} :\n\n"
        if not topics:
            intro = f"Vue d'ensemble des indicateurs WHV{country_str} :\n\n"
        answer = intro + (context_block or "_Aucun indicateur correspondant disponible._") + highlights_text
        if sources_used:
            answer += f"\n\n_Sources : {', '.join(sources_used[:6])}_"
    else:
        country_str = f" for **{country_name}**" if country_name else ""
        intro = f"Here is what WHV data shows{country_str}:\n\n"
        if not topics:
            intro = f"WHV indicator overview{country_str}:\n\n"
        answer = intro + (context_block or "_No matching indicator available._") + highlights_text
        if sources_used:
            answer += f"\n\n_Sources: {', '.join(sources_used[:6])}_"

    return {
        "answer": answer,
        "sourcesUsed": sources_used[:6],
        "dataPoints": len(all_lenses),
    }