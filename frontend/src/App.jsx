// frontend/src/App.jsx
import { useState, useMemo } from 'react';
import FilterPanel from './components/FilterPanel';
import PropertyCard from './components/PropertyCard';
import PropertyModal from './components/PropertyModal';
import { MOCK_KNOWLEDGE_BASE } from './data/mockProperties';
import { Sparkles, LayoutGrid, Home } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedProperty, setSelectedProperty] = useState(null); // Controls Modal
  const [filters, setFilters] = useState({
    maxBudget: 200000,
    location: 'All',
    minBedrooms: 1,
    highSecurity: false,
    profile: '1'
  });

  const recommendedProperties = useMemo(() => {
    return MOCK_KNOWLEDGE_BASE.filter(house => {
      if (house.price > filters.maxBudget) return false;
      if (filters.location !== 'All' && (house.estate !== filters.location && house.location !== filters.location)) return false;
      if (house.bedrooms < filters.minBedrooms) return false;
      if (filters.highSecurity && !(house.security_rating === 'Excellent' || house.security_level === 'high')) return false;
      return true;
    }).sort((a, b) => (b.score || b.base_score || 0) - (a.score || a.base_score || 0));
  }, [filters]);

  return (
    <div style={styles.appContainer}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.brand}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Home size={20} color="#2563eb" />
          </div>
          <span>Property Recommendation</span>
        </div>
        <div style={styles.tabGroup}>
          <button 
            onClick={() => setActiveTab('recommendations')} 
            style={{
              ...styles.tabBtn, 
              backgroundColor: activeTab === 'recommendations' ? '#eff6ff' : 'transparent', 
              color: activeTab === 'recommendations' ? '#2563eb' : '#64748b'
            }}
          >
            <Sparkles size={16} /> AI Recommendation Engine
          </button>
          <button 
            onClick={() => setActiveTab('catalog')} 
            style={{
              ...styles.tabBtn, 
              backgroundColor: activeTab === 'catalog' ? '#eff6ff' : 'transparent', 
              color: activeTab === 'catalog' ? '#2563eb' : '#64748b'
            }}
          >
            <LayoutGrid size={16} /> Browse Full Inventory
          </button>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <div style={styles.bodyLayout}>
        {activeTab === 'recommendations' ? (
          <>
            <FilterPanel filters={filters} setFilters={setFilters} />
            <main style={styles.mainFeed}>
              <div style={styles.feedHeader}>
                <h2>Top Smart Matches</h2>
                <p>Forward chaining optimization surfaced <strong>{recommendedProperties.length}</strong> viable nodes.</p>
              </div>
              
              {/* RESPONSIVE GRID LAYOUT */}
              <div style={styles.cardGrid}>
                {recommendedProperties.length === 0 ? (
                  <div style={styles.empty}>No matches fit these constraints. Try relaxing your filters.</div>
                ) : (
                  recommendedProperties.map(house => (
                    <PropertyCard 
                      key={house.id} 
                      house={house} 
                      showScore={true} 
                      onClick={() => setSelectedProperty(house)}
                    />
                  ))
                )}
              </div>
            </main>
          </>
        ) : (
          <main style={{...styles.mainFeed, padding: '30px 40px'}}>
            <div style={styles.feedHeader}>
              <h2>System Knowledge Base Catalog</h2>
              <p>Displaying all <strong>{MOCK_KNOWLEDGE_BASE.length}</strong> property records in memory.</p>
            </div>
            
            {/* CATALOG GRID */}
            <div style={styles.cardGrid}>
              {MOCK_KNOWLEDGE_BASE.map(house => (
                <PropertyCard 
                  key={house.id} 
                  house={house} 
                  showScore={false} 
                  onClick={() => setSelectedProperty(house)}
                />
              ))}
            </div>
          </main>
        )}
      </div>

      {/* MODAL VIEW */}
      <PropertyModal 
        house={selectedProperty} 
        isRecommended={activeTab === 'recommendations'}
        onClose={() => setSelectedProperty(null)} 
      />
    </div>
  );
}

const styles = {
  appContainer: { 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100vw', 
    height: '100vh', 
    backgroundColor: '#f8fafc', 
    overflow: 'hidden' 
  },
  navbar: { 
    height: '65px', 
    minHeight: '65px', 
    backgroundColor: '#ffffff', 
    borderBottom: '1px solid #e2e8f0', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: '0 30px' 
  },
  brand: { 
    fontSize: '18px', 
    fontWeight: '800', 
    color: '#0f172a', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  },
  tabGroup: { 
    display: 'flex', 
    gap: '8px' 
  },
  tabBtn: { 
    padding: '8px 16px', 
    borderRadius: '8px', 
    border: 'none', 
    fontWeight: '600', 
    fontSize: '14px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    transition: 'all 0.2s' 
  },
  bodyLayout: { 
    display: 'flex', 
    flex: 1, 
    overflow: 'hidden', 
    width: '100%' 
  },
  mainFeed: { 
    flex: 1, 
    padding: '24px 30px', 
    overflowY: 'auto', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
  },
  feedHeader: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '2px' 
  },
  cardGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '20px', 
    width: '100%' 
  },
  empty: { 
    gridColumn: '1 / -1', 
    textAlign: 'center', 
    padding: '40px', 
    border: '1px dashed #cbd5e1', 
    color: '#64748b', 
    borderRadius: '12px', 
    backgroundColor: '#fff' 
  }
};