import json

def load_knowledge_base(file_path):
    """Opens the JSON file and loads the property data."""
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data

def start_system():
    """The main function where our recommendation engine will live."""
    print("Welcome to the Nairobi Property Recommendation System!")
    
    # 1. Load the data
    properties = load_knowledge_base('properties.json')
    
    # 2. Confirm it works
    print(f"Successfully loaded {len(properties)} properties into memory.")
    print("-" * 40)

# This tells Python to run the start_system function when the file is played
if __name__ == "__main__":
    start_system()