import { 
  X, MapPin, Bed, Bath, ShieldCheck, Wifi, 
  Car, Sparkles, CheckCircle2, XCircle, Info, Building, Ruler
} from 'lucide-react';

export default function PropertyModal({ house, isRecommended, onClose }) {
  if (!house) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={styles.heroImageContainer}>
          <img src={house.image} alt={house.name} style={styles.heroImage} />
          {/* Show AI Match badge ONLY if viewed as a recommendation */}
          {isRecommended && (house.score || house.base_score) && (
            <div style={styles.scoreBadge}>
              <Sparkles size={14} />
              {house.score || house.base_score}% AI Match
            </div>
          )}
        </div>

        <div style={styles.content}>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>{house.name}</h2>
              <p style={styles.location}>
                <MapPin size={16} color="#2563eb" />
                {house.sub_location || house.estate}, {house.estate}, {house.county} ({house.distance_cbd_km || house.distance}km to CBD)
              </p>
            </div>
            <div style={styles.priceContainer}>
              <span style={styles.price}>KES {Number(house.price).toLocaleString()}</span>
              <span style={styles.priceType}>{house.listing_type === 'Rent' ? '/month' : ' Sale Price'}</span>
            </div>
          </div>

          <div style={styles.quickSpecs}>
            <div style={styles.specBox}><Bed size={18} /> {house.bedrooms} Bedrooms</div>
            <div style={styles.specBox}><Bath size={18} /> {house.bathrooms} Bathrooms</div>
            <div style={styles.specBox}><Ruler size={18} /> {house.size_sqm || 'N/A'} SQM</div>
            <div style={styles.specBox}><Building size={18} /> {house.property_type}</div>
          </div>

          {/* Engine Trace & Reasoning ONLY display if this is a recommended property */}
          {isRecommended && (
            <div style={styles.traceBox}>
              <Info size={18} style={{ minWidth: '18px', marginTop: '2px' }} />
              <div>
                <strong>Reasoning Engine Trace:</strong>
                <p style={{ marginTop: '4px', lineHeight: '1.4' }}>
                  {house.reasoning || `Property in ${house.estate} satisfied all active rules: rent fits within budget (KES ${Number(house.price).toLocaleString()}), meets security criteria (${house.security_rating || house.security_level || 'Good'}), and provides required bedroom count (${house.bedrooms} BR).`}
                </p>
              </div>
            </div>
          )}

          <h3 style={styles.sectionTitle}>Property Specifications</h3>
          <div style={styles.gridDetails}>
            <DetailItem label="Furnished" value={house.furnished || 'Unfurnished'} />
            <DetailItem label="Security Rating" value={house.security_rating || house.security_level || 'Good'} icon={<ShieldCheck size={16} color="#10b981" />} />
            <DetailItem label="Water Supply" value={house.water_supply || 'Reliable'} />
            <DetailItem label="Electricity" value={house.electricity || 'Reliable'} />
            <DetailItem label="Internet" value={house.internet || 'Available'} icon={<Wifi size={16} />} />
            <DetailItem label="Parking" value={house.parking || 'Yes'} icon={<Car size={16} />} />
            <DetailItem label="Gated Community" value={house.gated_community || 'Yes'} />
            <DetailItem label="CCTV Monitoring" value={house.cctv || 'Yes'} />
          </div>

          <h3 style={styles.sectionTitle}>Amenities & Features</h3>
          <div style={styles.amenitiesGrid}>
            <AmenityBadge label="Swimming Pool" active={house.swimming_pool === 'Yes'} />
            <AmenityBadge label="Gym" active={house.gym === 'Yes'} />
            <AmenityBadge label="Garden" active={house.garden === 'Yes'} />
            <AmenityBadge label="Balcony" active={house.balcony === 'Yes'} />
            <AmenityBadge label="Elevator" active={house.elevator === 'Yes'} />
            <AmenityBadge label="Pets Allowed" active={house.pets_allowed === 'Yes'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{icon} {value}</span>
    </div>
  );
}

function AmenityBadge({ label, active }) {
  return (
    <div style={{ ...styles.amenityBadge, opacity: active ? 1 : 0.45, backgroundColor: active ? '#f0fdf4' : '#f8fafc', borderColor: active ? '#bbf7d0' : '#e2e8f0' }}>
      {active ? <CheckCircle2 size={15} color="#16a34a" /> : <XCircle size={15} color="#94a3b8" />}
      <span style={{ fontSize: '13px', fontWeight: '500', color: active ? '#166534' : '#64748b' }}>{label}</span>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    maxWidth: "680px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    backgroundColor: "#ffffff",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  heroImageContainer: {
    position: "relative",
    width: "100%",
    height: "260px",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  scoreBadge: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    backgroundColor: "#10b981",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  content: {
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  location: {
    fontSize: "14px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
  },
  priceContainer: { textAlign: "right" },
  price: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#2563eb",
    display: "block",
  },
  priceType: { fontSize: "12px", color: "#64748b" },
  quickSpecs: { display: "flex", gap: "12px", flexWrap: "wrap" },
  specBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "10px",
    backgroundColor: "#f1f5f9",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  traceBox: {
    backgroundColor: "#eff6ff",
    borderLeft: "4px solid #2563eb",
    padding: "14px 16px",
    borderRadius: "0 8px 8px 0",
    color: "#1e40af",
    fontSize: "13px",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "8px",
  },
  gridDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  detailItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    fontSize: "13px",
  },
  detailLabel: { color: "#64748b", fontWeight: "500" },
  detailValue: {
    fontWeight: "700",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  amenitiesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  amenityBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid",
  },
};