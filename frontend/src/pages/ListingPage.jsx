import { useState, useMemo } from 'react';
import { mockProperties } from '../data/mockProperties';
import { filterProperties } from '../utils/filterUtils';
import PropertyModal from '../components/PropertyModal';
import PropertyCard from '../components/PropertyCard';
import FilterBar from '../components/FilterBar';
import { Search } from 'lucide-react';
import { normalizeProperty } from "../utils/normalizeProperty";

export default function ListingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    listingType: '',
    security: '',
    maxDistance: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const normalizedProperties = useMemo(
    () => mockProperties.map(normalizeProperty),
    []
  );

  const filtered = useMemo(() => 
    filterProperties(normalizedProperties, searchTerm, filters),
    [normalizedProperties, searchTerm, filters]
  );

  return (
    <div className="space-y-6">
      
      {/* 🔍 Search Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by location, property name, or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 🎛 Filter Bar (REUSABLE) */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* 📊 Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {filtered.length} Properties Found
        </h2>

        {searchTerm && (
          <span className="text-sm text-gray-500">
            for "{searchTerm}"
          </span>
        )}
      </div>

      {/* 🧱 Results Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onViewDetails={() => setSelectedProperty(property)}
            />
          ))}
        </div>
      ) : (
        /* 💤 Empty State */
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 mb-2 text-lg">No properties found 😔</p>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* 🪟 Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}