import { useState, useMemo } from "react";
import PropertyCard from "../components/PropertyCard";
import { mockProperties } from "../data/mockProperties";
import { normalizeProperty } from "../utils/normalizeProperty";
import { getRecommendations } from "../utils/recommendationUtils";

export default function RecommendationPage() {
  const [preferences, setPreferences] = useState({
    budget: "",
    bedrooms: "",
    location: "",
    maxDistance: 20,
  });

  // ✅ Normalize data once
  const normalizedProperties = useMemo(
    () => mockProperties.map(normalizeProperty),
    []
  );

  // ✅ Use recommendation engine (NOT manual filter)
  const recommendations = useMemo(() => {
    if (!preferences.budget && !preferences.bedrooms && !preferences.location) {
      return normalizedProperties; // show all initially
    }

    return getRecommendations(
      {
        budget: Number(preferences.budget) || Infinity,
        bedrooms: Number(preferences.bedrooms) || 0,
        location: preferences.location,
        maxDistance: preferences.maxDistance,
      },
      normalizedProperties
    );
  }, [preferences, normalizedProperties]);

  const handleViewDetails = (property) => {
    console.log("Viewing property:", property);
  };

  return (
    <div className="space-y-6">
      {/* 🔍 Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
          Find Recommendations
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Bedrooms"
            className="p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white"
            onChange={(e) =>
              setPreferences({ ...preferences, bedrooms: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Budget"
            className="p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white"
            onChange={(e) =>
              setPreferences({ ...preferences, budget: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Location"
            className="p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white"
            onChange={(e) =>
              setPreferences({ ...preferences, location: e.target.value })
            }
          />
        </div>
      </div>

      {/* 📊 Results */}
      {recommendations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No matching recommendations found.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onViewDetails={() => handleViewDetails(property)}
            />
          ))}
        </div>
      )}
    </div>
  );
}