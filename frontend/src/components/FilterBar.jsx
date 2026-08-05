import { Filter, X } from 'lucide-react';

export default function FilterBar({ filters, setFilters, showFilters, setShowFilters }) {
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      listingType: '',
      security: '',
      maxDistance: 20,
    });
  };

  // Count active filters
  const activeFilters = Object.values(filters).filter(
    (val) => val !== '' && val !== null && val !== 20
  ).length;

  return (
    <div className="mb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Filters</span>

          {activeFilters > 0 && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {activeFilters} active
            </span>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {showFilters ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Active Filter Pills */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.minPrice && (
            <Pill label={`Min KES ${filters.minPrice}`} onRemove={() => updateFilter('minPrice', '')} />
          )}
          {filters.maxPrice && (
            <Pill label={`Max KES ${filters.maxPrice}`} onRemove={() => updateFilter('maxPrice', '')} />
          )}
          {filters.bedrooms && (
            <Pill label={`${filters.bedrooms}+ beds`} onRemove={() => updateFilter('bedrooms', '')} />
          )}
          {filters.listingType && (
            <Pill label={filters.listingType} onRemove={() => updateFilter('listingType', '')} />
          )}
          {filters.security && (
            <Pill label={filters.security} onRemove={() => updateFilter('security', '')} />
          )}
        </div>
      )}

      {/* Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Min Budget */}
            <Input
              label="Min Budget (KES)"
              type="number"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              placeholder="0"
            />

            {/* Max Budget */}
            <Input
              label="Max Budget (KES)"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
              placeholder="No limit"
            />

            {/* Bedrooms */}
            <Select
              label="Bedrooms"
              value={filters.bedrooms}
              onChange={(e) => updateFilter('bedrooms', e.target.value)}
              options={['', '1', '2', '3', '4', '5']}
              format={(v) => (v ? `${v}+` : 'Any')}
            />

            {/* Listing Type */}
            <Select
              label="Listing Type"
              value={filters.listingType}
              onChange={(e) => updateFilter('listingType', e.target.value)}
              options={['', 'Rent', 'Sale']}
            />

            {/* Security */}
            <Select
              label="Security"
              value={filters.security}
              onChange={(e) => updateFilter('security', e.target.value)}
              options={['', 'Excellent', 'Good', 'Average']}
            />

            {/* Distance Slider */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Max Distance ({filters.maxDistance} km)
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={filters.maxDistance}
                onChange={(e) => updateFilter('maxDistance', parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearFilters}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Clear all
            </button>

            <button
              onClick={() => setShowFilters(false)}
              className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* 🔹 Reusable Components */

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <input
        {...props}
        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

function Select({ label, options, format = (v) => v || 'Any', ...props }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <select
        {...props}
        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {format(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Pill({ label, onRemove }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
      {label}
      <button onClick={onRemove}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}