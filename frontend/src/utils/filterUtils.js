export const filterProperties = (properties, searchTerm, filters) => {
  const term = searchTerm.toLowerCase().trim();
  return properties.filter((p) => {
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.estate.toLowerCase().includes(term) ||
      p.county.toLowerCase().includes(term);

    // Budget range
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    // Bedrooms
    if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
    // Listing type
    if (filters.listingType && p.listingType !== filters.listingType) return false;
    // Security
    if (filters.security && p.securityRating !== filters.security) return false;
    // Distance
    if (filters.maxDistance && p.distanceCBD > filters.maxDistance) return false;

    return matchesSearch;
  });
};