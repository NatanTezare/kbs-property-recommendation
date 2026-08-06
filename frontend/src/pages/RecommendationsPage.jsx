import { useState, useEffect } from "react";
import PropertyCard from "../components/PropertyCard";
import PropertyModal from "../components/PropertyModal";
import { normalizeProperty } from "../utils/normalizeProperty";
import { getRecommendationsFromAPI } from "../api/recommendations";
import {
  Loader2,
  SlidersHorizontal,
  AlertCircle,
  FilterX,
  Sparkles,
  Search,
  Building,
  ShieldCheck,
  Armchair,
  DollarSign,
  MapPin,
  Tag,
  Map,
  ChevronLeft,
  ChevronRight,
  Heart
} from "lucide-react";

export default function RecommendationPage() {
  // FIX 1: Set priorityProfile to "" by default so Reset actually clears state
  const defaultPreferences = {
    priorityProfile: "",
    budget: "",
    priceCategory: "",
    county: "",
    bedrooms: "",
    bathrooms: "",
    location: "",
    propertyType: "",
    furnished: "",
    security: "",
    maxDistance: 25,
  };

  const [preferences, setPreferences] = useState(defaultPreferences);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const hasPreferences = Boolean(
    preferences.priorityProfile ||
    preferences.budget ||
    preferences.priceCategory ||
    preferences.county ||
    preferences.bedrooms ||
    preferences.bathrooms ||
    preferences.location ||
    preferences.propertyType ||
    preferences.furnished ||
    preferences.security ||
    preferences.maxDistance !== defaultPreferences.maxDistance
  );

  useEffect(() => {
    let isSubscribed = true;

    if (!hasPreferences) {
      setProperties([]);
      setLoading(false);
      setError(null);
      setCurrentPage(1);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        // FIX 2: Format keys into snake_case for Python / Flask compatibility
        const payload = {
          ...(preferences.budget ? { budget: Number(preferences.budget) } : {}),
          ...(preferences.priceCategory ? { price_category: preferences.priceCategory } : {}),
          ...(preferences.county ? { county: preferences.county } : {}),
          ...(preferences.bedrooms ? { bedrooms: preferences.bedrooms } : {}),
          ...(preferences.bathrooms ? { bathrooms: preferences.bathrooms } : {}),
          ...(preferences.location ? { location: preferences.location } : {}),
          ...(preferences.propertyType ? { property_type: preferences.propertyType } : {}),
          ...(preferences.furnished ? { furnished: preferences.furnished } : {}),
          ...(preferences.security ? { security: preferences.security } : {}),
          max_distance: Number(preferences.maxDistance || 25),
          // Pass both naming conventions to guarantee Flask receives the persona
          priority_profile: preferences.priorityProfile,
          priorityProfile: preferences.priorityProfile,
        };

        const response = await getRecommendationsFromAPI(payload);
        const rawData = Array.isArray(response)
          ? response
          : response?.recommendations ?? [];

        if (isSubscribed) {
          const normalized = rawData.map(normalizeProperty);

          // FILTER: Keep ONLY properties with a 50% or higher match score
          const qualifiedMatches = normalized.filter(
            (p) => (p.matchScore ?? 0) >= 50
          );

          // SORT: Highest match percentage first
          qualifiedMatches.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

          setProperties(qualifiedMatches);
          setError(null);
          setCurrentPage(1);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error("Error loading recommendations:", err);
          setError("Unable to calculate recommendations. Ensure Flask server is active on port 5000.");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    preferences.priorityProfile,
    preferences.budget,
    preferences.priceCategory,
    preferences.county,
    preferences.bedrooms,
    preferences.bathrooms,
    preferences.location,
    preferences.propertyType,
    preferences.furnished,
    preferences.security,
    preferences.maxDistance,
    hasPreferences,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  // FIX 3: Clean reset handler that forces results view reset
  const handleReset = () => {
    setPreferences(defaultPreferences);
    setProperties([]);
    setError(null);
    setCurrentPage(1);
  };

  // Pagination Math
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProperties = properties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Section Wrapper */}
      <div className="space-y-6 flex-1">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#26221F] p-6 rounded-2xl shadow-sm border border-stone-200/80 dark:border-stone-800 transition-colors">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917] dark:text-[#FAFAF9] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#C2410C] dark:text-[#E0561B]" /> Smart Keja Engine
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Displaying only relevant properties meeting a minimum 50% preference threshold.
            </p>
          </div>

          {hasPreferences && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-4 py-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition self-start md:self-auto shadow-sm"
            >
              <FilterX className="w-4 h-4" /> Reset Filters
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-[#26221F] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5 sticky lg:top-24 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-bold text-[#1C1917] dark:text-[#FAFAF9] flex items-center gap-2 text-base">
                <SlidersHorizontal className="w-4 h-4 text-[#C2410C] dark:text-[#E0561B]" /> Preferences
              </h2>
              <span className="text-[10px] uppercase font-bold text-[#15803D] dark:text-emerald-400 bg-[#15803D]/10 dark:bg-[#15803D]/25 border border-[#15803D]/30 px-2.5 py-0.5 rounded-full">
                Min 50% Cutoff
              </span>
            </div>

            {/* Priority Persona Dropdown */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Your Priority Persona
              </label>
              <select
                name="priorityProfile"
                value={preferences.priorityProfile}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any Persona</option>
                <option value="frugal_saver">Frugal Saver (Budget Focused)</option>
                <option value="commuter">Commuter (Location Focused)</option>
                <option value="safety_first">Safety First (High Security)</option>
                <option value="family_space">Family & Space (Comfort & Safety)</option>
                <option value="wfh_pro">WFH Professional (Utilities & Comfort)</option>
              </select>
            </div>

            {/* Preferred County Dropdown */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <Map className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Preferred County
              </label>
              <select
                name="county"
                value={preferences.county}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any County</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Kiambu">Kiambu</option>
                <option value="Machakos">Machakos</option>
                <option value="Kajiado">Kajiado</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Uasin Gishu">Uasin Gishu</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Specific Location / Area
              </label>
              <input
                type="text"
                name="location"
                value={preferences.location}
                placeholder="e.g. Kilimani, Westlands, Ruaka"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition placeholder-stone-400 dark:placeholder-stone-500"
                onChange={handleChange}
              />
            </div>

            {/* Price Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Price Category
              </label>
              <select
                name="priceCategory"
                value={preferences.priceCategory}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any Category</option>
                <option value="Budget">Budget</option>
                <option value="Mid-Range">Mid-Range</option>
                <option value="Luxury">Luxury</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Max Budget (KES)
              </label>
              <input
                type="number"
                name="budget"
                value={preferences.budget}
                placeholder="e.g. 70000"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition placeholder-stone-400 dark:placeholder-stone-500"
                onChange={handleChange}
              />
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Bedrooms
                </label>
                <select
                  name="bedrooms"
                  value={preferences.bedrooms}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
                >
                  <option value="">Any</option>
                  <option value="1">1 Bed</option>
                  <option value="2">2 Beds</option>
                  <option value="3">3 Beds</option>
                  <option value="4">4+ Beds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Bathrooms
                </label>
                <select
                  name="bathrooms"
                  value={preferences.bathrooms}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
                >
                  <option value="">Any</option>
                  <option value="1">1 Bath</option>
                  <option value="2">2 Baths</option>
                  <option value="3">3+ Baths</option>
                </select>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Property Type
              </label>
              <select
                name="propertyType"
                value={preferences.propertyType}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any Type</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            {/* Furnished */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Furnished Status
              </label>
              <select
                name="furnished"
                value={preferences.furnished}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any</option>
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Security */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> Security Rating
              </label>
              <select
                name="security"
                value={preferences.security}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] text-sm text-[#1C1917] dark:text-[#FAFAF9] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] outline-none transition"
              >
                <option value="">Any</option>
                <option value="High">High Security</option>
                <option value="Medium">Medium Security</option>
              </select>
            </div>

            {/* Max Distance */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Max Distance to CBD
                </label>
                <span className="text-xs font-extrabold text-[#C2410C] dark:text-[#E0561B]">{preferences.maxDistance} km</span>
              </div>
              <input
                type="range"
                name="maxDistance"
                min="1"
                max="50"
                value={preferences.maxDistance}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-[#C2410C] dark:accent-[#E0561B]"
                onChange={handleChange}
              />
            </div>
          </aside>

          {/* Results Viewport */}
          <main className="flex-1 w-full space-y-6">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 p-4 rounded-2xl flex items-center gap-3 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!hasPreferences ? (
              <div className="text-center py-20 px-6 bg-white dark:bg-[#26221F] rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 shadow-sm flex flex-col items-center gap-3 transition-colors">
                <div className="p-4 bg-[#C2410C]/10 dark:bg-[#E0561B]/15 rounded-full text-[#C2410C] dark:text-[#E0561B]">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">Select Preferences</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md">
                  Adjust criteria in the sidebar. Only properties achieving a 50% match or higher will be displayed.
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-24 bg-white dark:bg-[#26221F] rounded-2xl border border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-300 flex flex-col items-center gap-3 shadow-sm transition-colors">
                <Loader2 className="animate-spin w-8 h-8 text-[#C2410C] dark:text-[#E0561B]" />
                <p className="font-semibold text-sm">Evaluating rules & filtering properties below 50% match...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white dark:bg-[#26221F] rounded-2xl shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-2 transition-colors">
                <p className="text-[#1C1917] dark:text-[#FAFAF9] font-bold text-base">
                  No Qualifying Recommendations Found
                </p>
                <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto">
                  No properties met the minimum 50% match threshold for your current selection. Try broadening your budget or expanding your preferred location.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Qualified Matches (50%+ Match) — {properties.length} found
                  </p>
                  <p className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                    Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, properties.length)} of {properties.length}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      showMatch={true}
                      onViewDetails={() => setSelectedProperty(property)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-[#26221F] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 text-xs font-bold rounded-xl transition ${
                            currentPage === page
                              ? "bg-[#C2410C] dark:bg-[#E0561B] text-white shadow-sm"
                              : "bg-white dark:bg-[#26221F] border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-[#26221F] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer Component */}
      <footer className="mt-12 bg-white dark:bg-[#26221F] rounded-2xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm text-stone-500 dark:text-stone-400 text-xs transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2410C] dark:text-[#E0561B]" />
            <span className="font-bold text-stone-800 dark:text-stone-200">Smart Keja KBS Engine</span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span>Intelligent Property Recommendation Rules</span>
          </div>
          
          <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500">
            <span>Built with precision for housing evaluation</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </div>

          <p className="text-stone-400 dark:text-stone-500">
            &copy; {new Date().getFullYear()} Smart Keja. All rights reserved.
          </p>
        </div>
      </footer>

      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}