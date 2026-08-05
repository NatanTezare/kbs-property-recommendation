"""
nlp_parser.py
-------------
Turns a free-text query (typed, or transcribed from speech on the frontend)
into a structured QueryIntent the fuzzy engine can reason over.

This is intentionally NOT a black-box ML model: it's a transparent NLP
pipeline built from tokenization, regex-based entity extraction, keyword/
gazetteer matching, and fuzzy string matching (difflib) for typo tolerance
on estate names ("kilimanni" -> "Kilimani"). That transparency is exactly
what you want to be able to defend in a viva -- you can point to the exact
rule that extracted each entity, rather than "the model decided".

Swap-in note: this module could later be replaced or augmented by a small
spaCy NER pipeline or an LLM call without changing its public interface
(parse_query -> QueryIntent), so the fuzzy engine and API never need to
change.
"""

import re
import difflib
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class QueryIntent:
    raw_text: str
    budget_kes: Optional[float] = None
    budget_qualifier: str = "around"       # "under" | "around" | "over"
    listing_type: Optional[str] = None      # "Rent" | "Sale"
    bedrooms: Optional[int] = None
    property_type: Optional[str] = None
    estate: Optional[str] = None
    max_distance_km: Optional[float] = None
    wants_security: bool = False
    wants_pets: bool = False
    wants_parking: bool = False
    wants_pool: bool = False
    wants_gym: bool = False
    wants_garden: bool = False
    wants_furnished: bool = False
    # importance weights the user implied (0.5 - 2.0), used to bias fuzzy scoring
    priority_weights: dict = field(default_factory=dict)
    unmatched_notes: list = field(default_factory=list)


PROPERTY_TYPES = ["apartment", "house", "villa", "maisonette", "studio", "bungalow"]

LISTING_RENT_WORDS = ["rent", "renting", "to let", "lease"]
LISTING_SALE_WORDS = ["buy", "buying", "purchase", "sale", "own", "owning"]

SECURITY_WORDS = ["secure", "security", "safe", "safety", "gated", "guarded"]
PET_WORDS = ["pet", "pets", "dog", "cat"]
PARKING_WORDS = ["parking", "garage"]
POOL_WORDS = ["pool", "swimming"]
GYM_WORDS = ["gym", "fitness"]
GARDEN_WORDS = ["garden", "yard", "outdoor space"]
FURNISHED_WORDS = ["furnished"]

IMPORTANCE_HIGH_WORDS = ["very important", "must have", "top priority", "essential", "non-negotiable", "really need"]
IMPORTANCE_LOW_WORDS = ["nice to have", "don't mind", "not too fussed", "optional"]

NUM_WORD_MULTIPLIER = {
    "k": 1_000, "thousand": 1_000,
    "m": 1_000_000, "million": 1_000_000, "mil": 1_000_000,
}

# Matches things like: 150k, 150,000, 15 million, 2.5m, KES 180000
# \b after the unit is critical -- without it, "5km" would match "k" as the
# unit (leaving "m" dangling) and silently become a budget of 5000.
MONEY_PATTERN = re.compile(
    r"(?:kes|ksh)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|m|mil|million)?\b",
    re.IGNORECASE,
)

BEDROOM_PATTERN = re.compile(r"(\d+)\s*(?:-|\s)?\s*(?:bed(?:room)?s?|br\b)", re.IGNORECASE)
DISTANCE_PATTERN = re.compile(r"(?:within|under|less than|no more than)?\s*(\d+(?:\.\d+)?)\s*km", re.IGNORECASE)


def _extract_budget(text: str) -> tuple[Optional[float], Optional[str]]:
    """Returns (budget_value, qualifier). Both are None if no budget was
    actually mentioned this turn -- callers must not invent a default
    qualifier when there's no number to qualify, otherwise a stray "around"
    silently overwrites a previously-set "under"/"over" on merge."""
    qualifier = None

    # Look for money-like mentions near budget-signal words first for precision
    budget_context = re.search(
        r"(?:budget|price|cost|around|about|approx(?:imately)?|under|below|over|above|for)\s*"
        r"(?:of|is|:)?\s*(kes|ksh)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|m|mil|million)?\b",
        text, re.IGNORECASE,
    )
    if budget_context:
        num_str, unit = budget_context.group(2), budget_context.group(3)
    else:
        # No budget-signal word nearby -- only accept a bare number as a
        # budget if it has an explicit currency prefix or magnitude unit
        # (e.g. "30k", "KES 45000"). A plain bare number like the "3" in
        # "3 br" or "5" in "5km" is NOT a budget and must be ignored.
        generic = re.search(
            r"(?:kes|ksh)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|m|mil|million)?\b"
            r"|([\d,]+(?:\.\d+)?)\s*(k|thousand|m|mil|million)\b",
            text, re.IGNORECASE,
        )
        if not generic:
            return None, None
        if generic.group(1):
            num_str, unit = generic.group(1), generic.group(2)
        else:
            num_str, unit = generic.group(3), generic.group(4)

    try:
        value = float(num_str.replace(",", ""))
    except ValueError:
        return None, None

    if unit:
        value *= NUM_WORD_MULTIPLIER.get(unit.lower(), 1)

    if re.search(r"\bunder\b|\bbelow\b|\bless than\b|\bmax(?:imum)?\b|\bno more than\b", text, re.IGNORECASE):
        qualifier = "under"
    elif re.search(r"\bover\b|\babove\b|\bat least\b|\bmore than\b|\bmin(?:imum)?\b", text, re.IGNORECASE):
        qualifier = "over"
    else:
        qualifier = "around"

    return value, qualifier


def _fuzzy_match_estate(text: str, known_estates: list[str]) -> Optional[str]:
    text_lower = text.lower()
    # 1. Direct substring match (handles multi-word estates cleanly)
    for estate in known_estates:
        if estate.lower() in text_lower:
            return estate
    # 2. Token-level fuzzy match to tolerate typos ("kilimanni", "westland")
    tokens = re.findall(r"[a-zA-Z']+", text_lower)
    for tok in tokens:
        if len(tok) < 4:
            continue
        close = difflib.get_close_matches(tok, [e.lower() for e in known_estates], n=1, cutoff=0.8)
        if close:
            for estate in known_estates:
                if estate.lower() == close[0]:
                    return estate
    return None


def _any_word(text: str, words: list[str]) -> bool:
    """Word-boundary matching, not naive substring -- otherwise short keywords
    like "own" (from listing-type detection) would false-positive inside
    unrelated words like "town", or "cat" inside "cathedral"."""
    return any(re.search(rf"\b{re.escape(w)}\b", text) for w in words)


def parse_query(text: str, known_estates: list[str]) -> QueryIntent:
    intent = QueryIntent(raw_text=text)
    lower = text.lower()

    # --- Budget ---
    budget, qualifier = _extract_budget(lower)
    intent.budget_kes = budget
    intent.budget_qualifier = qualifier

    # --- Listing type ---
    if _any_word(lower, LISTING_RENT_WORDS):
        intent.listing_type = "Rent"
    elif _any_word(lower, LISTING_SALE_WORDS):
        intent.listing_type = "Sale"

    # --- Bedrooms ---
    bed_match = BEDROOM_PATTERN.search(lower)
    if bed_match:
        intent.bedrooms = int(bed_match.group(1))
    elif "studio" in lower:
        intent.bedrooms = 0

    # --- Property type ---
    for ptype in PROPERTY_TYPES:
        if ptype in lower:
            intent.property_type = ptype.capitalize()
            break

    # --- Estate / location (fuzzy) ---
    intent.estate = _fuzzy_match_estate(text, known_estates)

    # --- Distance ---
    dist_match = DISTANCE_PATTERN.search(lower)
    if dist_match:
        intent.max_distance_km = float(dist_match.group(1))
    elif "close to work" in lower or "close to town" in lower or "close to cbd" in lower or "near cbd" in lower:
        intent.max_distance_km = 6.0  # treat "close" as an implicit ~6km fuzzy ceiling

    # --- Boolean preferences ---
    intent.wants_security = _any_word(lower, SECURITY_WORDS)
    intent.wants_pets = _any_word(lower, PET_WORDS)
    intent.wants_parking = _any_word(lower, PARKING_WORDS)
    intent.wants_pool = _any_word(lower, POOL_WORDS)
    intent.wants_gym = _any_word(lower, GYM_WORDS)
    intent.wants_garden = _any_word(lower, GARDEN_WORDS)
    intent.wants_furnished = _any_word(lower, FURNISHED_WORDS)

    # --- Importance weighting (bonus: lets "security is very important to me" outweigh other factors) ---
    weights = {}
    for feature, words in [
        ("security", SECURITY_WORDS), ("budget", ["budget", "price", "afford"]),
        ("location", ["location", "area", "estate"]), ("distance", ["distance", "commute", "close to work"]),
    ]:
        for phrase in IMPORTANCE_HIGH_WORDS:
            if phrase in lower and _any_word(lower, words):
                weights[feature] = 2.0
        for phrase in IMPORTANCE_LOW_WORDS:
            if phrase in lower and _any_word(lower, words):
                weights[feature] = 0.5
    intent.priority_weights = weights

    if intent.budget_kes is None:
        intent.unmatched_notes.append("No budget detected; ranking will not penalize price.")

    return intent