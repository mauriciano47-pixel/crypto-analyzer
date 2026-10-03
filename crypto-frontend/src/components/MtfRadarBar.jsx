import { Activity, ShieldCheck, AlertTriangle, Layers, Flame, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MtfRadarBar({
  mtfState = null,
  orderFlowState = null,
  activeTimeframe = '1m',
  onTimeframeChange = null
}) {
  if (!mtfState || !mtfState.timeframes) return null;

  const { timeframes, alignmentPercent, elderTripleScreen, elderMessage } = mtfState;
  const isTripleAlignedBull = elderTripleScreen === 'ALIGNED_BULL';
  const isTripleAlignedBear = elderTripleScreen === 'ALIGNED_BEAR';
  const isCaution = elderTripleScreen === 'COUNTER_TREND_CAUTION';

  const orderFlow = orderFlowState || {};
  const hasAbsorption = orderFlow.absorptionStatus && orderFlow.absorptionStatus !== 'NEUTRAL';
  const isBullishAbsorption = orderFlow.absorptionStatus === 'BULLISH_ABSORPTION';

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.6rem',
      padding: '0.5rem 0.85rem',
      borderRadius: '10px',
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      marginBottom: '6px',
      fontSize: '0.75rem',
      transition: 'all 0.25s ease'
    }}>
      {/* Sección Izquierda: Radar MTF con Semáforos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontWeight: '800',
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.7rem'
        }}>
          <Layers size={13} style={{ color: '#3B82F6' }} />
          <span>Radar MTF:</span>
        </div>

        {/* Píldoras de Temporalidad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {['1m', '5m', '15m', '1h', '1d'].map((tf) => {
            const data = timeframes[tf] || { trend: 'NEUTRAL', rsi: 50 };
            const isBull = data.trend === 'BULLISH';
            const isBear = data.trend === 'BEARISH';
            const isCurrent = activeTimeframe === tf;

            const bgPill = isBull
              ? 'rgba(16, 185, 129, 0.15)'
              : isBear
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(255, 255, 255, 0.05)';
            const borderPill = isCurrent
              ? (isBull ? '1px solid #10B981' : isBear ? '1px solid #EF4444' : '1px solid #3B82F6')
              : (isBull ? '1px solid rgba(16, 185, 129, 0.3)' : isBear ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)');
            const textColor = isBull ? '#10B981' : isBear ? '#EF4444' : 'var(--text-muted)';

            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                title={`${tf.toUpperCase()}: ${data.trend} • RSI: ${data.rsi}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  backgroundColor: bgPill,
                  border: borderPill,
                  color: textColor,
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  cursor: onTimeframeChange ? 'pointer' : 'default',
                  boxShadow: isCurrent ? '0 0 6px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tf.toUpperCase()}</span>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isBull ? '#10B981' : isBear ? '#EF4444' : '#F59E0B'
                }} />
                {data.rsi && (
                  <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                    {Math.round(data.rsi)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Badge de Elder Triple Screen */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 7px',
          borderRadius: '5px',
          backgroundColor: isTripleAlignedBull
            ? 'rgba(16, 185, 129, 0.12)'
            : isTripleAlignedBear
              ? 'rgba(239, 68, 68, 0.12)'
              : isCaution
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(255, 255, 255, 0.05)',
          color: isTripleAlignedBull
            ? '#10B981'
            : isTripleAlignedBear
              ? '#EF4444'
              : isCaution
                ? '#F59E0B'
                : 'var(--text-secondary)',
          fontSize: '0.66rem',
          fontWeight: '700',
          border: isTripleAlignedBull
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : isTripleAlignedBear
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : isCaution
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid var(--border-color)'
        }}
        title={elderMessage}
        >
          {isTripleAlignedBull && <ShieldCheck size={12} />}
          {isTripleAlignedBear && <Flame size={12} />}
          {isCaution && <AlertTriangle size={12} />}
          <span>
            {isTripleAlignedBull
              ? 'Triple Screen: Alcista Fuerte 🟢'
              : isTripleAlignedBear
                ? 'Triple Screen: Bajista Fuerte 🔴'
                : isCaution
                  ? 'Alerta Contratendencia ⚠️'
                  : `Alineación: ${alignmentPercent >= 0 ? '+' : ''}${alignmentPercent}%`}
          </span>
        </div>
      </div>

      {/* Sección Derecha: Order Flow & Delta (CVD) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {/* Delta y Agresividad Taker */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: 'var(--glass-bg)',
          padding: '2px 7px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          fontSize: '0.68rem'
        }}>
          <Activity size={12} style={{ color: '#8B5CF6' }} />
          <span style={{ color: 'var(--text-muted)' }}>Delta Taker:</span>
          <span style={{
            fontWeight: '800',
            color: orderFlow.currentDelta >= 0 ? '#10B981' : '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '1px'
          }}>
            {orderFlow.currentDelta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {orderFlow.currentDelta >= 0 ? '+' : ''}{Math.round(orderFlow.currentDelta || 0).toLocaleString()}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.63rem' }}>
            ({orderFlow.takerBuyRatio || 50}% Compra)
          </span>
        </div>

        {/* Badge de Absorción Institucional si está activa */}
        {hasAbsorption && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '6px',
            backgroundColor: isBullishAbsorption ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: isBullishAbsorption ? '1px solid #10B981' : '1px solid #EF4444',
            color: isBullishAbsorption ? '#34D399' : '#F87171',
            fontSize: '0.67rem',
            fontWeight: '800',
            animation: 'pulse 1.8s infinite'
          }}
          title={orderFlow.absorptionReason}
          >
            <span>{isBullishAbsorption ? '🛡️ Absorción Compradora' : '🛑 Absorción Vendedora'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
