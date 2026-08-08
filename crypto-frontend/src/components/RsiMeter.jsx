
import { Gauge } from 'lucide-react';

export default function RsiMeter({ lecturaRsi }) {
  let label = 'NEUTRAL';
  let color = 'var(--accent-neutral)';
  let bg = 'rgba(100, 116, 139, 0.1)';
  let desc = 'Mercado Estable';

  if (lecturaRsi === 'sobrecompra' || lecturaRsi === 'sobrecomprado') {
    label = 'SOBRECOMPRADO';
    color = 'var(--accent-bearish)'; // Riesgo de caída
    bg = 'rgba(239, 68, 68, 0.1)';
    desc = 'Riesgo de Caída (Euforia)';
  } else if (lecturaRsi === 'sobreventa' || lecturaRsi === 'sobrevendido') {
    label = 'SOBREVENDIDO';
    color = 'var(--accent-bullish)'; // Oportunidad de compra
    bg = 'rgba(16, 185, 129, 0.1)';
    desc = 'Oportunidad de Rebote (Pánico)';
  } else if (lecturaRsi === 'sin_datos') {
    label = 'SIN DATOS';
    desc = 'Esperando más velas...';
  }

  return (
    <div className="glass-card stat-item" style={{ borderColor: color, boxShadow: `0 0 15px ${bg}` }}>
      <div className="stat-icon" style={{ background: bg, color: color }}>
        <Gauge size={28} />
      </div>
      <div className="stat-content">
        <h3>Indicador RSI Actual</h3>
        <p style={{ color: color, fontSize: '1.4rem', marginTop: '0.25rem' }}>{label}</p>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</span>
      </div>
    </div>
  );
}
