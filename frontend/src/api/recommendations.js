const API_BASE_URL = "http://localhost:5000/api";

/**
 * Fetches all properties from the Flask backend.
 */
export async function getAllProperties() {
  try {
    const response = await fetch(`${API_BASE_URL}/properties`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getAllProperties):", error);
    throw error;
  }
}

/**
 * Sends user preferences to the Flask Forward-Chaining Inference Engine
 * and returns ranked property recommendations with reasoning scores.
 */
export async function getRecommendationsFromAPI(preferences) {
  try {
    const payload = {
      user_budget: preferences.budget ? Number(preferences.budget) : 500000,
      target_bedrooms: preferences.bedrooms ? String(preferences.bedrooms) : "",
      target_estate: preferences.location || "",
      max_distance_cbd: preferences.maxDistance ? Number(preferences.maxDistance) : 50,
    };

    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Return recommendations list from API response
    return data.recommendations || data;
  } catch (error) {
    console.error("API Error (getRecommendationsFromAPI):", error);
    throw error;
  }
}