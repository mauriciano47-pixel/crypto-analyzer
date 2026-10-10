import { TrendingUp } from 'lucide-react';

export default function PatternsGrid({
  patterns,
  focusedTime,
  setFocusedTime
}) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} className="text-bullish" /> Patrones Técnicos Detectados ({patterns.length})
        </h3>
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>
          Haz clic en una tarjeta para enfocar en el gráfico y ver los niveles de Take Profit (TP) y Stop Loss (SL)
        </span>
      </div>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {patterns.length === 0 ? (
          <p className="text-muted">Escaneando mercado... Ningún patrón significativo en la ventana actual.</p>
        ) : (
          patterns.map((p, i) => {
            const isBullish = p.patron && (
              p.patron.toLowerCase().includes('bullish') || 
              p.patron.toLowerCase().includes('morning') || 
              p.patron.toLowerCase().includes('hammer')
            );
            const isFocused = focusedTime === p.fecha;
            return (
              <div 
                key={i} 
                onClick={() => {
                  setFocusedTime(p.fecha);
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="pattern-card"
                style={{ 
                  padding: '0.85rem', 
                  background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-base)', 
                  borderRadius: '8px', 
                  borderLeft: `4px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}`,
                  borderTop: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                  borderRight: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                  borderBottom: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem', color: isBullish ? '#10B981' : '#EF4444' }}>
                    {p.tipo_patron_display || p.patron}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    {isBullish ? '🟢 COMPRA' : '🔴 VENTA'}
                  </span>
                </div>
                
                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                  {p.fecha ? p.fecha.replace('T', ' ').substring(0, 19) : 'Reciente'}
                </div>

                <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: '700' }}>
                  Cierre: ${parseFloat(p.close).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>

                {typeof p.tasaAcierto === 'number' && !isNaN(p.tasaAcierto) && (
                  <div 
                    style={{ 
                      fontSize: '0.7rem', 
                      marginTop: '0.5rem', 
                      backgroundColor: p.tasaAcierto >= 50 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                      color: p.tasaAcierto >= 50 ? '#10B981' : '#EF4444', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      display: 'inline-block',
                      fontWeight: 'bold' 
                    }}
                  >
                    Acierto Histórico: {p.tasaAcierto.toFixed(1)}% 🎯
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
