import json
from flask import Flask, jsonify, request
from flask_cors import CORS

# Import Knowledge Base defaults and Inference Engine
from knowledge_base import FACTS_TEMPLATE
from engine import run_recommendation_engine

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for Vite React frontend

def load_knowledge_base(file_path='properties.json'):
    """Loads property facts from JSON."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"❌ Error: {file_path} not found. Run convert.py first!")
        return []

def format_property_for_frontend(prop):
    """
    Standardizes key names to guarantee compatibility with React modal components.
    Ensures missing values never yield 'undefined' on the UI.
    """
    return {
        # Core Identifiers
        "id": prop.get("id") or prop.get("Property_ID", ""),
        "title": prop.get("name") or prop.get("Property_Name", "Unnamed Property"),
        "name": prop.get("name") or prop.get("Property_Name", "Unnamed Property"),
        
        # Financial & Metrics
        "price": int(prop.get("price") or prop.get("Price_KES", 0)),
        "bedrooms": str(prop.get("bedrooms") or prop.get("Bedrooms", "1")),
        "bathrooms": str(prop.get("bathrooms") or prop.get("Bathrooms", "1")),
        "sizeSqm": prop.get("size_sqm") if prop.get("size_sqm") is not None else prop.get("Size_SQM"),
        "size_sqm": prop.get("size_sqm") if prop.get("size_sqm") is not None else prop.get("Size_SQM"),

        # Image Path (points to local frontend public folder)
        "image": prop.get("image") or prop.get("Image_Path") or "/property-images/default.png",
        "Image_Path": prop.get("image") or prop.get("Image_Path") or "/property-images/default.png",

        # Location details
        "estate": prop.get("estate") or prop.get("Estate", ""),
        "county": prop.get("county") or prop.get("County", "Nairobi"),
        "location": f"{prop.get('estate', prop.get('Estate', ''))}, {prop.get('county', prop.get('County', 'Nairobi'))}",
        "distance_cbd_km": float(prop.get("distance_cbd_km") or prop.get("Distance_CBD_KM", 0.0)),
        "distance": float(prop.get("distance_cbd_km") or prop.get("Distance_CBD_KM", 0.0)),

        # Specification attributes for Modal Detail Grid
        "listingType": prop.get("listing_type") or prop.get("Listing_Type", "Rent"),
        "propertyType": prop.get("property_type") or prop.get("Property_Type", "Apartment"),
        "security": prop.get("security_rating") or prop.get("Security_Rating", "Standard"),
        "security_rating": prop.get("security_rating") or prop.get("Security_Rating", "Standard"),
        "furnished": prop.get("furnished") or prop.get("Furnished", "Unfurnished"),
        "parking": prop.get("parking") or prop.get("Parking", "Available"),
        "water_supply": prop.get("water_supply") or prop.get("Water_Supply", "Reliable"),
        "electricity": prop.get("electricity") or prop.get("Electricity", "Reliable"),
        "internet": prop.get("internet") or prop.get("Internet", "Fibre"),

        # Inference Engine Output
        "score": prop.get("score", 0),
        "reasoning_trace": prop.get("reasoning_trace", [])
    }

# ==========================================
# 🌐 API ROUTES
# ==========================================

@app.route("/api/properties", methods=["GET"])
def get_properties():
    """Returns all properties formatted cleanly."""
    properties = load_knowledge_base()
    formatted = [format_property_for_frontend(p) for p in properties]
    return jsonify(formatted)


@app.route("/api/recommendations", methods=["POST"])
def get_recommendations():
    """
    Receives user preference facts from React, executes Forward Chaining + Fuzzy Engine,
    and returns ranked properties with reasoning traces.
    """
    user_inputs = request.json or {}
    
    # Merge default template facts with user submitted parameters
    working_facts = dict(FACTS_TEMPLATE)
    working_facts.update({
        "user_budget": float(user_inputs.get("budget", user_inputs.get("user_budget", 80000))),
        "target_bedrooms": str(user_inputs.get("bedrooms", user_inputs.get("target_bedrooms", "2"))),
        "target_estate": str(user_inputs.get("estate", user_inputs.get("target_estate", "Kilimani"))),
        "max_distance_cbd": float(user_inputs.get("max_distance", user_inputs.get("max_distance_cbd", 10.0))),
        "priority_profile": str(user_inputs.get("priority_profile", "1")),
        "require_pets": bool(user_inputs.get("require_pets", False)),
        "require_gated": bool(user_inputs.get("require_gated", True)),
        "family_lifestyle": bool(user_inputs.get("family_lifestyle", False)),
        "work_from_home": bool(user_inputs.get("work_from_home", True))
    })

    # Load knowledge facts
    properties = load_knowledge_base()
    
    # Run reasoning engine
    ranked_results = run_recommendation_engine(properties, working_facts)
    
    # Format properties for React UI
    formatted_results = [format_property_for_frontend(p) for p in ranked_results]

    return jsonify({
        "status": "success",
        "count": len(formatted_results),
        "recommendations": formatted_results
    })


if __name__ == "__main__":
    print("🚀 Flask Knowledge Engine running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)