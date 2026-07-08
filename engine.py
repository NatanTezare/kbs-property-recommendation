import math

# Dynamic profiles mapping to weights totaling 100 points
PRIORITY_PROFILES = {
    "1": { "name": "The Frugal Saver", "budget": 50, "location": 15, "security": 15, "bedrooms": 10, "distance": 10 },
    "2": { "name": "The Commuter", "budget": 20, "location": 20, "security": 15, "bedrooms": 10, "distance": 35 },
    "3": { "name": "The Safety First", "budget": 20, "location": 15, "security": 40, "bedrooms": 15, "distance": 10 }
}

# Spatial Knowledge Base: Mapping neighborhoods to approximate (X, Y) grid coordinates
NAIROBI_MAP = {
    "cbd": (0, 0),
    "westlands": (-2, 3),
    "kilimani": (-3, -1),
    "roysambu": (8, 9),
    "thika road": (9, 11),
    "usiu": (9.5, 11.5)  # Your campus location node!
}

def calculate_distance(loc1, loc2):
    """Calculates the straight-line grid distance between two neighborhoods."""
    p1 = NAIROBI_MAP.get(loc1.lower(), (0, 0))
    p2 = NAIROBI_MAP.get(loc2.lower(), (0, 0))
    
    # Euclidean distance formula
    raw_dist = math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)
    return round(raw_dist, 1) # Returns a clean decimal distance value

def calculate_match_score(house, user_prefs, active_weights):
    score = 0
    
    # Calculate the dynamic distance to the user's specific workplace
    calculated_distance = calculate_distance(house["location"], user_prefs["work_location"])
    
    # 1. Budget Rule
    if house["price"] <= user_prefs["max_budget"]:
        score += active_weights["budget"]
    elif house["price"] <= (user_prefs["max_budget"] * 1.15):
        score += (active_weights["budget"] * 0.4)

    # 2. Location Rule
    if house["location"].lower() == user_prefs["preferred_location"].lower():
        score += active_weights["location"]

    # 3. Security Rule
    if user_prefs["requires_high_security"] == "yes":
        if house["security_level"] == "high":
            score += active_weights["security"]
        elif house["security_level"] == "low":
            score -= 15
    else:
        score += active_weights["security"]

    # 4. Bedrooms Rule
    if house["bedrooms"] >= user_prefs["desired_bedrooms"]:
        score += active_weights["bedrooms"]
    elif house["bedrooms"] == user_prefs["desired_bedrooms"] - 1:
        score += (active_weights["bedrooms"] * 0.3)

    # 5. DYNAMIC DISTANCE RULE (Evaluates the run-time calculated value)
    if calculated_distance <= 4.0:
        score += active_weights["distance"]
    elif calculated_distance <= 12.0:
        score += (active_weights["distance"] * 0.5)

    return max(0, min(100, int(score))), calculated_distance