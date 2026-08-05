# engine.py
"""
Inference Engine Module
Implements Forward Chaining + Fuzzy Membership Functions.
Imports rules and facts from knowledge_base.py.
"""

import math
from knowledge_base import RULES, PRIORITY_PROFILES

# ==========================================
# 1. FUZZY LOGIC MEMBERSHIP FUNCTIONS
# ==========================================
def fuzzy_budget_satisfaction(price, max_budget):
    """Fuzzy set: Degree of budget compliance in [0.0, 1.0]"""
    if max_budget <= 0: return 0.0
    price, max_budget = float(price), float(max_budget)
    if price <= max_budget:
        return 1.0
    elif price <= max_budget * 1.20:
        return 1.0 - ((price - max_budget) / (max_budget * 0.20))
    return 0.0

def fuzzy_distance_proximity(dist_km, max_dist_km):
    """Fuzzy set: Degree of proximity in [0.0, 1.0]"""
    dist_km, max_dist_km = float(dist_km), float(max_dist_km)
    if dist_km <= max_dist_km:
        return 1.0
    elif dist_km <= max_dist_km + 8.0:
        return 1.0 - ((dist_km - max_dist_km) / 8.0)
    return 0.0

def fuzzy_space_adequacy(size_sqm, bedrooms):
    """Fuzzy set: Degree of space per bedroom in [0.0, 1.0]"""
    if not size_sqm or math.isnan(float(size_sqm)): return 0.5
    try:
        br = float(bedrooms) if str(bedrooms).lower() != 'studio' else 1.0
    except ValueError:
        br = 1.0
    sqm_per_br = float(size_sqm) / max(br, 1.0)
    if sqm_per_br >= 40.0: return 1.0
    elif sqm_per_br >= 20.0: return (sqm_per_br - 20.0) / 20.0
    return 0.1

# ==========================================
# 2. FORWARD CHAINING INFERENCE ENGINE
# ==========================================
class ForwardChainingEngine:
    def __init__(self, property_data, working_facts):
        self.property = property_data
        self.facts = working_facts
        self.profile = PRIORITY_PROFILES.get(
            str(working_facts.get("priority_profile", "1")), 
            PRIORITY_PROFILES["1"]
        )

    def evaluate(self):
        """Runs forward chaining evaluation over all knowledge base rules."""
        raw_score = 0.0
        max_possible_score = 0.0
        reasoning_trace = []

        # Safely resolve property values
        p_price = float(self.property.get('Price_KES', self.property.get('price', 0)))
        p_bedrooms = str(self.property.get('Bedrooms', self.property.get('bedrooms', ''))).strip()
        p_listing_type = str(self.property.get('Listing_Type', self.property.get('listing_type', 'Rent'))).lower()
        p_estate = str(self.property.get('Estate', self.property.get('estate', ''))).lower()
        p_location_full = f"{p_estate} {str(self.property.get('County', self.property.get('county', '')))} {str(self.property.get('location', ''))}".lower()
        
        p_distance = float(self.property.get('Distance_CBD_KM', self.property.get('distance_cbd_km', 99)))
        p_security = str(self.property.get('Security_Rating', self.property.get('security_rating', '')))
        p_gated = str(self.property.get('Gated_Community', self.property.get('gated_community', '')))
        p_water = str(self.property.get('Water_Supply', self.property.get('water_supply', '')))
        p_elec = str(self.property.get('Electricity', self.property.get('electricity', '')))
        p_internet = str(self.property.get('Internet', self.property.get('internet', '')))
        p_pets = str(self.property.get('Pets_Allowed', self.property.get('pets_allowed', '')))
        p_flood = str(self.property.get('Flood_Risk', self.property.get('flood_risk', ''))).lower()
        p_traffic = str(self.property.get('Traffic_Level', self.property.get('traffic_level', ''))).lower()
        p_noise = str(self.property.get('Noise_Level', self.property.get('noise_level', ''))).lower()
        p_pool = str(self.property.get('Swimming_Pool', self.property.get('swimming_pool', '')))
        p_gym = str(self.property.get('Gym', self.property.get('gym', '')))
        p_cctv = str(self.property.get('CCTV', self.property.get('cctv', ''))).lower()
        p_size = self.property.get('Size_SQM', self.property.get('size_sqm'))

        target_est = str(self.facts.get("target_estate") or self.facts.get("location") or "").strip().lower()
        u_budget = float(self.facts.get("user_budget") or self.facts.get("budget") or 0)
        u_listing_type = str(self.facts.get("listing_type") or "Rent").lower()

        for rule in RULES:
            rule_type = rule["type"]
            base_weight = rule["base_weight"]
            fired = False
            pts = 0.0
            msg = ""

            # Accumulate positive weights for normalization denominator
            if base_weight > 0:
                max_possible_score += base_weight

            # 0. LISTING TYPE MISMATCH (Rent vs Sale)
            if rule_type == "listing_type_mismatch":
                if u_listing_type and p_listing_type and u_listing_type != p_listing_type:
                    fired = True
                    pts = base_weight
                    msg = f"Mismatch: Property is for {p_listing_type.capitalize()} (Requested {u_listing_type.capitalize()})"

            # 1. FUZZY BUDGET EVALUATION
            elif rule_type == "fuzzy_budget":
                if u_budget > 0:
                    mu = fuzzy_budget_satisfaction(p_price, u_budget)
                    if mu > 0:
                        fired = True
                        pts = mu * base_weight * self.profile["budget_mult"]
                        msg = f"Rent KES {int(p_price):,} fits budget (Fuzzy match: {int(mu*100)}%)"

            # 1B. SEVERE BUDGET OVERRUN PENALTY
            elif rule_type == "budget_overrun_penalty":
                if u_budget > 0 and p_price > (u_budget * 1.20):
                    fired = True
                    multiplier = min(5.0, p_price / u_budget)
                    pts = base_weight * multiplier
                    msg = f"Severe Budget Overrun: KES {int(p_price):,} exceeds budget of KES {int(u_budget):,}"

            # 2. BEDROOM MATCH
            elif rule_type == "exact_bedrooms":
                t_beds = str(self.facts.get("target_bedrooms") or self.facts.get("bedrooms") or "").strip()
                if t_beds and p_bedrooms == t_beds:
                    fired = True
                    pts = base_weight
                    msg = f"Exact bedroom match ({p_bedrooms} Beds)"

            # 3. FUZZY DISTANCE
            elif rule_type == "fuzzy_distance":
                max_dist = float(self.facts.get("max_distance_cbd") or self.facts.get("maxDistance") or 10)
                mu = fuzzy_distance_proximity(p_distance, max_dist)
                if mu > 0:
                    fired = True
                    pts = mu * base_weight * self.profile["distance_mult"]
                    msg = f"Commute proximity ({p_distance} km to CBD)"

            # 4. LOCATION MATCH
            elif rule_type == "exact_estate":
                if target_est and (target_est in p_location_full or p_estate in target_est):
                    fired = True
                    pts = base_weight
                    display_estate = self.property.get('Estate') or self.property.get('estate') or 'Requested Zone'
                    msg = f"Located in requested estate zone ({display_estate})"

            # 4B. LOCATION MISMATCH PENALTY
            elif rule_type == "location_mismatch":
                if target_est and not (target_est in p_location_full or p_estate in target_est):
                    fired = True
                    pts = base_weight
                    display_estate = self.property.get('Estate') or self.property.get('estate') or 'Other Area'
                    msg = f"Location mismatch ({display_estate} vs requested {target_est.capitalize()})"

            # 5. SECURITY
            elif rule_type == "high_security":
                if p_security == "Excellent" and p_gated in ["Yes", "True"]:
                    fired = True
                    pts = base_weight * self.profile["security_mult"]
                    msg = "Secure gated community with Excellent safety rating"

            elif rule_type == "low_security_penalty":
                if self.facts.get("require_gated") and p_security in ["Average", "Low"]:
                    fired = True
                    pts = base_weight
                    msg = "Penalty applied: Sub-optimal security rating"

            # 6. UTILITIES
            elif rule_type == "utility_reliability":
                if p_water in ['Reliable', 'Borehole Backup'] and p_elec in ['Reliable', 'Backup Generator']:
                    fired = True
                    pts = base_weight
                    msg = "Continuous borehole water & generator backup"

            # 7. FAMILY LIFESTYLE
            elif rule_type == "family_friendly":
                if self.facts.get("family_lifestyle") and p_flood not in ["high", "yes"] and p_security == "Excellent":
                    fired = True
                    pts = base_weight
                    msg = "Family friendly zone with low hazard risk"

            # 8. WORK FROM HOME
            elif rule_type == "wfh_ready":
                if self.facts.get("work_from_home") and p_internet in ['Fibre', '5G']:
                    fired = True
                    pts = base_weight
                    msg = "High-speed Fibre Internet ready for remote work"

            # 9. PET POLICY
            elif rule_type == "pet_incompatible":
                if self.facts.get("require_pets") and p_pets in ["No", "False"]:
                    fired = True
                    pts = base_weight
                    msg = "Pets Not Allowed"

            # 10. STUDENT FRIENDLY
            elif rule_type == "student_friendly":
                if p_distance <= 5.0 and p_bedrooms in ["1", "Studio"]:
                    fired = True
                    pts = base_weight
                    msg = "Student friendly single unit close to institutions"

            # 11. FLOOD HAZARD
            elif rule_type == "high_flood_risk":
                if p_flood in ["high", "yes"]:
                    fired = True
                    pts = base_weight
                    msg = "Warning: High flood hazard zone"

            # 12. NOISE & TRAFFIC
            elif rule_type == "high_noise_traffic":
                if p_traffic == "high" or p_noise == "high":
                    fired = True
                    pts = base_weight
                    msg = "Subject to high traffic/noise congestion"

            # 13. AMENITIES
            elif rule_type == "pool_and_gym":
                if p_pool in ["Yes", "True"] and p_gym in ["Yes", "True"]:
                    fired = True
                    pts = base_weight
                    msg = "Equipped with Swimming Pool & Fitness Gym"

            # 14. SPACE ADEQUACY
            elif rule_type == "fuzzy_space":
                mu = fuzzy_space_adequacy(p_size, p_bedrooms)
                if mu > 0:
                    fired = True
                    pts = mu * base_weight
                    msg = f"Spacious interior floor area ({p_size} m²)"

            # 15. CCTV SURVEILLANCE
            elif rule_type == "cctv_present":
                if (self.facts.get("require_cctv") or self.facts.get("require_security")) and p_cctv in ["yes", "true", "available"]:
                    fired = True
                    pts = base_weight
                    msg = "24/7 CCTV Surveillance active"

            if fired:
                raw_score += pts
                reasoning_trace.append(msg)

        # Calculate final percentage match (Clamp between 0% and 100%)
        if max_possible_score > 0:
            normalized_score = max(0, min(100, int(round((raw_score / max_possible_score) * 100))))
        else:
            normalized_score = 100

        return normalized_score, reasoning_trace


def run_recommendation_engine(properties, working_facts):
    """Executes forward chaining across all loaded property facts."""
    results = []
    for prop in properties:
        engine = ForwardChainingEngine(prop, working_facts)
        score, trace = engine.evaluate()
        
        prop_copy = dict(prop)
        prop_copy['matchScore'] = score
        prop_copy['score'] = score
        prop_copy['reasoningTrace'] = trace
        prop_copy['reasoning_trace'] = trace
        results.append(prop_copy)

    # Rank strictly by match score descending
    results.sort(key=lambda x: x['matchScore'], reverse=True)
    return results