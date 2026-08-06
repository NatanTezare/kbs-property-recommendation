# 1. WORKING MEMORY FACTS TEMPLATE
FACTS_TEMPLATE = {
    "user_budget": 30000,          # Fact 1: User's budget in KES
    "listing_type": "Rent",        # Fact 2: Desired listing type ("Rent" or "Sale")
    "property_type": "Apartment",  # Fact 3: Desired property type ("Apartment", "House", etc.)
    "security": "Standard",        # Fact 4: Desired security level ("Standard",  "High", etc.) 
    "target_bedrooms": "2",        # Fact 5: Desired number of bedrooms
    "target_estate": "Kilimani",   # Faact 6: Desired estate or neighborhood
    "max_distance_cbd": 10.0,      # Fact 7: Maximum distance from CBD in kilometers
    "priority_profile": "1",       # Fact 8: User's priority profile (1-5, where 1=Frugal Saver, 2=Commuter, 3=Safety First, 4=Family & Space, 5=WFH Professional)
    "require_cctv": True,          # Fact 9: CCTV requirement
    "require_pets": False,         # Fact 10: Pet-friendly requirement
    "require_gated": True,         # Fact 11: Gated community requirement
    "require_backup": True,        # Fact 12: Backup power requirement
    "require_water": True,         # Fact 13: Reliable water supply requirement
    "family_lifestyle": False,     # Fact 14: Family-oriented lifestyle requirement
}

# 2. PRIORITY PROFILES
PRIORITY_PROFILES = {
    "1": {"name": "Frugal Saver", "budget_mult": 1.5, "distance_mult": 0.8, "security_mult": 0.9},
    "2": {"name": "Commuter", "budget_mult": 0.8, "distance_mult": 1.5, "security_mult": 1.0},
    "3": {"name": "Safety First", "budget_mult": 0.9, "distance_mult": 0.7, "security_mult": 1.6},
    "4": {"name": "Family & Space", "budget_mult": 1.0, "distance_mult": 0.8, "security_mult": 1.3},
    "5": {"name": "WFH Professional", "budget_mult": 1.0, "distance_mult": 1.1, "security_mult": 1.0}
}

# 3. SPATIAL MAP NODES
NAIROBI_MAP = {
    "cbd": (0.0, 0.0),
    "westlands": (-2.0, 3.0),
    "kilimani": (-3.0, -1.0),
    "kileleshwa": (-2.5, 0.5),
    "lavington": (-4.0, -1.5),
    "karen": (-10.0, -8.0),
    "roysambu": (8.0, 9.0),
    "kasarani": (8.5, 9.5),
    "thika road": (9.0, 11.0),
    "usiu": (9.5, 11.5),
    "ruaka": (5.0, 10.0),
    "runda": (4.0, 8.0),
    "gigiri": (3.5, 7.5),
    "south b": (2.0, -4.0),
    "south c": (1.0, -5.0),
    "syokimau": (12.0, -12.0)
}

# 4. DECLARATIVE PRODUCTION RULES
RULES = [
    {
        "id": "R00_LISTING_TYPE_MISMATCH",
        "name": "Listing Type Mismatch Deduction",
        "category": "intent",
        "base_weight": -100.0,
        "type": "listing_type_mismatch"
    },
    {
        "id": "R01_BUDGET_COMPLIANCE",
        "name": "Fuzzy Budget Evaluation",
        "category": "budget",
        "base_weight": 40.0,
        "type": "fuzzy_budget"
    },
    {
        "id": "R01B_BUDGET_OVERRUN_PENALTY",
        "name": "Severe Budget Overrun Penalty",
        "category": "budget",
        "base_weight": -120.0,
        "type": "budget_overrun_penalty"
    },
    {
        "id": "R02_BEDROOM_MATCH",
        "name": "Bedroom Capacity Match",
        "category": "capacity",
        "base_weight": 20.0,
        "type": "exact_bedrooms"
    },
    {
        "id": "R03_COMMUTE_PROXIMITY",
        "name": "Fuzzy Commute Distance",
        "category": "distance",
        "base_weight": 30.0,
        "type": "fuzzy_distance"
    },
    {
        "id": "R04_ESTATE_LOCATION_MATCH",
        "name": "Target Estate Match",
        "category": "location",
        "base_weight": 30.0,
        "type": "exact_estate"
    },
    {
        "id": "R04B_LOCATION_MISMATCH_PENALTY",
        "name": "Location Mismatch Deduction",
        "category": "location",
        "base_weight": -30.0, 
        "type": "location_mismatch"
    },
    {
        "id": "R05_SECURITY_EXCELLENCE",
        "name": "High Safety Tier",
        "category": "security",
        "base_weight": 12.0,
        "type": "high_security"
    },
    {
        "id": "R06_SECURITY_PENALTY",
        "name": "Average Security Penalty",
        "category": "security",
        "base_weight": -15.0,
        "type": "low_security_penalty"
    },
    {
        "id": "R07_UTILITY_RELIABILITY",
        "name": "Uninterrupted Infrastructure",
        "category": "utilities",
        "base_weight": 10.0,
        "type": "utility_reliability"
    },
    {
        "id": "R08_FAMILY_FRIENDLY",
        "name": "Family Lifestyle Fit",
        "category": "lifestyle",
        "base_weight": 10.0,
        "type": "family_friendly"
    },
    {
        "id": "R09_WORK_FROM_HOME",
        "name": "Remote Work Readiness",
        "category": "lifestyle",
        "base_weight": 8.0,
        "type": "wfh_ready"
    },
    {
        "id": "R10_PET_POLICY_FILTER",
        "name": "Pet Incompatibility Deduction",
        "category": "policy",
        "base_weight": -40.0,
        "type": "pet_incompatible"
    },
    {
        "id": "R11_STUDENT_SUITABILITY",
        "name": "Student Commute Fit",
        "category": "lifestyle",
        "base_weight": 8.0,
        "type": "student_friendly"
    },
    {
        "id": "R12_FLOOD_HAZARD_PENALTY",
        "name": "High Flood Hazard Deduction",
        "category": "safety",
        "base_weight": -20.0,
        "type": "high_flood_risk"
    },
    {
        "id": "R13_NOISE_TRAFFIC_PENALTY",
        "name": "Congestion & Noise Nuisance",
        "category": "environment",
        "base_weight": -10.0,
        "type": "high_noise_traffic"
    },
    {
        "id": "R14_LUXURY_AMENITIES",
        "name": "Lifestyle Amenities",
        "category": "amenities",
        "base_weight": 7.0,
        "type": "pool_and_gym"
    },
    {
        "id": "R15_SPACE_ADEQUACY",
        "name": "Fuzzy Floor Area Adequacy",
        "category": "capacity",
        "base_weight": 8.0,
        "type": "fuzzy_space"
    },
    {
        "id": "R16_CCTV_MONITORING",
        "name": "Surveillance Bonus",
        "category": "security",
        "base_weight": 8.0,
        "type": "cctv_present"
    }
]