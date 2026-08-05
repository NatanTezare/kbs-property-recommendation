"""
dialogue.py
------------
Turns the one-shot recommender into a stateful conversational agent.

Responsibilities:
  1. Session/context memory -- a user doesn't have to repeat "in Kilimani,
     under 150k" every message; new turns MERGE onto prior intent.
  2. Refinement understanding -- "show me something cheaper", "closer to
     town instead", "no pool needed" adjust the existing intent rather
     than requiring a full new query.
  3. Reference resolution -- "tell me more about the second one" / "the
     Kilimani one" pulls detail from the last set of results shown.
  4. Clarifying questions -- if there's not enough signal yet to reason
     about (no budget, location, or bedrooms mentioned across the whole
     conversation), the agent asks instead of guessing.
  5. Natural language generation -- turns ranked MatchResults into a
     conversational reply (varied phrasing, not a templated dump),
     mentioning trade-offs the way a human agent would.

This stays a deterministic, explainable NLP pipeline (regex + rules) --
no external LLM call -- so every reply can be traced back to a specific
rule, which is what you want to be able to defend in a viva.
"""

import re
import random
import uuid
from dataclasses import dataclass, field
from typing import Optional

from nlp_parser import parse_query, QueryIntent
from fuzzy_engine import recommend, MatchResult


# ---------------- session store (in-memory; fine for a single local demo) ----------------

@dataclass
class Session:
    id: str
    intent: QueryIntent = field(default_factory=lambda: QueryIntent(raw_text=""))
    last_results: list = field(default_factory=list)   # list[MatchResult]
    turn_count: int = 0
    has_greeted: bool = False


SESSIONS: dict[str, Session] = {}


def get_or_create_session(session_id: str | None) -> Session:
    if session_id and session_id in SESSIONS:
        return SESSIONS[session_id]
    sid = session_id or str(uuid.uuid4())
    session = Session(id=sid)
    SESSIONS[sid] = session
    return session


# ---------------- small talk / meta detection ----------------

GREETING_RE = re.compile(r"^\s*(hi|hello|hey|habari|sasa|niaje)\b", re.IGNORECASE)
THANKS_RE = re.compile(r"\b(thanks|thank you|asante)\b", re.IGNORECASE)
RESET_RE = re.compile(r"\b(start over|new search|reset|forget (that|it|everything))\b", re.IGNORECASE)
STOP_RE = re.compile(r"^\s*(stop|wait|hold on|pause|never\s?mind|cancel)\s*[.!]?\s*$", re.IGNORECASE)
RECAP_RE = re.compile(
    r"\b(what did i (ask|say)|what have i (asked|told you|said)|remind me what|"
    r"what am i looking for|what are we looking for|summar(y|ize) (this|my search|what))\b",
    re.IGNORECASE,
)

# Two ways a user refers back to a previous result:
#   "tell me more about the second one" / "what about the second one"
#   "the second one" / "second one" / "number 2" / "#2"   <- bare, no lead-in phrase
REFERENCE_RE = re.compile(
    r"\b(?:tell me more about|more (?:info|details) on|what about)\s+(?:the\s+)?"
    r"(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|one|two|three|#?\d)\b",
    re.IGNORECASE,
)
BARE_REFERENCE_RE = re.compile(
    r"^\s*(?:the\s+)?(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|number\s*\d|#\d)"
    r"(?:\s+one|\s+option|\s+listing)?\s*[.!?]?\s*$",
    re.IGNORECASE,
)
ORDINAL_MAP = {"first": 0, "1st": 0, "one": 0, "1": 0, "second": 1, "2nd": 1, "two": 1, "2": 1,
               "third": 2, "3rd": 2, "three": 2, "3": 2, "fourth": 3, "4th": 3, "4": 3,
               "fifth": 4, "5th": 4, "5": 4}


def _ordinal_to_index(word: str) -> Optional[int]:
    word = word.lower().strip()
    if word in ORDINAL_MAP:
        return ORDINAL_MAP[word]
    digits = re.search(r"\d+", word)
    if digits:
        return ORDINAL_MAP.get(digits.group(0))
    return None


def _detect_reference(text: str, session: Session):
    if not session.last_results:
        return None
    m = REFERENCE_RE.search(text.lower()) or BARE_REFERENCE_RE.match(text.lower())
    if m:
        idx = _ordinal_to_index(m.group(1))
        if idx is not None and idx < len(session.last_results):
            return session.last_results[idx]
    # also try matching by estate/property name mentioned directly
    for r in session.last_results:
        if r.property.estate and r.property.estate.lower() in text.lower():
            return r
        if r.property.name and r.property.name.lower() in text.lower():
            return r
    return None


# ---------------- refinement modifiers ----------------

CHEAPER_RE = re.compile(r"\b(cheaper|less expensive|lower budget|reduce (?:the )?budget|more affordable)\b", re.IGNORECASE)
PRICIER_RE = re.compile(r"\b(more expensive|higher budget|bigger budget|increase (?:the )?budget|pricier|luxur\w*)\b", re.IGNORECASE)
CLOSER_RE = re.compile(r"\b(closer|nearer|shorter commute|less far)\b", re.IGNORECASE)
FURTHER_RE = re.compile(r"\b(further|farther|distance (?:doesn'?t|does not) matter|don'?t mind (?:the )?distance)\b", re.IGNORECASE)
MORE_BEDROOMS_RE = re.compile(r"\b(more bedrooms?|(?<!budget )bigger place|extra room)\b", re.IGNORECASE)
FEWER_BEDROOMS_RE = re.compile(r"\b(fewer bedrooms?|smaller place)\b", re.IGNORECASE)

AMENITY_GROUPS = {
    "wants_pets": ["pet", "pets"],
    "wants_parking": ["parking", "garage"],
    "wants_pool": ["pool", "swimming pool"],
    "wants_gym": ["gym"],
    "wants_garden": ["garden", "yard"],
    "wants_furnished": ["furnished"],
    "wants_security": ["security", "secure", "safety"],
}


def _apply_negations(text: str, intent: QueryIntent):
    lower = text.lower()
    for field_name, keywords in AMENITY_GROUPS.items():
        for kw in keywords:
            if re.search(rf"\b(no|without|don'?t (?:need|want)|skip|not interested in)\s+(?:a\s+)?{re.escape(kw)}", lower):
                setattr(intent, field_name, False)


def _apply_refinements(text: str, intent: QueryIntent) -> list[str]:
    """Mutates intent in place based on relative refinement language. Returns notes for the reply."""
    notes = []

    if CHEAPER_RE.search(text):
        if intent.budget_kes:
            intent.budget_kes = round(intent.budget_kes * 0.8)
            intent.budget_qualifier = "under"
            notes.append(f"looking under ~KES {intent.budget_kes:,.0f} now")
        else:
            notes.append("noted -- what's a rough budget so I can find cheaper options?")

    if PRICIER_RE.search(text):
        if intent.budget_kes:
            intent.budget_kes = round(intent.budget_kes * 1.3)
            notes.append(f"opening it up to ~KES {intent.budget_kes:,.0f}")
        else:
            notes.append("noted -- happy to look at pricier options once I know your ballpark budget")

    if CLOSER_RE.search(text):
        if intent.max_distance_km:
            intent.max_distance_km = round(intent.max_distance_km * 0.65, 1)
        else:
            intent.max_distance_km = 5.0
        notes.append(f"prioritizing under ~{intent.max_distance_km}km to the CBD")

    if FURTHER_RE.search(text):
        intent.max_distance_km = None
        notes.append("distance is no longer a constraint")

    if MORE_BEDROOMS_RE.search(text):
        if intent.bedrooms is not None:
            intent.bedrooms += 1
            notes.append(f"bumped it up to {intent.bedrooms} bedrooms")

    if FEWER_BEDROOMS_RE.search(text):
        if intent.bedrooms is not None and intent.bedrooms > 0:
            intent.bedrooms -= 1
            notes.append(f"down to {intent.bedrooms} bedrooms")

    _apply_negations(text, intent)
    return notes


def _merge_intent(base: QueryIntent, new: QueryIntent) -> QueryIntent:
    """New turn's explicitly-detected fields override the accumulated session intent;
    unmentioned fields (None/False) keep whatever was already known."""
    merged = QueryIntent(raw_text=new.raw_text)
    for f in base.__dataclass_fields__:
        base_val = getattr(base, f)
        new_val = getattr(new, f)
        if f == "raw_text":
            continue
        if f == "priority_weights":
            merged_weights = dict(base_val)
            merged_weights.update(new_val)
            setattr(merged, f, merged_weights)
            continue
        if f == "unmatched_notes":
            setattr(merged, f, new_val)
            continue
        # booleans: only "upgrade" True; never silently revert to False from a merge
        if isinstance(new_val, bool):
            setattr(merged, f, base_val or new_val)
        else:
            setattr(merged, f, new_val if new_val is not None else base_val)
    return merged


# ---------------- has-enough-signal check ----------------

def _has_enough_signal(intent: QueryIntent) -> bool:
    return any([
        intent.budget_kes, intent.bedrooms is not None, intent.estate,
        intent.max_distance_km, intent.wants_security, intent.property_type,
        intent.wants_pool, intent.wants_pets, intent.wants_parking,
        intent.wants_gym, intent.wants_garden, intent.wants_furnished,
    ])


CLARIFYING_QUESTIONS = [
    "I can help with that -- roughly what's your budget, and which part of Nairobi are you thinking?",
    "Happy to search! Give me at least a budget or an area to start narrowing things down.",
    "Sure -- how many bedrooms are you after, and any part of town you're set on?",
]


def _recap(intent: QueryIntent) -> str:
    parts = []
    if intent.estate:
        parts.append(f"an area around {intent.estate}")
    if intent.bedrooms is not None:
        parts.append(f"{intent.bedrooms} bedroom{'s' if intent.bedrooms != 1 else ''}")
    if intent.budget_kes:
        qualifier_word = {"under": "under", "over": "over", "around": "around"}.get(intent.budget_qualifier, "around")
        parts.append(f"a budget {qualifier_word} KES {intent.budget_kes:,.0f}")
    if intent.listing_type:
        parts.append(f"to {intent.listing_type.lower()}")
    if intent.max_distance_km:
        parts.append(f"within about {intent.max_distance_km}km of the CBD")
    if intent.wants_security:
        parts.append("good security")
    extras = [name for flag, name in [
        (intent.wants_pool, "a pool"), (intent.wants_pets, "pets allowed"),
        (intent.wants_parking, "parking"), (intent.wants_gym, "a gym"),
        (intent.wants_garden, "a garden"), (intent.wants_furnished, "furnished"),
    ] if flag]
    if extras:
        parts.append(", ".join(extras))

    if not parts:
        return "So far you haven't told me anything specific yet -- what's your budget or preferred area?"
    return "So far you've mentioned: " + ", ".join(parts) + ". Want to adjust anything, or should I search on that?"


# ---------------- natural language reply generation ----------------

OPENERS_STRONG = ["Here's what stood out:", "A few good ones came up:", "I found some solid matches:"]
OPENERS_WEAK = ["Nothing's a perfect fit, but here's the closest:", "Slim pickings for that exact combo, but here's what's closest:"]
FOLLOWUPS = [
    "Want me to narrow it down by budget, security, or distance?",
    "Say the word if you'd like something cheaper, closer, or with different amenities.",
    "Let me know if you want to adjust budget, bedrooms, or area and I'll refine this.",
]


def _one_line_reason(result: MatchResult) -> str:
    if not result.breakdown:
        return "a broad match based on what you've told me so far"
    best_key = max(result.breakdown, key=lambda k: result.breakdown[k][0])
    labels = {
        "budget": "fits your budget well", "bedrooms": "matches your bedroom count",
        "distance": "close to where you need to be", "security": "well rated for security",
        "location": "right in the area you wanted", "property_type": "the property type you're after",
        "listing_type": "the right listing type", "amenities": "has the amenities you mentioned",
    }
    return labels.get(best_key, "a good overall fit")


def _describe_property_detail(result: MatchResult) -> str:
    p = result.property
    bits = [f"{p.name} is a {p.bedrooms}-bedroom {p.property_type.lower()} in {p.estate}",
            f"listed to {p.listing_type.lower()} at KES {p.price_kes:,.0f}",
            f"about {p.distance_cbd_km}km from the CBD, with {p.security_rating.lower()} security"]
    extras = []
    if p.parking: extras.append("parking")
    if p.swimming_pool: extras.append("a pool")
    if p.gym: extras.append("a gym")
    if p.garden: extras.append("a garden")
    if p.pets_allowed: extras.append("pets allowed")
    extra_str = f" It also has {', '.join(extras)}." if extras else ""
    return ". ".join(bits) + f". {extra_str} Overall it's a {result.score}% fit for what you've described."


def handle_message(session: Session, text: str, properties: list, known_estates: list[str]) -> dict:
    session.turn_count += 1
    text = text.strip()
    reply_notes = []

    if RESET_RE.search(text):
        session.intent = QueryIntent(raw_text="")
        session.last_results = []
        return {"reply": "No problem, starting fresh. What are you looking for?", "results": [],
                "parsed_intent": {}, "session_id": session.id}

    if STOP_RE.match(text):
        return {"reply": "Okay, pausing here. Just tell me whenever you want to pick the search back up.",
                "results": [], "parsed_intent": vars(session.intent), "session_id": session.id}

    if RECAP_RE.search(text.lower()):
        return {"reply": _recap(session.intent), "results": session.last_results,
                "parsed_intent": vars(session.intent), "session_id": session.id}

    if GREETING_RE.match(text) and session.turn_count <= 1:
        session.has_greeted = True
        return {"reply": "Hey! I'm Sema -- tell me what kind of place you're after (budget, area, "
                          "bedrooms, anything that matters to you) and I'll search Nairobi listings for you.",
                "results": [], "parsed_intent": {}, "session_id": session.id}

    if THANKS_RE.search(text) and len(text.split()) < 6:
        return {"reply": "Anytime! Let me know if you want to keep refining the search.",
                "results": [], "parsed_intent": {}, "session_id": session.id}

    # --- reference to a specific earlier result ---
    referenced = _detect_reference(text, session)
    if referenced:
        return {"reply": _describe_property_detail(referenced), "results": [referenced],
                "parsed_intent": vars(session.intent), "session_id": session.id}

    # --- parse this turn, merge onto session memory, apply refinements ---
    turn_intent = parse_query(text, known_estates)
    session.intent = _merge_intent(session.intent, turn_intent)
    reply_notes.extend(_apply_refinements(text, session.intent))

    if not _has_enough_signal(session.intent):
        return {"reply": random.choice(CLARIFYING_QUESTIONS), "results": [],
                "parsed_intent": vars(session.intent), "session_id": session.id}

    results = recommend(properties, session.intent, top_n=3)
    session.last_results = results

    if not results:
        return {"reply": "I couldn't find anything close to that -- want to loosen a criterion?",
                "results": [], "parsed_intent": vars(session.intent), "session_id": session.id}

    top_score = results[0].score
    opener = random.choice(OPENERS_STRONG if top_score >= 60 else OPENERS_WEAK)

    lines = [opener]
    if reply_notes:
        lines.append("(" + "; ".join(reply_notes) + ".)")

    for i, r in enumerate(results, 1):
        lines.append(f"{i}. {r.property.name} in {r.property.estate} -- KES {r.property.price_kes:,.0f}, "
                      f"{r.property.bedrooms}BR, {r.score}% fit ({_one_line_reason(r)}).")

    lines.append(random.choice(FOLLOWUPS))

    return {
        "reply": "\n".join(lines),
        "results": results,
        "parsed_intent": {k: v for k, v in vars(session.intent).items() if k != "raw_text"},
        "session_id": session.id,
    }