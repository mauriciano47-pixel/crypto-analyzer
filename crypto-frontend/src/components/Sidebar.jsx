
import { PlusCircle, Database, Calendar } from 'lucide-react';

export default function Sidebar({ datasets, selectedId, onSelect, onNew }) {
  return (
    <aside className="glass" style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <button className="btn" style={{ width: '100%' }} onClick={onNew}>
          <PlusCircle size={18} /> Nuevo Análisis
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <h3 className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Análisis Recientes
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {datasets.map(ds => (
            <div 
              key={ds.id}
              onClick={() => onSelect(ds.id)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedId === ds.id ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${selectedId === ds.id ? 'var(--accent-primary)' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedId !== ds.id) e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                if (selectedId !== ds.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <Database size={14} className="text-accent" />
                {ds.asset_symbol}
              </div>
              <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                <Calendar size={12} /> {ds.timeframe} - {new Date(ds.fecha_carga).toLocaleDateString()}
              </div>
            </div>
          ))}
          {datasets.length === 0 && (
            <div className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              No hay datasets
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
