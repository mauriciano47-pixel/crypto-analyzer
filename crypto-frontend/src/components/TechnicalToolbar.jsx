import { Activity, Layers, GitCommit, Target, Calculator } from 'lucide-react';

/**
 * Barra de herramientas técnica para activar/desactivar indicadores cuantitativos
 * y abrir la calculadora cuantitativa de gestión de riesgo.
 */
export default function TechnicalToolbar({
  showEMA20,
  setShowEMA20,
  showBollinger,
  setShowBollinger,
  showFibonacci,
  setShowFibonacci,
  showPivot,
  setShowPivot,
  openRiskModal,
}) {
  const getBtnStyle = (active, activeBg, activeBorder, activeColor = '#FFFFFF') => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 9px',
    fontSize: '0.72rem',
    fontWeight: '700',
    borderRadius: '6px',
    border: active ? `1px solid ${activeBorder}` : '1px solid rgba(255, 255, 255, 0.08)',
    cursor: 'pointer',
    backgroundColor: active ? activeBg : 'rgba(255, 255, 255, 0.03)',
    color: active ? activeColor : '#94A3B8',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap'
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      padding: '4px 6px',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      flexWrap: 'wrap'
    }}>
      <span style={{
        fontSize: '0.68rem',
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginRight: '2px',
        paddingLeft: '2px'
      }}>
        Herramientas:
      </span>

      {/* Botón EMA 20 */}
      <button
        type="button"
        style={getBtnStyle(showEMA20, 'rgba(30, 58, 138, 0.45)', '#3B82F6', '#93C5FD')}
        onClick={() => setShowEMA20(prev => !prev)}
        title="Activar / Desactivar Media Móvil Exponencial (EMA 20)"
      >
        <Activity size={13} style={{ color: showEMA20 ? '#60A5FA' : '#64748B' }} />
        <span>EMA 20</span>
      </button>

      {/* Botón Bandas de Bollinger */}
      <button
        type="button"
        style={getBtnStyle(showBollinger, 'rgba(249, 115, 22, 0.25)', '#F97316', '#FDBA74')}
        onClick={() => setShowBollinger(prev => !prev)}
        title="Activar / Desactivar Bandas de Bollinger (20, 2)"
      >
        <Layers size={13} style={{ color: showBollinger ? '#FB923C' : '#64748B' }} />
        <span>Bollinger</span>
      </button>

      {/* Botón Fibonacci */}
      <button
        type="button"
        style={getBtnStyle(showFibonacci, 'rgba(16, 185, 129, 0.22)', '#10B981', '#6EE7B7')}
        onClick={() => setShowFibonacci(prev => !prev)}
        title="Activar / Desactivar Niveles de Retroceso de Fibonacci"
      >
        <GitCommit size={13} style={{ color: showFibonacci ? '#34D399' : '#64748B' }} />
        <span>Fibonacci</span>
      </button>

      {/* Botón Puntos Pivote */}
      <button
        type="button"
        style={getBtnStyle(showPivot, 'rgba(234, 179, 8, 0.22)', '#EAB308', '#FDE047')}
        onClick={() => setShowPivot(prev => !prev)}
        title="Activar / Desactivar Puntos Pivote Clásicos (Floor Trader)"
      >
        <Target size={13} style={{ color: showPivot ? '#FACC15' : '#64748B' }} />
        <span>Pivotes</span>
      </button>

      {/* Botón Calculadora de Riesgo */}
      <button
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          fontSize: '0.72rem',
          fontWeight: '700',
          borderRadius: '6px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          cursor: 'pointer',
          backgroundColor: 'rgba(139, 92, 246, 0.18)',
          color: '#C4B5FD',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          marginLeft: '2px'
        }}
        onClick={openRiskModal}
        title="Calculadora Cuantitativa de Riesgo y Posicionamiento"
      >
        <Calculator size={13} style={{ color: '#A78BFA' }} />
        <span>Calculadora de Riesgo</span>
      </button>
    </div>
  );
}
