import json
from engine import PRIORITY_PROFILES, calculate_match_score, NAIROBI_MAP

def load_knowledge_base():
    try:
        with open("properties.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("[Error] Knowledge base file 'properties.json' not found.")
        return []

def main():
    print("================================================")
    print("🏠 WELCOME TO THE SMART PROPERTY KBS FINDER 🏠")
    print("================================================\n")
    
    properties = load_knowledge_base()
    if not properties:
        return

    # 1. Dynamic Profile Selection
    print("What is your #1 priority when looking for a home?")
    print("1: Saving Money")
    print("2: Short Commute")
    print("3: High Security")
    choice = input("Select priority (1-3): ").strip()
    
    if choice not in PRIORITY_PROFILES:
        active_weights = {"budget": 20, "location": 20, "security": 20, "bedrooms": 20, "distance": 20}
        profile_name = "Standard Preferences"
    else:
        active_weights = PRIORITY_PROFILES[choice]
        profile_name = PRIORITY_PROFILES[choice]["name"]

    print(f"\n[System] Profile active: '{profile_name}'. Modifying inference pathways...\n")

    # Available nodes display for the user
    valid_nodes = ", ".join([k.upper() for k in NAIROBI_MAP.keys()])
    print(f"📋 Supported Location Nodes: {valid_nodes}\n")

    # 2. Heuristic Data Gathering
    max_budget = float(input("Enter your maximum monthly budget (KES): "))
    pref_location = input("Preferred living neighborhood: ").strip()
    work_location = input("Where is your workplace/campus located?: ").strip()
    desired_beds = int(input("Minimum number of bedrooms needed: "))
    high_sec = input("Do you require explicit high security? (yes/no): ").strip().lower()

    user_preferences = {
        "max_budget": max_budget,
        "preferred_location": pref_location,
        "work_location": work_location,
        "desired_bedrooms": desired_beds,
        "requires_high_security": high_sec
    }

    # 3. Forward Chaining Loop Execution
    scored_matches = []
    for house in properties:
        # The engine now returns both the total score and the dynamically computed distance
        match_percentage, actual_km = calculate_match_score(house, user_preferences, active_weights)
        if match_percentage > 0:
            scored_matches.append((house, match_percentage, actual_km))

    scored_matches.sort(key=lambda x: x[1], reverse=True)

    # 4. Presenting Recommendations & Explanation Facility
    print("\n================================================")
    print("🤖 AI INTERPRETATION & RECOMMENDATIONS")
    print("================================================")
    
    if not scored_matches:
        print("No viable housing solutions met your configuration constraints.")
    else:
        for idx, (house, percentage, actual_km) in enumerate(scored_matches[:3], start=1):
            print(f"\n✨ Match #{idx}: {house['name']} ({house['location']})")
            print(f"   ↳ Match Confidence: {percentage}%")
            print(f"   ↳ Specs: KES {house['price']} | {house['bedrooms']} BR | Security: {house['security_level'].upper()}")
            print(f"   ↳ Explanation: Because your profile is set to '{profile_name}', our inference engine ")
            print(f"     calculated a dynamic distance of {actual_km}km from your workspace in {work_location.upper()}.")

if __name__ == "__main__":
    main()