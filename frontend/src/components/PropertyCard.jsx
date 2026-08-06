import { Bed, Bath, MapPin, Maximize, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";

export default function PropertyCard({ property, onViewDetails, showMatch }) {
  const rawImage = property?.image || "";
  const formattedImage = rawImage.startsWith("/") || rawImage.startsWith("http")
    ? rawImage
    : `/${rawImage}`;

  const imageUrl = encodeURI(formattedImage);
  const fallbackImage = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800";
  const displayPrice = Number(property?.price ?? property?.price_kes ?? 0);

  const reasoningTrace = property?.reasoningTrace || [];

  return (
    <div className="bg-white dark:bg-[#26221F] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between group">
      <div>
        {/* Card Thumbnail Container */}
        <div className="relative h-48 bg-stone-100 dark:bg-[#1C1917] overflow-hidden">
          <img
            src={imageUrl}
            alt={property?.name || "Property"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImage;
            }}
          />
          
          {/* 🏷️ Top-Left Stacked Badges */}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10">
            {/* Listing Type Tag */}
            <span className="bg-[#1C1917]/80 backdrop-blur-md text-[#FAFAF9] text-[11px] font-bold px-2.5 py-1 rounded-full border border-stone-700/50 shadow-md">
              {property?.listingType || "Rent"}
            </span>

            {/* Match Percentage Badge */}
            {showMatch && property.matchScore !== null && property.matchScore !== undefined && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white bg-[#15803D] dark:bg-emerald-600 shadow-sm backdrop-blur-md">
                {property.matchScore}% Match
              </span>
            )}
          </div>
        </div>

        {/* Property Card Body */}
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-bold truncate text-[#1C1917] dark:text-[#FAFAF9]">
            {property?.name}
          </h3>

          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm">
            <MapPin className="w-4 h-4 flex-shrink-0 text-[#C2410C] dark:text-[#E0561B]" />
            <span className="truncate">{property?.location}</span>
          </div>

          {/* Quick Specs Bar */}
          <div className="flex items-center gap-3 mt-3 text-xs text-stone-700 dark:text-stone-300 bg-stone-100/70 dark:bg-[#1C1917]/60 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800/80">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#C2410C] dark:text-[#E0561B]" /> {property?.bedrooms} Beds
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#C2410C] dark:text-[#E0561B]" /> {property?.bathrooms} Baths
            </span>
            <span className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5 text-[#C2410C] dark:text-[#E0561B]" /> {property?.sizeSqm} m²
            </span>
          </div>

          {/* Reasoning Trace snippet */}
          {reasoningTrace.length > 0 && (
            <div className="mt-3 bg-stone-100/80 dark:bg-[#1C1917]/80 border border-stone-200 dark:border-stone-800 p-2.5 rounded-xl text-xs">
              <p className="font-semibold text-[#15803D] dark:text-emerald-400 mb-1 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3 h-3" /> Evaluation trace:
              </p>
              <ul className="space-y-1 text-stone-700 dark:text-stone-300">
                {reasoningTrace.slice(0, 2).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-tight text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-[#15803D] dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-0 border-t border-stone-200/80 dark:border-stone-800 mt-2 flex justify-between items-center">
        <div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 block uppercase font-bold tracking-wider">Monthly Rent</span>
          <span className="text-lg font-extrabold text-[#C2410C] dark:text-[#E0561B]">
            KES {displayPrice.toLocaleString()}
          </span>
        </div>
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 text-xs font-semibold bg-[#C2410C] hover:bg-[#9A3412] dark:bg-[#E0561B] dark:hover:bg-[#C2410C] text-white px-3.5 py-2 rounded-xl transition-colors shadow-sm"
        >
          Details <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}