import pandas as pd

def convert_data():
    csv_file = "KnowledgeBase-updated.csv"
    df = pd.read_csv(csv_file)

    # Dynamically construct the image path matching your exact naming format
    # Example output: 'images/Chaka Road Serviced Apartments - P001.png'
    df["Image_Path"] = "images/" + df["Property_Name"].astype(str) + " - " + df["Property_ID"].astype(str) + ".png"

    # Save the updated CSV 
    df.to_csv(csv_file, index=False)
    print("CSV successfully updated with descriptive Image_Paths!")

    # Export to JSON for the application logic
    json_file = "properties.json"
    df.to_json(json_file, orient="records", indent=4)
    print(f"JSON successfully exported to {json_file}!")

if __name__ == "__main__":
    convert_data()