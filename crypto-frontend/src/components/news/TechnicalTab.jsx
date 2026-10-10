import { BarChart2, Activity, TrendingUp } from 'lucide-react';

export default function TechnicalTab({
  technicalSummary,
  patterns
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Widget RSI Wilder */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BarChart2 size={16} className="text-bullish" /> OSCILADOR RSI WILDER (14)
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: technicalSummary.rsiColor }}>
            {technicalSummary.rsiStatus}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
            {technicalSummary.rsi}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {parseFloat(technicalSummary.rsi) > 50 ? 'Momento Alcista' : 'Momento Bajista'}
          </span>
        </div>

        {/* Barra de Rango 30-70 */}
        <div>
          <div style={{ 
            height: '6px', 
            borderRadius: '3px', 
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            {/* Zona Neutral */}
            <div style={{
              position: 'absolute',
              left: '30%',
              width: '40%',
              height: '100%',
              background: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '2px'
            }} />
            {/* Marcador Actual */}
            <div style={{
              position: 'absolute',
              left: `${Math.max(0, Math.min(100, parseFloat(technicalSummary.rsi)))}%`,
              top: '-3px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: technicalSummary.rsiColor,
              boxShadow: `0 0 8px ${technicalSummary.rsiColor}`
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>0 (Sobreventa &lt; 30)</span>
            <span>50</span>
            <span>100 (Sobrecompra &gt; 70)</span>
          </div>
        </div>
      </div>

      {/* Medias Móviles */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Activity size={15} style={{ color: '#3B82F6' }} /> MEDIAS MÓVILES (SMA)
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>SMA 20 (Corto plazo):</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {technicalSummary.sma20 ? `$${parseFloat(technicalSummary.sma20).toLocaleString('en-US')}` : 'Calculando...'}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>SMA 50 (Mediano plazo):</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {technicalSummary.sma50 ? `$${parseFloat(technicalSummary.sma50).toLocaleString('en-US')}` : 'Calculando...'}
            </strong>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.4rem 0' }}>
          {technicalSummary.smaComparison}
        </div>
      </div>

      {/* Confluencia de Patrones */}
      <div style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <TrendingUp size={15} className="text-bullish" /> PATRONES DE VELAS EN VENTANA
        </span>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Detectados:</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>{patterns.length}</span>
        </div>

        {patterns.length > 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Último patrón escaneado: <strong style={{ color: '#10B981' }}>{patterns[0]?.patron || patterns[0]?.tipo_patron_display}</strong>
            {typeof patterns[0]?.tasaAcierto === 'number' && (
              <span> (Acierto: {patterns[0].tasaAcierto.toFixed(1)}%)</span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Escaneando serie temporal en busca de Doji, Martillo y Envolventes...
          </div>
        )}
      </div>
    </div>
  );
}
