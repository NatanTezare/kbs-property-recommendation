import { useState, useMemo, useEffect } from 'react';
import PropertyModal from '../components/PropertyModal';
import PropertyCard from '../components/PropertyCard';
import { Loader2, Search, ChevronLeft, ChevronRight, Home, X } from 'lucide-react';
import { normalizeProperty } from "../utils/normalizeProperty";

export default function ListingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "http://localhost:5000/api";

  // 🔹 Filter Controls State
  const [listingType, setListingType] = useState('ALL'); // 'ALL' | 'Rent' | 'Sale'
  const [maxPrice, setMaxPrice] = useState('');          // Numeric budget input
  const [cctvOnly, setCctvOnly] = useState(false);        // CCTV filter toggle
  const [selectedBedrooms, setSelectedBedrooms] = useState('ALL'); // 'ALL' | 'Studio' | '1' | '2' | '3' | '4+'

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetch(`${API_BASE_URL}/properties`)
      .then((res) => res.json())
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching properties:", err);
        setLoading(false);
      });
  }, []);

  // Normalization
  const normalizedProperties = useMemo(() => {
    return properties
      .map((p) => {
        try {
          return normalizeProperty(p);
        } catch {
          console.error("Normalization failed for:", p);
          return null;
        }
      })
      .filter(Boolean);
  }, [properties]);

  // Combined Multi-Filter Logic
  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return normalizedProperties.filter((property) => {
      // 1. Text Search Filter
      const propertyName = (property.name || property.title || "").toLowerCase();
      const location = (property.location || "").toLowerCase();
      const estate = (property.estate || "").toLowerCase();
      const matchesSearch =
        !search ||
        propertyName.includes(search) ||
        location.includes(search) ||
        estate.includes(search);

      // 2. Listing Type Filter (Rent / Sale)
      const propListingType = (property.listingType || property.Listing_Type || "").toLowerCase();
      const matchesListingType =
        listingType === 'ALL' || propListingType === listingType.toLowerCase();

      
      return matchesSearch && matchesListingType;
    });
  }, [normalizedProperties, searchTerm, listingType, maxPrice, cctvOnly, selectedBedrooms]);

  // Reset pagination on filter updates
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setListingType('ALL');
    setMaxPrice('');
    setCctvOnly(false);
    setSelectedBedrooms('ALL');
    setCurrentPage(1);
  };

  // Pagination Math
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-600 dark:text-stone-300">
        <Loader2 className="w-8 h-8 animate-spin text-[#C2410C] dark:text-[#E0561B]" />
        <p className="font-medium text-sm">Loading property catalog...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between space-y-8">
      <div className="space-y-6">
        
        {/* 🔍 Search & Multi-Filter Control Panel */}
        <div className="bg-white dark:bg-[#26221F] p-5 rounded-2xl shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-4">
          
          {/* Main Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search location, estate, or property title..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/60 dark:bg-[#1C1917] focus:ring-2 focus:ring-[#C2410C] dark:focus:ring-[#E0561B] focus:border-transparent outline-none text-sm text-[#1C1917] dark:text-[#FAFAF9] placeholder-stone-400 dark:placeholder-stone-500 transition"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-stone-400 dark:text-stone-500" />
          </div>

          {/* Filter Bar Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
            
            {/* 1. Listing Type Pill Selector */}
            <div>
              <div className="flex bg-stone-100 dark:bg-[#1C1917] p-1 rounded-xl border border-stone-200 dark:border-stone-800">
                {['ALL', 'Rent', 'Sale'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange(setListingType, type)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      listingType === type
                        ? 'bg-[#C2410C] dark:bg-[#E0561B] text-white shadow-sm'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Clear Filters Reset Option */}
          {(searchTerm || listingType !== 'ALL') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-xs font-semibold text-[#C2410C] dark:text-[#E0561B] hover:underline"
              >
                <X className="w-3.5 h-3.5" /> Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* 📊 Results Counter Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#FAFAF9]">
            {filtered.length} Properties Matching Criteria
          </h2>
        </div>

        {/* 🧱 Results Grid */}
        {paginatedProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showMatch={false}
                onViewDetails={() => setSelectedProperty(property)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-white dark:bg-[#26221F] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <p className="text-stone-700 dark:text-stone-200 mb-2 text-lg font-semibold">No properties found 😔</p>
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Try adjusting your max price, listing type, or bedroom filters.
            </p>
          </div>
        )}

        {/* 📑 Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-stone-200/80 dark:border-stone-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-[#26221F] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Page Indicator Pills */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 text-xs font-bold rounded-xl transition ${
                    currentPage === page
                      ? "bg-[#C2410C] dark:bg-[#E0561B] text-white shadow-sm"
                      : "bg-stone-100 dark:bg-[#1C1917] text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-[#26221F] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 🪟 Property Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 space-y-2 pb-6">
        <div className="flex items-center justify-center gap-2 font-bold text-[#1C1917] dark:text-[#FAFAF9] text-sm">
          <Home className="w-4 h-4 text-[#C2410C] dark:text-[#E0561B]" /> SmartKeja Knowledge-Based Recommendation System
        </div>
        <p>Expert Forward-Chaining Inference Engine for Housing Discovery.</p>
        <p className="text-stone-400 dark:text-stone-600">
          © {new Date().getFullYear()} SmartKeja. All rights reserved.
        </p>
      </footer>
    </div>
  );
}