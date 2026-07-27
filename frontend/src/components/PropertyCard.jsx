import { MapPin, Bed, Bath, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';

export default function PropertyCard({ house, showScore, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.imageBox}>
        <img src={house.image} alt={house.name} style={styles.img} />
        {showScore && (house.score || house.base_score) && (
          <div style={styles.matchBadge}>
            <Sparkles size={12} />
            {house.score || house.base_score}% Match
          </div>
        )}
        <div style={styles.priceBadge}>
          KES {Number(house.price).toLocaleString()}{house.listing_type === 'Rent' ? '/mo' : ''}
        </div>
      </div>
      
      <div style={styles.detailsBox}>
        <h3 style={styles.cardTitle}>{house.name}</h3>
        <p style={styles.cardLocation}>
          <MapPin size={14} color="#2563eb" />
          {house.estate || house.location} • {house.distance_cbd_km || house.distance}km to CBD
        </p>
        
        <div style={styles.specGrid}>
          <div style={styles.specItem}>
            <Bed size={14} /> {house.bedrooms} BR
          </div>
          <div style={styles.specItem}>
            <Bath size={14} /> {house.bathrooms || 1} Bath
          </div>
          <div style={styles.specItem}>
            <ShieldCheck size={14} color="#10b981" /> {house.security_rating || house.security_level || 'Good'}
          </div>
        </div>

        <div style={styles.cardFooter}>
          <span style={styles.viewLink}>View Details <ChevronRight size={14} /></span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' },
  imageBox: { width: '100%', height: '190px', position: 'relative', backgroundColor: '#cbd5e1' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  matchBadge: { position: 'absolute', top: '12px', left: '12px', backgroundColor: '#10b981', color: '#fff', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
  priceBadge: { position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(15, 23, 42, 0.85)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(4px)' },
  detailsBox: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardLocation: { fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' },
  specGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' },
  specItem: { fontSize: '12px', backgroundColor: '#f8fafc', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
  cardFooter: { marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' },
  viewLink: { fontSize: '13px', fontWeight: '700', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '2px' }
};