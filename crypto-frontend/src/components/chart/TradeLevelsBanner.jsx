import { Crosshair } from 'lucide-react';

export default function TradeLevelsBanner({
  hasActiveTradeLines,
  activeTradeInfo,
  onClearTradeLevels
}) {
  if (!hasActiveTradeLines || !activeTradeInfo) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 0.85rem',
      borderRadius: '8px',
      backgroundColor: activeTradeInfo.isLong ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      border: `1px solid ${activeTradeInfo.isLong ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
      fontSize: '0.78rem',
      color: '#F1F5F9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          fontWeight: '800',
          color: activeTradeInfo.isLong ? '#10B981' : '#EF4444',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Crosshair size={14} /> {activeTradeInfo.label} ({activeTradeInfo.isLong ? 'LONG 🟢' : 'SHORT 🔴'})
        </span>
        <span>Entrada: <strong style={{ color: 'var(--text-primary)' }}>${activeTradeInfo.entry.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        <span>SL: <strong style={{ color: '#EF4444' }}>${activeTradeInfo.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        <span>TP: <strong style={{ color: '#10B981' }}>${activeTradeInfo.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
      </div>
      <button
        type="button"
        onClick={onClearTradeLevels}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: '0.72rem',
          fontWeight: '600'
        }}
      >
        Limpiar Niveles ✕
      </button>
    </div>
  );
}
