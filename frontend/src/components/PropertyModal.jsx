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
  Sparkles,
  CheckCircle2,
  Hash,
  Building,
  Navigation,
  Compass,
  Armchair
} from "lucide-react";

export default function PropertyModal({ property, onClose }) {
  if (!property) return null;

  // 1. Full CSV & Normalized Property Fields Handling
  const propertyId = property.id || property.Property_ID || "N/A";
  const title = property.name || property.title || property.Property_Name || "Unnamed Property";
  const price = property.price ?? property.Price_KES ?? 0;
  
  const estate = property.estate || property.Estate || "";
  const county = property.county || property.County || "Nairobi";
  const displayLocation =
    property.location || (estate ? `${estate}, ${county}` : county);

  const bedrooms = property.bedrooms ?? property.Bedrooms ?? 0;
  const bathrooms = property.bathrooms ?? property.Bathrooms ?? 0;
  const sizeSqm = property.sizeSqm ?? property.Size_SQM ?? "N/A";

  const listingType = property.listingType || property.Listing_Type || "Rent";
  const propertyType = property.propertyType || property.Property_Type || "Apartment";
  const security = property.securityRating || property.security || property.Security_Rating || "N/A";
  const distanceCBD = property.distanceCBD ?? property.distance_cbd_km ?? property.Distance_CBD_KM ?? "N/A";
  const furnished = property.furnished || property.Furnished || "N/A";
  const parking = property.parking || property.Parking || "N/A";

  // Booleans from CSV
  const hasWifi = Boolean(property.wifi ?? property.WiFi);
  const hasSchoolNearby = Boolean(property.schoolNearby ?? property.School_Nearby);

  // Maps & External Links from CSV
  const googleMapsUrl = property.googleMaps || property.Google_Maps_URL || property.google_maps_url;
  const streetViewUrl = property.streetView || property.Street_View_URL || property.street_view_url;

  // Recommendation Trace & Match Score
  const score = property.matchScore ?? property.score;
  const reasoningTrace = property.reasoningTrace || property.reasoning_trace || [];
  const isRecommendation = score !== undefined && score !== null;

  // Image handling
  const rawImage = property.image || property.Image_URL || "";
  const fallbackImage = "/property-images/P001.png";
  const imageUrl = rawImage || fallbackImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAFAF9] dark:bg-[#26221F] text-[#1C1917] dark:text-[#FAFAF9] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔝 Header Bar */}
        <div className="sticky top-0 z-10 bg-[#FAFAF9]/90 dark:bg-[#26221F]/90 backdrop-blur border-b border-stone-200 dark:border-stone-800 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">
              {title}
            </h2>

            {/* Property ID Badge */}
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center gap-1">
              <Hash className="w-3 h-3 text-[#C2410C] dark:text-[#E0561B]" /> {propertyId}
            </span>

            {/* Match Score Badge (Recommendation Page only) */}
            {isRecommendation && (
              <span className="bg-[#15803D]/15 text-[#15803D] dark:bg-[#15803D]/30 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-[#15803D]/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {score}% Match
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors">
              <Heart className="w-5 h-5 text-[#C2410C] dark:text-[#E0561B]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 🖼 Hero Image & Price Overlay */}
        <div className="relative bg-stone-100 dark:bg-[#1C1917]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-72 object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImage;
            }}
          />

          {/* 💰 Price Tag Overlay */}
          <div className="absolute bottom-4 left-4 bg-[#FAFAF9]/95 dark:bg-[#26221F]/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-stone-200/80 dark:border-stone-800">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-400 dark:text-stone-500">
              Monthly Rent
            </span>
            <span className="text-xl font-extrabold text-[#C2410C] dark:text-[#E0561B]">
              KES {Number(price).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 📦 Modal Body Content */}
        <div className="p-6 space-y-6">

          {/* 📍 Location Header */}
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-medium text-sm">
            <MapPin className="w-4 h-4 text-[#C2410C] dark:text-[#E0561B] flex-shrink-0" />
            <span>{displayLocation}</span>
          </div>

          {/* 🛏 Key Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <Info icon={<Bed />} label={`${bedrooms} Bedrooms`} />
            <Info icon={<Bath />} label={`${bathrooms} Bathrooms`} />
            <Info icon={<Maximize />} label={`${sizeSqm} m²`} />
            <Info icon={<Navigation />} label={`${distanceCBD} km to CBD`} />
          </div>

          {/* 🧾 CSV Specification Details Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Property Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-stone-100/70 dark:bg-[#1C1917]/60 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800">
              <Detail label="Property ID" value={propertyId} />
              <Detail label="Listing Type" value={listingType} />
              <Detail label="Property Type" value={propertyType} />
              <Detail label="Estate" value={estate || "N/A"} />
              <Detail label="County" value={county} />
              <Detail label="Security Rating" value={security} />
              <Detail label="Distance to CBD" value={`${distanceCBD} KM`} />
              <Detail label="Furnished Status" value={furnished} />
              <Detail label="Parking Space" value={parking} />
              <Detail label="WiFi Internet" value={hasWifi ? "Available" : "Not Provided"} />
              <Detail label="Schools Nearby" value={hasSchoolNearby ? "Yes" : "No"} />
              <Detail label="Floor Area" value={sizeSqm !== "N/A" ? `${sizeSqm} SQM` : "N/A"} />
            </div>
          </div>

          {/* 🧠 Recommendation Engine Evaluation Breakdown */}
          {reasoningTrace.length > 0 && (
            <div className="bg-[#15803D]/10 dark:bg-[#15803D]/20 border border-[#15803D]/30 p-4 rounded-xl space-y-2">
              <h3 className="font-bold text-sm text-[#15803D] dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                Inference Engine Evaluation Trace
              </h3>
              <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                {reasoningTrace.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🧩 Amenities Badges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
              Features & Amenities
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {hasWifi && <Tag icon={<Wifi />} label="High-Speed WiFi" />}
              {parking && parking !== "No" && <Tag icon={<ParkingCircle />} label={`Parking: ${parking}`} />}
              {security && security !== "N/A" && <Tag icon={<Shield />} label={`Security: ${security}`} />}
              {hasSchoolNearby && <Tag icon={<GraduationCap />} label="School Nearby" />}
              {furnished && furnished !== "N/A" && <Tag icon={<Armchair />} label={`Furnished: ${furnished}`} />}
              {propertyType && <Tag icon={<Building />} label={propertyType} />}
            </div>
          </div>

          {/* 📍 Map & External Action Links */}
          {(googleMapsUrl || streetViewUrl) && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3412] dark:bg-[#E0561B] dark:hover:bg-[#C2410C] text-white px-4 py-2.5 rounded-xl transition text-xs font-bold shadow-sm"
                >
                  <MapPin className="w-4 h-4" /> View on Google Maps
                </a>
              )}

              {streetViewUrl && (
                <a
                  href={streetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#15803D] hover:bg-[#166534] text-white px-4 py-2.5 rounded-xl transition text-xs font-bold shadow-sm"
                >
                  <Compass className="w-4 h-4" /> Street View Experience
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* 🔹 Helper Layout Components */

function Info({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-stone-100/80 dark:bg-[#1C1917] p-3 rounded-xl border border-stone-200/80 dark:border-stone-800">
      <div className="w-4 h-4 text-[#C2410C] dark:text-[#E0561B]">{icon}</div>
      <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{label}</span>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-stone-400 dark:text-stone-500 text-[11px] font-medium">{label}</p>
      <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5 text-xs truncate">
        {value}
      </p>
    </div>
  );
}

function Tag({ icon, label }) {
  return (
    <div className="flex items-center gap-2 bg-stone-100 dark:bg-[#1C1917] text-stone-700 dark:text-stone-200 px-3.5 py-1.5 rounded-full text-xs font-medium border border-stone-200/60 dark:border-stone-800">
      <span className="w-3.5 h-3.5 text-[#C2410C] dark:text-[#E0561B]">{icon}</span>
      {label}
    </div>
  );
}