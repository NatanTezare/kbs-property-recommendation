import { SlidersHorizontal, Cpu, Banknote, MapPin, Bed, ShieldCheck } from 'lucide-react';

export default function FilterPanel({ filters, setFilters }) {
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.titleRow}>
        <SlidersHorizontal size={20} color="#2563eb" />
        <h2 style={styles.sidebarTitle}>Preference Controls</h2>
      </div>
      <p style={styles.sidebarSubtitle}>Tweak parameters to trigger dynamic system rules.</p>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}><Cpu size={14} /> AI Priority Engine Profile</label>
        <select 
          value={filters.profile} 
          onChange={(e) => updateFilter('profile', e.target.value)} 
          style={styles.select}
        >
          <option value="1">Frugal Budget Saver</option>
          <option value="2">Commuter Proximity Focus</option>
          <option value="3">Elite Security Guarding</option>
        </select>
      </div>

      <div style={styles.inputGroup}>
        <div style={styles.labelRow}>
          <label style={styles.label}><Banknote size={14} /> Maximum Rent</label>
          <span style={styles.valueDisplay}>KES {filters.maxBudget.toLocaleString()}</span>
        </div>
        <input 
          type="range" 
          min="20000" 
          max="200000" 
          step="5000"
          value={filters.maxBudget} 
          onChange={(e) => updateFilter('maxBudget', Number(e.target.value))} 
          style={styles.rangeInput}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}><MapPin size={14} /> Target Neighborhood</label>
        <select 
          value={filters.location} 
          onChange={(e) => updateFilter('location', e.target.value)} 
          style={styles.select}
        >
          <option value="All">Any Location</option>
          <option value="Kilimani">Kilimani</option>
          <option value="Westlands">Westlands</option>
          <option value="Karen">Karen</option>
          <option value="Roysambu">Roysambu</option>
          <option value="Thika Road">Thika Road</option>
        </select>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}><Bed size={14} /> Required Bedrooms</label>
        <div style={styles.buttonGroup}>
          {[1, 2, 3].map((num) => (
            <button 
              key={num}
              type="button"
              onClick={() => updateFilter('minBedrooms', num)}
              style={{
                ...styles.selectorBtn,
                backgroundColor: filters.minBedrooms === num ? '#2563eb' : '#f1f5f9',
                color: filters.minBedrooms === num ? '#fff' : '#1e293b'
              }}
            >
              {num} BR
            </button>
          ))}
        </div>
      </div>

      <div style={styles.checkboxGroup}>
        <input 
          type="checkbox" 
          id="secToggle"
          checked={filters.highSecurity}
          onChange={(e) => updateFilter('highSecurity', e.target.checked)}
          style={styles.checkbox}
        />
        <label htmlFor="secToggle" style={styles.checkboxLabel}>
          <ShieldCheck size={15} color="#10b981" /> Require High-Tier Security
        </label>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '320px', 
    minWidth: '320px', 
    backgroundColor: '#ffffff', 
    borderRight: '1px solid #e2e8f0', 
    padding: '24px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
  },
  titleRow: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  sidebarTitle: { 
    fontSize: '18px', 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  sidebarSubtitle: { 
    fontSize: '13px', 
    color: '#64748b', 
    marginTop: '-12px', 
    lineHeight: '1.4' 
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  labelRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  label: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#475569', 
    display: 'flex', 
    alignItems: 'center',
    gap: '6px' 
  },
  valueDisplay: { 
    fontSize: '13px', 
    fontWeight: '700', 
    color: '#2563eb' 
  },
  select: { 
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    backgroundColor: '#fff', 
    fontSize: '14px', 
    color: '#1e293b' 
  },
  rangeInput: { 
    width: '100%', 
    cursor: 'pointer' 
  },
  buttonGroup: { 
    display: 'flex', 
    gap: '8px' 
  },
  selectorBtn: { 
    flex: 1, 
    padding: '10px', 
    borderRadius: '8px', 
    border: 'none', 
    fontWeight: '600', 
    fontSize: '13px', 
    cursor: 'pointer', 
    transition: 'all 0.15s' 
  },
  checkboxGroup: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginTop: '5px' 
  },
  checkbox: { 
    width: '16px', 
    height: '16px', 
    cursor: 'pointer' 
  },
  checkboxLabel: { 
    fontSize: '13px', 
    fontWeight: '500', 
    color: '#475569', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px' 
  }
};