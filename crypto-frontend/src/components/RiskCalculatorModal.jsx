import { useState } from 'react';
import { X, Calculator, ArrowUpRight, ArrowDownRight, Crosshair, Trash2, CheckCircle2, AlertTriangle, DollarSign, Percent } from 'lucide-react';

export default function RiskCalculatorModal({
  isOpen,
  onClose,
  currentPrice = 0,
  liveSymbol = 'BTC/USDT',
  onPlotTradeLevels,
  onClearTradeLevels,
  hasActivePlots = false
}) {
  const [positionType, setPositionType] = useState('LONG'); // 'LONG' | 'SHORT'
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState(() => (currentPrice > 0 ? currentPrice : 50000));
  const [stopLoss, setStopLoss] = useState(() => {
    const base = currentPrice > 0 ? currentPrice : 50000;
    return Number((base * 0.98).toFixed(2));
  });
  const [takeProfit, setTakeProfit] = useState(() => {
    const base = currentPrice > 0 ? currentPrice : 50000;
    return Number((base * 1.05).toFixed(2));
  });

  const handleUseCurrentPrice = () => {
    if (currentPrice > 0) {
      setEntryPrice(currentPrice);
      if (positionType === 'LONG') {
        setStopLoss(Number((currentPrice * 0.98).toFixed(2)));
        setTakeProfit(Number((currentPrice * 1.05).toFixed(2)));
      } else {
        setStopLoss(Number((currentPrice * 1.02).toFixed(2)));
        setTakeProfit(Number((currentPrice * 0.95).toFixed(2)));
      }
    }
  };

  const handleSwitchPosition = (type) => {
    setPositionType(type);
    const entry = entryPrice || currentPrice || 1000;
    if (type === 'LONG') {
      setStopLoss(Number((entry * 0.98).toFixed(2)));
      setTakeProfit(Number((entry * 1.05).toFixed(2)));
    } else {
      setStopLoss(Number((entry * 1.02).toFixed(2)));
      setTakeProfit(Number((entry * 0.95).toFixed(2)));
    }
  };

  // Cálculos Cuantitativos
  const numBalance = Math.max(0, Number(accountBalance) || 0);
  const numRiskPct = Math.max(0.1, Number(riskPercent) || 1);
  const numEntry = Math.max(0.00001, Number(entryPrice) || 0);
  const numSL = Math.max(0, Number(stopLoss) || 0);
  const numTP = Math.max(0, Number(takeProfit) || 0);

  const riskAmount = (numBalance * (numRiskPct / 100)); // $ a arriesgar

  const isLong = positionType === 'LONG';
  const slDistance = isLong ? numEntry - numSL : numSL - numEntry;
  const slPercent = numEntry > 0 ? (slDistance / numEntry) * 100 : 0;
  const tpDistance = isLong ? numTP - numEntry : numEntry - numTP;
  const tpPercent = numEntry > 0 ? (tpDistance / numEntry) * 100 : 0;
  const isSlValid = isLong ? (numSL > 0 && numSL < numEntry) : numSL > numEntry;
  const isTpValid = isLong ? numTP > numEntry : (numTP > 0 && numTP < numEntry);

  // Ratio R:R
  let rrRatio = 0;
  if (slDistance > 0 && tpDistance > 0) {
    rrRatio = tpDistance / slDistance;
  }

  // Tamaño de la posición
  let positionUnits = 0;
  let notionalValue = 0;
  if (slDistance > 0) {
    positionUnits = riskAmount / slDistance;
    notionalValue = positionUnits * numEntry;
  }

  const profitAmount = positionUnits * tpDistance;
  const leverage = numBalance > 0 ? notionalValue / numBalance : 0;

  const handleApplyPlot = () => {
    if (!isSlValid || !isTpValid) return;
    onPlotTradeLevels({
      entry: numEntry,
      stopLoss: numSL,
      takeProfit: numTP,
      isLong: positionType === 'LONG',
      rrRatio: rrRatio.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      profitAmount: profitAmount.toFixed(2),
      positionUnits: positionUnits.toFixed(4)
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0B0E14',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.15)',
          padding: '1.5rem',
          borderRadius: '12px'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#F8FAFC' }}>
                Calculadora de Riesgo & Posición
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                Gestión cuantitativa de capital para {liveSymbol}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calculadora"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '6px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Dirección (LONG / SHORT) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => handleSwitchPosition('LONG')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: positionType === 'LONG' ? '2px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
              background: positionType === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: positionType === 'LONG' ? '#10B981' : '#94A3B8',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowUpRight size={16} /> LONG (Compra Alcista)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchPosition('SHORT')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: positionType === 'SHORT' ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
              background: positionType === 'SHORT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: positionType === 'SHORT' ? '#EF4444' : '#94A3B8',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowDownRight size={16} /> SHORT (Venta Bajista)
          </button>
        </div>

        {/* Inputs de Configuración de Capital y Riesgo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Capital de la Cuenta */}
          <div>
            <label htmlFor="risk-balance-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', marginBottom: '4px' }}>
              Capital de Cuenta ($ USD)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                id="risk-balance-input"
                type="number"
                min="10"
                step="100"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '28px', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[1000, 5000, 10000, 25000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAccountBalance(val)}
                  style={{
                    flex: 1,
                    fontSize: '0.65rem',
                    padding: '2px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: accountBalance === val ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: accountBalance === val ? '#3B82F6' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  ${val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Riesgo por Trade % */}
          <div>
            <label htmlFor="risk-percent-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', marginBottom: '4px' }}>
              Riesgo por Operación (%)
            </label>
            <div style={{ position: 'relative' }}>
              <Percent size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                id="risk-percent-input"
                type="number"
                min="0.1"
                max="10"
                step="0.5"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '28px', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[0.5, 1, 2, 3].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  style={{
                    flex: 1,
                    fontSize: '0.65rem',
                    padding: '2px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: Number(riskPercent) === pct ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: Number(riskPercent) === pct ? '#3B82F6' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Precios: Entrada, Stop Loss y Take Profit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Entrada */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="risk-entry-input" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3B82F6' }}>
                Entrada ($)
              </label>
              <button
                type="button"
                onClick={handleUseCurrentPrice}
                title="Cargar precio en vivo"
                style={{ background: 'none', border: 'none', color: '#38BDF8', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                En Vivo
              </button>
            </div>
            <input
              id="risk-entry-input"
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', borderColor: 'rgba(59, 130, 246, 0.4)' }}
            />
          </div>

          {/* Stop Loss */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="risk-sl-input" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#EF4444' }}>
                Stop Loss ($)
              </label>
              <span style={{ fontSize: '0.65rem', color: '#EF4444', fontWeight: '700' }}>
                {slPercent > 0 ? `-${slPercent.toFixed(2)}%` : ''}
              </span>
            </div>
            <input
              id="risk-sl-input"
              type="number"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', borderColor: isSlValid ? 'rgba(239, 68, 68, 0.4)' : '#EF4444' }}
            />
          </div>

          {/* Take Profit */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="risk-tp-input" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10B981' }}>
                Take Profit ($)
              </label>
              <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: '700' }}>
                {tpPercent > 0 ? `+${tpPercent.toFixed(2)}%` : ''}
              </span>
            </div>
            <input
              id="risk-tp-input"
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem', borderColor: isTpValid ? 'rgba(16, 185, 129, 0.4)' : '#EF4444' }}
            />
          </div>
        </div>

        {/* Panel de Métricas Cuantitativas Resumen */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* R:R Ratio */}
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Ratio Riesgo / Beneficio (R:R)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  fontFamily: 'monospace',
                  color: rrRatio >= 2 ? '#10B981' : rrRatio >= 1.5 ? '#FBBF24' : '#EF4444'
                }}>
                  1 : {rrRatio.toFixed(2)}
                </span>
                {rrRatio >= 2 ? (
                  <CheckCircle2 size={16} className="text-bullish" />
                ) : (
                  <AlertTriangle size={16} style={{ color: rrRatio >= 1.5 ? '#FBBF24' : '#EF4444' }} />
                )}
              </div>
            </div>

            {/* Tamaño Sugerido de Posición */}
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Tamaño Sugerido ({liveSymbol.split('/')[0]})</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'monospace', color: '#38BDF8', display: 'block', marginTop: '2px' }}>
                {positionUnits.toFixed(4)} {liveSymbol.split('/')[0]}
              </span>
            </div>

            {/* Capital en Riesgo ($) */}
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Monto en Riesgo</span>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#EF4444' }}>
                -${riskAmount.toFixed(2)} USD ({numRiskPct}%)
              </span>
            </div>

            {/* Ganancia Proyectada ($) */}
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block' }}>Beneficio Potencial</span>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#10B981' }}>
                +${profitAmount.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8' }}>
            <span>Volumen Nocional: <strong>${notionalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</strong></span>
            <span>Apalancamiento Implícito: <strong>{leverage.toFixed(2)}x</strong></span>
          </div>
        </div>

        {/* Validaciones o Errores de Precios */}
        {(!isSlValid || !isTpValid) && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            <span>
              {positionType === 'LONG' 
                ? 'En LONG, el Stop Loss debe ser menor que la Entrada y el Take Profit mayor.' 
                : 'En SHORT, el Stop Loss debe ser mayor que la Entrada y el Take Profit menor.'}
            </span>
          </div>
        )}

        {/* Acciones del Modal */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {hasActivePlots && (
            <button
              type="button"
              onClick={onClearTradeLevels}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444' }}
            >
              <Trash2 size={15} /> Limpiar del Gráfico
            </button>
          )}

          <button
            type="button"
            onClick={handleApplyPlot}
            disabled={!isSlValid || !isTpValid}
            className="btn btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.5rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: (!isSlValid || !isTpValid) ? 0.5 : 1,
              cursor: (!isSlValid || !isTpValid) ? 'not-allowed' : 'pointer'
            }}
          >
            <Crosshair size={15} /> Trazar Niveles en Gráfico
          </button>
        </div>
      </div>
    </div>
  );
}
