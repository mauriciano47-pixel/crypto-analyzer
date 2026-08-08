
import { Newspaper } from 'lucide-react';

export default function NewsColumn({ news }) {
  return (
    <aside className="glass" style={{ borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
        <Newspaper size={18} className="text-accent" /> Contexto de Noticias
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {news.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
            Selecciona un análisis con patrones detectados para ver su contexto.
          </p>
        ) : (
          news.map((item, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {item.patron}
                </span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {item.fecha.split('T')[0]}
                </span>
              </div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{item.titulo}</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                {item.resumen}
              </p>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
                  Leer más →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
