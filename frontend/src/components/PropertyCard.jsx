import { Bed, Bath, MapPin, Maximize, ExternalLink } from 'lucide-react';

export default function PropertyCard({ property, onViewDetails }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
          {property.listingType}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate">{property.name}</h3>
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-1">
          <MapPin className="w-4 h-4" /> {property.estate}, {property.county}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms}</span>
          <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> {property.sizeSqm} m²</span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            KES {property.price.toLocaleString()}
          </span>
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
          >
            Details <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}