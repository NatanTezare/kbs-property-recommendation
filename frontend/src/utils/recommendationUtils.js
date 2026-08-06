export function getRecommendations(preferences, properties) {
  return properties.map((property) => {
    let score = 0;
    let reasons = [];

    // 💰 Budget (soft match)
    if (property.price <= preferences.budget) {
      score += 30;
      reasons.push("✔ Within your budget");
    } else if (property.price <= preferences.budget * 1.2) {
      score += 15;
      reasons.push("⚠ Slightly above budget");
    }

    // 🛏 Bedrooms
    if (property.bedrooms === preferences.bedrooms) {
      score += 25;
      reasons.push("✔ Matches bedroom requirement");
    }

    // 📍 Location
    if (property.location === preferences.location) {
      score += 25;
      reasons.push("✔ In preferred location");
    }

    // 📏 Distance
    if (property.distance <= preferences.maxDistance) {
      score += 20;
      reasons.push("✔ Close to your workplace");
    }

    return {
      ...property,
      matchPercentage: score,
      reasons,
    };
  })
  // ✅ SORT instead of FILTER
  .sort((a, b) => b.matchPercentage - a.matchPercentage)
  // ✅ Show top results (not just 1)
  .slice(0, 5);
}