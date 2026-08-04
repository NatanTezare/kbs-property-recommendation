import {
  X,
  Bed,
  Bath,
  MapPin,
  Maximize,
  Wifi,
  ParkingCircle,
  Shield,
  GraduationCap,
  Heart,
  ExternalLink
} from 'lucide-react';

export default function PropertyModal({ property, onClose }) {
  if (!property) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 🔝 Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{property.name}</h2>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Heart className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 🖼 Hero Image */}
        <div className="relative">
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-72 object-cover"
          />

          {/* 💰 Price Badge */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-lg shadow text-lg font-semibold">
            KES {property.price.toLocaleString()}
          </div>
        </div>

        {/* 📦 Content */}
        <div className="p-6 space-y-6">

          {/* 📍 Location */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <MapPin className="w-4 h-4" />
            {property.estate}, {property.county}
          </div>

          {/* 🛏 Key Info */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <Info icon={<Bed />} label={`${property.bedrooms} Beds`} />
            <Info icon={<Bath />} label={`${property.bathrooms} Baths`} />
            <Info icon={<Maximize />} label={`${property.sizeSqm} m²`} />
          </div>

          {/* 🧾 Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Detail label="Listing Type" value={property.listingType} />
            <Detail label="Property Type" value={property.propertyType} />
            <Detail label="Security" value={property.securityRating} />
            <Detail label="Distance to CBD" value={`${property.distanceCBD} km`} />
            <Detail label="Furnished" value={property.furnished} />
            <Detail label="Parking" value={property.parking} />
          </div>

          {/* 🧩 Amenities */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
              Amenities
            </h3>

            <div className="flex flex-wrap gap-3">
              {property.wifi && <Tag icon={<Wifi />} label="WiFi" />}
              {property.parking && <Tag icon={<ParkingCircle />} label="Parking" />}
              {property.securityRating && <Tag icon={<Shield />} label="Secure Area" />}
              {property.schoolNearby && <Tag icon={<GraduationCap />} label="School Nearby" />}
            </div>
          </div>

          {/* 📍 Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-gray-700">
            <a
              href={property.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <MapPin className="w-4 h-4" /> View on Maps
            </a>

            <a
              href={property.streetView}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4" /> Street View
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 🔹 Small Components */

function Info({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
      <div className="w-5 h-5 text-blue-500">{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Tag({ icon, label }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm">
      <span className="w-4 h-4">{icon}</span>
      {label}
    </div>
  );
}