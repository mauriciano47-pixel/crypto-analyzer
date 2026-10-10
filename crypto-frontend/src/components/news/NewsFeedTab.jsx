import { Search, Info, Clock, ExternalLink } from 'lucide-react';

export default function NewsFeedTab({
  searchQuery,
  setSearchQuery,
  cleanSym,
  filterSentiment,
  setFilterSentiment,
  filteredNews,
  formatTime
}) {
  return (
    <>
      {/* Buscador de Noticias */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748B' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Buscar en noticias de ${cleanSym}...`}
          className="input-field"
          style={{ paddingLeft: '32px', fontSize: '0.775rem', padding: '6px 10px 6px 32px' }}
        />
      </div>

      {/* Filtros Rápidos */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'all', label: 'General 🌐' },
          { id: 'alcista', label: 'Alcistas 🟢' },
          { id: 'bajista', label: 'Bajistas 🔴' },
          { id: 'macro', label: 'Macro 🌐' }
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterSentiment(f.id)}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              fontWeight: '600',
              borderRadius: '5px',
              border: '1px solid',
              borderColor: filterSentiment === f.id ? 'var(--neon-green)' : 'var(--border-color)',
              background: filterSentiment === f.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
              color: filterSentiment === f.id ? '#10B981' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Listado de Noticias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredNews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <Info size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
            <p style={{ fontSize: '0.825rem' }}>No se encontraron noticias con los filtros actuales.</p>
          </div>
        ) : (
          filteredNews.map((item, i) => {
            const isBull = (item.sentimiento || '').toLowerCase().includes('alcista') || (item.sentimiento || '').toLowerCase().includes('positivo');
            const isBear = (item.sentimiento || '').toLowerCase().includes('bajista') || (item.sentimiento || '').toLowerCase().includes('negativo');

            return (
              <article 
                key={item.id || i}
                style={{ 
                  background: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
              >
                {/* Meta: Fuente, Sentimiento e Impacto */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: '700',
                    padding: '2px 6px', 
                    background: 'rgba(59, 130, 246, 0.12)', 
                    color: '#60A5FA',
                    borderRadius: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    {item.fuente || 'CoinTelegraph'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: '600',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      background: isBull ? 'rgba(16, 185, 129, 0.12)' : isBear ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      color: isBull ? '#10B981' : isBear ? '#EF4444' : '#F59E0B'
                    }}>
                      {isBull ? '🟢 Alcista' : isBear ? '🔴 Bajista' : '🟡 Neutral'}
                    </span>

                    <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} /> {formatTime(item.fecha)}
                    </span>
                  </div>
                </div>

                {/* Titular */}
                <h4 style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '700', 
                  lineHeight: 1.35, 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {item.titulo}
                </h4>

                {/* Resumen */}
                <p style={{ 
                  fontSize: '0.775rem', 
                  lineHeight: 1.45, 
                  color: 'var(--text-secondary)', 
                  margin: 0 
                }}>
                  {item.resumen}
                </p>

                {/* Pie con Enlace */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                    Categoría: {item.patron || 'Mercado'}
                  </span>
                  {item.url && item.url !== '#' && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        fontSize: '0.725rem', 
                        color: 'var(--neon-green)', 
                        textDecoration: 'none', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>Leer análisis</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
