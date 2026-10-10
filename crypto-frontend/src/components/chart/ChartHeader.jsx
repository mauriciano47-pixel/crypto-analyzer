import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  ChevronsRight, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import TechnicalToolbar from '../TechnicalToolbar';

export default function ChartHeader({
  liveSymbol,
  isLiveStreaming,
  onTimeframeChange,
  liveTimeframe,
  showEMA20,
  setShowEMA20,
  showBollinger,
  setShowBollinger,
  showFibonacci,
  setShowFibonacci,
  showPivot,
  setShowPivot,
  openRiskModal,
  theme,
  priceFlash,
  displayPrice,
  isPositiveChange,
  priceChange24h,
  handleScrollLeft,
  handleZoomOut,
  handleReset,
  handleZoomIn,
  handleScrollRight,
  handleScrollToRecent
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
      {/* Ticker y Precio en Vivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {liveSymbol}
            </h2>
            {isLiveStreaming && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10B981', letterSpacing: '0.05em' }}>EN VIVO 1s</span>
              </div>
            )}
          </div>
          
          {/* Selector de temporalidades rápidas */}
          {onTimeframeChange && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
              {['1m', '5m', '15m', '1h', '1d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: liveTimeframe === tf ? 'var(--neon-green)' : 'var(--bg-elevated)',
                    color: liveTimeframe === tf ? '#000000' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
        <TechnicalToolbar
          showEMA20={showEMA20}
          setShowEMA20={setShowEMA20}
          showBollinger={showBollinger}
          setShowBollinger={setShowBollinger}
          showFibonacci={showFibonacci}
          setShowFibonacci={setShowFibonacci}
          showPivot={showPivot}
          setShowPivot={setShowPivot}
          openRiskModal={openRiskModal}
          theme={theme}
        />

        {/* Badge de Precio en Tiempo Real con Flash Reactivo */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'baseline', 
            gap: '0.6rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            backgroundColor: priceFlash === 'bullish' 
              ? 'rgba(16, 185, 129, 0.2)' 
              : priceFlash === 'bearish' 
                ? 'rgba(239, 68, 68, 0.2)' 
                : 'var(--bg-elevated)',
            border: `1px solid ${
              priceFlash === 'bullish' 
                ? 'rgba(16, 185, 129, 0.5)' 
                : priceFlash === 'bearish' 
                  ? 'rgba(239, 68, 68, 0.5)' 
                  : 'var(--border-color)'
            }`,
            transition: 'background-color 0.2s, border-color 0.2s'
          }}
        >
          <span style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'monospace', color: priceFlash === 'bullish' ? '#10B981' : priceFlash === 'bearish' ? '#EF4444' : 'var(--text-primary)' }}>
            ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', color: isPositiveChange ? '#10B981' : '#EF4444' }}>
            {isPositiveChange ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {isPositiveChange ? '+' : ''}{priceChange24h.toFixed(2)}%
          </span>
        </div>
      </div>
      
      {/* Barra de Controles de Zoom y Desplazamiento */}
      <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleScrollLeft} 
          title="Desplazarse al Pasado"
          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={18} />
        </button>
        
        <button 
          onClick={handleZoomOut} 
          title="Alejar (Zoom Out)"
          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ZoomOut size={18} />
        </button>

        <button 
          onClick={handleReset} 
          title="Ajustar Contenido (Fit Content)"
          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Maximize2 size={18} />
        </button>

        <button 
          onClick={handleZoomIn} 
          title="Acercar (Zoom In)"
          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ZoomIn size={18} />
        </button>

        <button 
          onClick={handleScrollRight} 
          title="Desplazarse al Futuro"
          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={18} />
        </button>

        <button 
          onClick={handleScrollToRecent} 
          title="Ir a la Vela Actual (En Vivo)"
          style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
