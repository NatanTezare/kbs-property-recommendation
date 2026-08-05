function parseImageUrl(rawImage, propertyId) {
  let imgPath = rawImage;

  // 1. Handle JSON array strings e.g. '["P001.png"]' or '["/property-images/P001.png"]'
  if (typeof imgPath === "string" && imgPath.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(imgPath);
      if (Array.isArray(parsed) && parsed.length > 0) {
        imgPath = parsed[0];
      }
    } catch {
      // Use as string if parsing fails
    }
  } else if (Array.isArray(imgPath) && imgPath.length > 0) {
    imgPath = typeof imgPath[0] === "string" ? imgPath[0] : imgPath[0]?.url || "";
  }

  imgPath = typeof imgPath === "string" ? imgPath.trim() : "";

  // 2. Return external URLs (Unsplash, HTTP links) as-is
  if (imgPath.startsWith("http://") || imgPath.startsWith("https://") || imgPath.startsWith("data:")) {
    return imgPath;
  }

  // 3. Handle paths containing "property-images/"
  if (imgPath.includes("property-images/")) {
    const cleanPath = imgPath.substring(imgPath.indexOf("property-images/"));
    return `/${cleanPath}`;
  }

  // 4. Handle plain filenames e.g. "P001.png" or "P001"
  if (imgPath.match(/^P\d{3}\.(png|jpg|jpeg|webp)$/i)) {
    return `/property-images/${imgPath}`;
  }
  if (imgPath.match(/^P\d{3}$/i)) {
    return `/property-images/${imgPath}.png`;
  }

  // 5. Fallback: Check if property ID matches pattern (e.g. "P001")
  if (propertyId && String(propertyId).match(/^P\d{3}$/i)) {
    return `/property-images/${propertyId}.png`;
  }

  // 6. Generic relative path fallback
  if (imgPath) {
    return imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
  }

  return "";
}

export function normalizeProperty(raw) {
  if (!raw) return {};

  const scoreRaw = raw.matchScore ?? raw.match_score ?? raw.score;
  const matchScore = scoreRaw !== undefined && scoreRaw !== null ? Math.round(Number(scoreRaw)) : null;

  const rawImageSource = raw.image || raw.Image_URL || raw.image_url || raw.images || raw.photos;
  const propertyId = raw.id || raw.Property_ID || "";
  
  const resolvedImage = parseImageUrl(rawImageSource, propertyId);

  return {
    id: propertyId || Math.random().toString(),
    name: raw.name || raw.title || raw.Property_Name || "Unnamed Property",
    price: Number(raw.price ?? raw.Price_KES ?? 0),
    estate: raw.estate || raw.Estate || raw.Location || "",
    county: raw.county || raw.County || "Nairobi",
    location: raw.location || (raw.estate ? `${raw.estate}, ${raw.county || "Nairobi"}` : raw.county || "Nairobi"),
    bedrooms: Number(raw.bedrooms ?? raw.Bedrooms ?? 0),
    bathrooms: Number(raw.bathrooms ?? raw.Bathrooms ?? 0),
    sizeSqm: raw.sizeSqm ?? raw.Size_SQM ?? "N/A",
    listingType: raw.listingType || raw.Listing_Type || "Rent",
    propertyType: raw.propertyType || raw.Property_Type || "Apartment",
    securityRating: raw.securityRating || raw.security || raw.Security_Rating || "N/A",
    distanceCBD: Number(raw.distanceCBD ?? raw.distance_cbd_km ?? raw.Distance_CBD_KM ?? 0),
    furnished: raw.furnished || raw.Furnished || "Unfurnished",
    parking: raw.parking || raw.Parking || "No",
    wifi: Boolean(raw.wifi ?? raw.WiFi),
    schoolNearby: Boolean(raw.schoolNearby ?? raw.School_Nearby),
    image: resolvedImage || "/property-images/P001.png",
    
    // Normalized score & reasoning trace
    matchScore: matchScore,
    reasoningTrace: Array.isArray(raw.reasoningTrace || raw.reasoning_trace)
      ? (raw.reasoningTrace || raw.reasoning_trace)
      : []
  };
}