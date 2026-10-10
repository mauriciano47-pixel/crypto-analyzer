import { Gauge, Flame, CheckCircle2 } from 'lucide-react';

export default function SentimentTab({
  fearAndGreed,
  cleanSym,
  priceChange24h
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Widget Fear & Greed */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Gauge size={16} className="text-bullish" /> ÍNDICE MIEDO Y CODICIA
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tiempo Real</span>
        </div>

        {/* Medidor Numérico Central */}
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: fearAndGreed.color, lineHeight: 1 }}>
            {fearAndGreed.score}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: fearAndGreed.color, marginTop: '0.35rem' }}>
            {fearAndGreed.label}
          </div>
        </div>

        {/* Barra Visual Gradiente */}
        <div>
          <div style={{ 
            height: '8px', 
            borderRadius: '4px', 
            background: 'linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-4px',
              left: `${fearAndGreed.score}%`,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '3px solid #0F172A',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span>0 (Miedo Extremo)</span>
            <span>50</span>
            <span>100 (Codicia)</span>
          </div>
        </div>

        {/* Consejo Táctico */}
        <div style={{ 
          padding: '0.6rem 0.8rem', 
          background: 'var(--bg-surface)', 
          borderRadius: '8px', 
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          lineHeight: 1.45,
          color: 'var(--text-secondary)'
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Interpretación:</strong> {fearAndGreed.advice}
        </div>
      </div>

      {/* KPIs del Par Activo */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Flame size={15} style={{ color: '#F59E0B' }} /> MÉTRICAS DE LIQUIDEZ ({cleanSym})
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div style={{ padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Variación 24h</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
              {priceChange24h >= 0 ? `+${priceChange24h.toFixed(2)}%` : `${priceChange24h.toFixed(2)}%`}
            </div>
          </div>

          <div style={{ padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sesgo General</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
              {priceChange24h >= 0 ? 'Fuerte Comprador' : 'Presión Vendedora'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} style={{ color: '#10B981' }} />
          <span>Binance WebSocket conectado sin cortes de transmisión.</span>
        </div>
      </div>
    </div>
  );
}
