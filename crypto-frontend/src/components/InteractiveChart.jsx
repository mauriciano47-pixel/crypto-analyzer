import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: '0.5rem 0 0 0', color: '#38bdf8' }}>Cierre: ${payload[0].value.toFixed(2)}</p>
        {payload[1] && payload[1].value && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--accent-bullish)', fontSize: '0.85rem' }}>↗ Patrón Alcista Detectado</p>}
        {payload[2] && payload[2].value && <p style={{ margin: '0.25rem 0 0 0', color: 'var(--accent-bearish)', fontSize: '0.85rem' }}>↘ Patrón Bajista Detectado</p>}
      </div>
    );
  }
  return null;
}

export default function InteractiveChart({ seriesData, patternsData }) {
  if (!seriesData || seriesData.length === 0) return null;

  // Formatear datos
  const chartData = seriesData.map(d => {
    const dayPatterns = patternsData.filter(p => p.timestamp.substring(0, 10) === d.timestamp.substring(0, 10));
    
    let isBullish = false;
    let isBearish = false;
    
    if (dayPatterns.length > 0) {
      dayPatterns.forEach(p => {
        const name = p.tipo_patron.toLowerCase();
        if (name.includes('bullish') || name.includes('hammer') || name.includes('morning')) isBullish = true;
        if (name.includes('bearish') || name.includes('evening') || name.includes('shooting')) isBearish = true;
      });
    }

    return {
      date: d.timestamp.substring(0, 10),
      close: parseFloat(d.close),
      hasBullish: isBullish ? parseFloat(d.close) : null,
      hasBearish: isBearish ? parseFloat(d.close) : null
    };
  });

  // Calcular min y max para que el gráfico no empiece en 0
  const minClose = Math.min(...chartData.map(d => d.close));
  const maxClose = Math.max(...chartData.map(d => d.close));

  return (
    <div className="glass-card" style={{ height: '400px', marginBottom: '3.5rem', padding: '2rem 1rem 1rem 1rem' }}>
      <h3 style={{ marginTop: 0, marginLeft: '1rem', marginBottom: '1rem' }}>Evolución del Precio y Señales</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10} minTickGap={30} />
          <YAxis domain={[minClose * 0.95, maxClose * 1.05]} stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
          <Tooltip content={<CustomTooltip />} />
          
          <Line type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="hasBullish" stroke="transparent" dot={{ r: 6, fill: 'var(--accent-bullish)', strokeWidth: 0 }} activeDot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="hasBearish" stroke="transparent" dot={{ r: 6, fill: 'var(--accent-bearish)', strokeWidth: 0 }} activeDot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
