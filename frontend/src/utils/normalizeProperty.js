// utils/normalizeProperty.js
export function normalizeProperty(p) {
  return {
    id: p.id || p.Property_ID,

    name: p.name || p.Property_Name,

    price: p.price ?? p.Price_KES ?? 0,

    bedrooms: p.bedrooms ?? p.Bedrooms ?? 0,
    bathrooms: p.bathrooms ?? p.Bathrooms ?? 0,
    sizeSqm: p.sizeSqm ?? p.Size_SQM ?? 0,

    listingType: p.listingType || p.Listing_Type,

    estate: p.estate || p.Estate,
    county: p.county || p.County,

    image: p.image || "https://picsum.photos/400/300",
  };
}