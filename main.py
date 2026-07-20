import json
from flask import Flask, render_template, request
from engine import PRIORITY_PROFILES, calculate_match_score, NAIROBI_MAP

app = Flask(__name__)

def load_knowledge_base():
    try:
        with open("properties.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

@app.route("/")
def home():
    # Render the input form and pass location options dynamically
    nodes = [k.upper() for k in NAIROBI_MAP.keys()]
    return render_template("index.html", profiles=PRIORITY_PROFILES, locations=nodes)

@app.route("/recommend", methods=["POST"])
def recommend():
    properties = load_knowledge_base()
    
    # 1. Gather data sent from the HTML Form fields
    choice = request.form.get("priority_profile")
    max_budget = float(request.form.get("max_budget", 0))
    pref_location = request.form.get("preferred_location", "").strip()
    work_location = request.form.get("work_location", "").strip()
    desired_beds = int(request.form.get("desired_bedrooms", 1))
    high_sec = request.form.get("requires_high_security", "no")

    # Establish weights based on user profile selection
    if choice not in PRIORITY_PROFILES:
        active_weights = {"budget": 20, "location": 20, "security": 20, "bedrooms": 20, "distance": 20}
        profile_name = "Standard Preferences"
    else:
        active_weights = PRIORITY_PROFILES[choice]
        profile_name = PRIORITY_PROFILES[choice]["name"]

    user_preferences = {
        "max_budget": max_budget,
        "preferred_location": pref_location,
        "work_location": work_location,
        "desired_bedrooms": desired_beds,
        "requires_high_security": high_sec
    }

    # 2. Run your Forward Chaining reasoning loop
    scored_matches = []
    for house in properties:
        match_percentage, actual_km = calculate_match_score(house, user_preferences, active_weights)
        if match_percentage > 0:
            scored_matches.append({
                "data": house,
                "score": match_percentage,
                "distance": actual_km
            })

    # Sort results highest match confidence first
    scored_matches.sort(key=lambda x: x["score"], reverse=True)

    # 3. Send results to the presentation template
    return render_template(
        "results.html", 
        matches=scored_matches[:3], 
        profile=profile_name, 
        workplace=work_location
    )

if __name__ == "__main__":
    app.run(debug=True)