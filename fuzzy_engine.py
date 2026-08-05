"""
fuzzy_engine.py
----------------
The reasoning core of the system.

Design: rather than hard filters ("exclude anything over budget"), each
criterion is expressed as a FUZZY MEMBERSHIP FUNCTION that returns a
"degree of fit" between 0.0 and 1.0. A property that's 5% over budget with
excellent security can still outrank a property that's exactly on budget
in a bad location -- exactly the kind of nuanced trade-off classic
rule-based (crisp) expert systems can't express.

Membership functions implemented from first principles (no fuzzy library),
built on two primitive shapes:
  - right_shoulder(x, a, b): 1.0 for x<=a, 0.0 for x>=b, linear between
    (used for "smaller/closer is better" criteria: price ratio, distance)
  - triangle(x, a, b, c): peaks at b, 0 at/outside [a, c]
    (used for "closest to a target value is better": bedroom count)

Only criteria the user actually mentioned in their query are included in
the weighted aggregation -- unspecified criteria don't drag the score down
or inflate it. This is what makes the ranking explainable: we can report
exactly which fuzzy sets fired and by how much for any recommendation.
"""

import math
from dataclasses import dataclass, field

from models import Property
from nlp_parser import QueryIntent


# ---------- primitive membership shapes ----------

def right_shoulder(x: float, a: float, b: float) -> float:
    """1.0 while x <= a, falls linearly to 0.0 by x == b, 0.0 beyond."""
    if x <= a:
        return 1.0
    if x >= b:
        return 0.0
    return (b - x) / (b - a)


def left_shoulder(x: float, a: float, b: float) -> float:
    """0.0 while x <= a, rises linearly to 1.0 by x == b, 1.0 beyond."""
    if x <= a:
        return 0.0
    if x >= b:
        return 1.0
    return (x - a) / (b - a)


def triangle(x: float, a: float, b: float, c: float) -> float:
    """0 at/below a, peaks at 1.0 at b, back to 0 at/above c."""
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if x < b:
        return (x - a) / (b - a)
    return (c - x) / (c - b)


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


DEFAULT_WEIGHTS = {
    "budget": 1.0,
    "bedrooms": 0.8,
    "distance": 0.8,
    "security": 0.7,
    "location": 1.0,
    "amenities": 0.5,
    "property_type": 0.6,
    "listing_type": 1.0,
}


@dataclass
class MatchResult:
    property: Property
    score: float                     # 0-100 overall confidence
    breakdown: dict = field(default_factory=dict)   # criterion -> (membership, weight)
    explanation: list = field(default_factory=list)


def _estate_centroid(properties: list[Property], estate: str):
    pts = [(p.latitude, p.longitude) for p in properties if p.estate == estate]
    if not pts:
        return None
    lat = sum(p[0] for p in pts) / len(pts)
    lon = sum(p[1] for p in pts) / len(pts)
    return lat, lon


def score_property(prop: Property, intent: QueryIntent, properties: list[Property]) -> MatchResult:
    breakdown = {}
    explanation = []
    weights = dict(DEFAULT_WEIGHTS)
    for feature, mult in intent.priority_weights.items():
        if feature in weights:
            weights[feature] *= mult

    # --- Budget ---
    if intent.budget_kes and prop.price_kes > 0:
        ratio = prop.price_kes / intent.budget_kes
        if intent.budget_qualifier == "under":
            m = right_shoulder(ratio, 1.0, 1.35)
        elif intent.budget_qualifier == "over":
            m = left_shoulder(ratio, 0.7, 1.0)
        else:  # "around"
            m = triangle(ratio, 0.75, 1.0, 1.3)
        breakdown["budget"] = (m, weights["budget"])
        explanation.append(f"Budget fit {m*100:.0f}% (price is {ratio*100:.0f}% of stated budget)")

    # --- Bedrooms ---
    if intent.bedrooms is not None:
        diff = abs(prop.bedrooms - intent.bedrooms)
        m = max(0.0, 1.0 - diff * 0.35)
        breakdown["bedrooms"] = (m, weights["bedrooms"])
        explanation.append(f"Bedroom match {m*100:.0f}% ({prop.bedrooms} vs requested {intent.bedrooms})")

    # --- Distance to CBD / work ---
    if intent.max_distance_km is not None:
        m = right_shoulder(prop.distance_cbd_km, intent.max_distance_km, intent.max_distance_km * 1.6)
        breakdown["distance"] = (m, weights["distance"])
        explanation.append(f"Distance fit {m*100:.0f}% ({prop.distance_cbd_km}km vs desired <= {intent.max_distance_km}km)")

    # --- Security ---
    if intent.wants_security:
        m = prop.security_score
        breakdown["security"] = (m, weights["security"])
        explanation.append(f"Security fit {m*100:.0f}% (rated {prop.security_rating})")

    # --- Location (estate) ---
    if intent.estate:
        if prop.estate == intent.estate:
            m = 1.0
        else:
            centroid = _estate_centroid(properties, intent.estate)
            if centroid:
                dist = haversine_km(prop.latitude, prop.longitude, centroid[0], centroid[1])
                m = right_shoulder(dist, 2.0, 12.0)
            else:
                m = 0.2
        breakdown["location"] = (m, weights["location"])
        explanation.append(f"Location fit {m*100:.0f}% (property in {prop.estate}, requested {intent.estate})")

    # --- Property type ---
    if intent.property_type:
        m = 1.0 if prop.property_type == intent.property_type else 0.25
        breakdown["property_type"] = (m, weights["property_type"])
        explanation.append(f"Property type {'matches' if m == 1.0 else 'differs'} ({prop.property_type})")

    # --- Amenities (soft: fraction of requested amenities present) ---
    wanted = []
    if intent.wants_pets:
        wanted.append(prop.pets_allowed)
    if intent.wants_parking:
        wanted.append(prop.parking)
    if intent.wants_pool:
        wanted.append(prop.swimming_pool)
    if intent.wants_gym:
        wanted.append(prop.gym)
    if intent.wants_garden:
        wanted.append(prop.garden)
    if intent.wants_furnished:
        wanted.append(prop.furnished == "Fully")
    if wanted:
        m = sum(1 for w in wanted if w) / len(wanted)
        breakdown["amenities"] = (m, weights["amenities"])
        explanation.append(f"Amenities matched {sum(1 for w in wanted if w)}/{len(wanted)}")

    if not breakdown:
        # No criteria detected at all -- fall back to a neutral score so the
        # system still returns something sensible rather than an empty list.
        return MatchResult(property=prop, score=50.0, breakdown={}, explanation=["No specific criteria detected; neutral score."])

    total_weight = sum(w for _, w in breakdown.values())
    overall = sum(m * w for m, w in breakdown.values()) / total_weight
    return MatchResult(property=prop, score=round(overall * 100, 1), breakdown=breakdown, explanation=explanation)


def recommend(properties: list[Property], intent: QueryIntent, top_n: int = 5) -> list[MatchResult]:
    # Rent vs Sale is a hard categorical filter, not a fuzzy one -- a property
    # for sale can't "partially" satisfy someone who explicitly wants to rent.
    # Fuzzy sets are for genuinely gradual criteria (price fit, distance,
    # bedroom closeness); this keeps the engine honest about which of its
    # criteria are actually matters of degree.
    pool = properties
    if intent.listing_type:
        filtered = [p for p in properties if p.listing_type == intent.listing_type]
        if filtered:
            pool = filtered
        # if the filter would return nothing (e.g. bad data), fall back to the
        # full pool rather than showing an empty result set

    results = [score_property(p, intent, pool) for p in pool]
    results.sort(key=lambda r: r.score, reverse=True)
    return results[:top_n]