import pandas as pd
import json


def _local_image_path(property_id: str) -> str:
    if not property_id:
        return "/property-images/default.png"
    return f"/property-images/{property_id.upper()}.png"


def convert_data():
    csv_file = "KnowledgeBase_Geocoded_115.csv"
    json_file = "properties.json"

    print(f"Reading dataset from {csv_file}...")
    df = pd.read_csv(csv_file)

    # 1. Handle missing values
    df["Internet"] = df["Internet"].fillna("Fibre")

    # 2. Local static image path mapping by Property ID
    df["Image_Path"] = df["Property_ID"].astype(str).apply(_local_image_path)

    # Save CSV update
    df.to_csv(csv_file, index=False)

    # 3. Export normalized dictionary records (supports both camel/snake and Pascal cases)
    records = []
    for _, row in df.iterrows():
        records.append({
            # Standard React / Frontend keys (snake_case)
            "id": str(row["Property_ID"]),
            "name": str(row["Property_Name"]),
            "price": int(row["Price_KES"]),
            "bedrooms": str(row["Bedrooms"]),
            "bathrooms": str(row["Bathrooms"]),
            "size_sqm": int(row["Size_SQM"]) if pd.notnull(row["Size_SQM"]) else None,
            "listing_type": str(row["Listing_Type"]),
            "property_type": str(row["Property_Type"]),
            "county": str(row["County"]),
            "estate": str(row["Estate"]),
            "sub_location": str(row["Sub_Location"]),
            "distance_cbd_km": float(row["Distance_CBD_KM"]),
            "distance": float(row["Distance_CBD_KM"]),  # Fallback key
            "security_rating": str(row["Security_Rating"]),
            "security": str(row["Security_Rating"]),     # Fallback key
            "furnished": str(row["Furnished"]),
            "parking": str(row["Parking"]),
            "image": str(row["Image_Path"]),
            
            # Original CSV keys (for backward compatibility with Python rules engine)
            "Property_ID": str(row["Property_ID"]),
            "Property_Name": str(row["Property_Name"]),
            "Price_KES": int(row["Price_KES"]),
            "Bedrooms": str(row["Bedrooms"]),
            "Bathrooms": str(row["Bathrooms"]),
            "Size_SQM": int(row["Size_SQM"]) if pd.notnull(row["Size_SQM"]) else None,
            "Listing_Type": str(row["Listing_Type"]),
            "Property_Type": str(row["Property_Type"]),
            "Estate": str(row["Estate"]),
            "Sub_Location": str(row["Sub_Location"]),
            "Distance_CBD_KM": float(row["Distance_CBD_KM"]),
            "Security_Rating": str(row["Security_Rating"]),
            "Furnished": str(row["Furnished"]),
            "Parking": str(row["Parking"]),
            "Image_Path": str(row["Image_Path"])
        })

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=4)

    print(f"Successfully converted {len(records)} records to {json_file}!")

if __name__ == "__main__":
    convert_data()