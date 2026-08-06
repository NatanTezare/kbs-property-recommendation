"""
models.py
---------
Loads the property knowledge base (properties.json) and normalizes it into
a clean, consistent in-memory representation.

Why normalization matters here: the source CSV has a few inconsistent rows
(e.g. Public_Transport/Shopping_Centre stored as "Yes"/"No" for 5 records
instead of descriptive labels). Rather than let that break the reasoning
engine, we normalize defensively at load time and log what we fixed.
"""

import json
from dataclasses import dataclass, field
from typing import Optional


BEDROOM_MAP = {"0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6+": 6}
SECURITY_SCORE = {"Excellent": 1.0, "Good": 0.7, "Average": 0.4, "Poor": 0.15}
TRANSPORT_SCORE = {"Excellent": 1.0, "Good": 0.7, "Poor": 0.3}

# A couple of irregular filenames spotted in the repo listing that don't
# follow the standard "{Name} - {ID}.png" pattern exactly (case/extension
# quirks). Override those specific IDs here; everything else uses the
# standard pattern. Extend this if more turn up once the full folder is visible.
IMAGE_FILENAME_OVERRIDES = {
    "P086": "Riverside Square Suites - p086.png",  # lowercase 'p' in the actual filename
}


def _build_image_url(name: str, property_id: str) -> str:
    if not property_id:
        return "/property-images/default.png"
    return f"/property-images/{property_id.upper()}.png"


@dataclass
class Property:
    id: str
    name: str
    listing_type: str          # "Rent" or "Sale"
    property_type: str         # Apartment/House/Villa/Maisonette/Studio
    estate: str
    sub_location: str
    price_kes: float
    price_category: str
    bedrooms: int
    bathrooms: str
    size_sqm: float
    furnished: str
    parking: bool
    security_rating: str
    security_score: float
    water_supply: str
    electricity: str
    internet: str
    pets_allowed: bool
    swimming_pool: bool
    gym: bool
    garden: bool
    balcony: bool
    elevator: bool
    school_nearby: bool
    hospital_nearby: bool
    shopping_centre: Optional[str]
    public_transport: str
    public_transport_score: float
    distance_cbd_km: float
    family_friendly: bool
    student_friendly: bool
    traffic_level: str
    noise_level: str
    flood_risk: str
    gated_community: bool
    cctv: bool
    latitude: float
    longitude: float
    image_url: str
    raw: dict = field(repr=False, default_factory=dict)


def _norm_bedrooms(val) -> int:
    if val is None:
        return 0
    s = str(val).strip()
    return BEDROOM_MAP.get(s, 0)


def _norm_bool(val) -> bool:
    return bool(val) if isinstance(val, bool) else str(val).strip().lower() in ("yes", "true", "1")


def load_properties(file_path: str = "properties.json") -> list[Property]:
    with open(file_path, "r", encoding="utf-8") as f:
        raw_list = json.load(f)

    properties = []
    fixed_rows = []

    for r in raw_list:
        # --- Defensive normalization for the known data-quality quirk ---
        public_transport_raw = r.get("Public_Transport")
        if isinstance(public_transport_raw, bool) or str(public_transport_raw) in ("Yes", "No", "True", "False"):
            fixed_rows.append(r.get("Property_ID"))
            public_transport_label = "Good"  # neutral fallback, not Excellent/Poor
        else:
            public_transport_label = public_transport_raw or "Good"

        shopping_centre_raw = r.get("Shopping_Centre")
        shopping_centre = None if isinstance(shopping_centre_raw, bool) else shopping_centre_raw

        security_rating = r.get("Security_Rating", "Average")

        prop = Property(
            id=r.get("Property_ID"),
            name=r.get("Property_Name"),
            listing_type=r.get("Listing_Type"),
            property_type=r.get("Property_Type"),
            estate=r.get("Estate"),
            sub_location=r.get("Sub_Location"),
            price_kes=float(r.get("Price_KES") or 0),
            price_category=r.get("Price_Category"),
            bedrooms=_norm_bedrooms(r.get("Bedrooms")),
            bathrooms=r.get("Bathrooms"),
            size_sqm=float(r.get("Size_SQM") or 0),
            furnished=r.get("Furnished"),
            parking=_norm_bool(r.get("Parking")),
            security_rating=security_rating,
            security_score=SECURITY_SCORE.get(security_rating, 0.4),
            water_supply=r.get("Water_Supply"),
            electricity=r.get("Electricity"),
            internet=r.get("Internet"),
            pets_allowed=_norm_bool(r.get("Pets_Allowed")),
            swimming_pool=_norm_bool(r.get("Swimming_Pool")),
            gym=_norm_bool(r.get("Gym")),
            garden=_norm_bool(r.get("Garden")),
            balcony=_norm_bool(r.get("Balcony")),
            elevator=_norm_bool(r.get("Elevator")),
            school_nearby=_norm_bool(r.get("School_Nearby")),
            hospital_nearby=_norm_bool(r.get("Hospital_Nearby")),
            shopping_centre=shopping_centre,
            public_transport=public_transport_label,
            public_transport_score=TRANSPORT_SCORE.get(public_transport_label, 0.6),
            distance_cbd_km=float(r.get("Distance_CBD_KM") or 0),
            family_friendly=_norm_bool(r.get("Family_Friendly")),
            student_friendly=_norm_bool(r.get("Student_Friendly")),
            traffic_level=r.get("Traffic_Level"),
            noise_level=r.get("Noise_Level"),
            flood_risk=r.get("Flood_Risk"),
            gated_community=_norm_bool(r.get("Gated_Community")),
            cctv=_norm_bool(r.get("CCTV")),
            latitude=float(r.get("Latitude") or 0),
            longitude=float(r.get("Longitude") or 0),
            image_url=_build_image_url(r.get("Property_Name", ""), r.get("Property_ID", "")),
            raw=r,
        )
        properties.append(prop)

    if fixed_rows:
        print(f"[models] Normalized {len(fixed_rows)} rows with inconsistent "
              f"Public_Transport/Shopping_Centre values: {fixed_rows}")

    return properties


def get_known_estates(properties: list[Property]) -> list[str]:
    return sorted({p.estate for p in properties if p.estate})