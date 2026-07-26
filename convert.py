import pandas as pd
import json

def convert_csv_to_json(csv_filepath, json_filepath):
    print("Converting CSV to JSON...")
    # Read the CSV without turning blank cells into NaN
    df = pd.read_csv(csv_filepath, keep_default_na=False)
    properties_list = df.to_dict(orient='records')

    # Format the data types correctly for the recommendation engine
    for prop in properties_list:
        for key, value in prop.items():
            if value == "":
                prop[key] = None
            elif value == "Yes":
                prop[key] = True
            elif value == "No":
                prop[key] = False
            elif key in ['Price_KES', 'Size_SQM']:
                try: prop[key] = int(value)
                except ValueError: pass
            elif key in ['Latitude', 'Longitude', 'Distance_CBD_KM']:
                try: prop[key] = float(value)
                except ValueError: pass

    # Export to properties.json
    with open(json_filepath, 'w', encoding='utf-8') as json_file:
        json.dump(properties_list, json_file, indent=4, ensure_ascii=False)
        
    print("Success! properties.json has been created in your folder.")

if __name__ == "__main__":
    convert_csv_to_json('KnowledgeBase-updated.csv', 'properties.json')