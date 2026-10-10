import { 
  Bot, 
  RotateCw, 
  MapPin, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Crosshair, 
  Award, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';

export default function DailyTraderView({
  syntheticTrader,
  syntheticTraderService,
  liveSymbol,
  currentPrice,
  chartData,
  onPlotTradeLevels,
  plottedTradeId,
  setPlottedTradeId
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header de la Comunidad Cuantitativa */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-elevated)',
        padding: '0.75rem',
        borderRadius: '10px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={16} className="text-bullish" /> Trader del Día (IA Simulado)
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Generado diariamente para auditar y retroalimentar el sistema
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            syntheticTraderService.forceRotateTrader(liveSymbol, currentPrice, chartData);
          }}
          title="Generar otro perfil de trader ahora"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            fontSize: '0.7rem',
            fontWeight: '700',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <RotateCw size={12} />
          <span>Rotar</span>
        </button>
      </div>

      {syntheticTrader ? (
        <>
          {/* 1. Tarjeta de Perfil de Persona Natural */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Avatar */}
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${syntheticTrader.profile.avatarColor}, #1E293B)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '1rem',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: `0 0 12px ${syntheticTrader.profile.avatarColor}40`
              }}>
                {syntheticTrader.profile.initials}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {syntheticTrader.profile.name}
                  </h4>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    fontWeight: '700',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    Verificado
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span>@{syntheticTrader.profile.username}</span>
                  <span>•</span>
                  <MapPin size={11} />
                  <span>{syntheticTrader.profile.city}</span>
                </div>
              </div>
            </div>

            {/* Biografía y Enfoque */}
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              {syntheticTrader.profile.bio}
            </p>

            {/* Métricas de Cartera */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              background: 'var(--glass-bg)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Capital</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ${syntheticTrader.currentBalance.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tasa Acierto</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#10B981' }}>
                  {syntheticTrader.winRate}% 🎯
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Estrategia</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {syntheticTrader.profile.strategy.split('&')[0]}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tarjeta de Inversión Artificial Activa (Paper Trading en Vivo) */}
          {syntheticTrader.activePosition && (
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
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} style={{ color: '#F59E0B' }} /> OPERACIÓN EN CURSO
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: syntheticTrader.activePosition.type === 'LONG' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: syntheticTrader.activePosition.type === 'LONG' ? '#10B981' : '#EF4444',
                  border: `1px solid ${syntheticTrader.activePosition.type === 'LONG' ? '#10B981' : '#EF4444'}40`
                }}>
                  {syntheticTrader.activePosition.type} {syntheticTrader.activePosition.symbol}
                </span>
              </div>

              {/* Precios y P&L Flotante en Tiempo Real */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--glass-bg)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Precio Entrada:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${syntheticTrader.activePosition.entryPrice.toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>P&amp;L Flotante:</div>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    color: (syntheticTrader.activePosition.floatingPnL >= 0) ? '#10B981' : '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    justifyContent: 'flex-end'
                  }}>
                    {syntheticTrader.activePosition.floatingPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{syntheticTrader.activePosition.floatingPnL >= 0 ? '+' : ''}${syntheticTrader.activePosition.floatingPnL.toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({syntheticTrader.activePosition.floatingPnLPercent}%)</span>
                  </div>
                </div>
              </div>

              {/* Rationale y Parámetros */}
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic', lineHeight: 1.35 }}>
                "{syntheticTrader.activePosition.rationale}"
              </p>

              {/* Niveles TP / SL y Botón Proyectar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>SL: <strong style={{ color: '#EF4444' }}>${syntheticTrader.activePosition.stopLoss.toLocaleString()}</strong></span>
                <span>TP: <strong style={{ color: '#10B981' }}>${syntheticTrader.activePosition.takeProfit.toLocaleString()}</strong></span>
                <span>R:R: <strong style={{ color: 'var(--text-primary)' }}>{syntheticTrader.activePosition.rrRatio}:1</strong></span>
              </div>

              {onPlotTradeLevels && (
                <button
                  type="button"
                  onClick={() => {
                    const pos = syntheticTrader.activePosition;
                    const tradeKey = `trader-daily-${pos.symbol}-${pos.id || 'pos'}`;
                    onPlotTradeLevels({
                      symbol: pos.symbol,
                      entry: pos.entryPrice,
                      stopLoss: pos.stopLoss,
                      takeProfit: pos.takeProfit,
                      isLong: pos.type === 'LONG',
                      label: `${syntheticTrader.profile.name.split(' ')[0]}`
                    });
                    setPlottedTradeId(tradeKey);
                    setTimeout(() => setPlottedTradeId(null), 3500);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: plottedTradeId?.startsWith('trader-daily')
                      ? '1px solid #10B981'
                      : '1px solid rgba(16, 185, 129, 0.4)',
                    background: plottedTradeId?.startsWith('trader-daily')
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(16, 185, 129, 0.1)',
                    color: plottedTradeId?.startsWith('trader-daily')
                      ? '#34D399'
                      : '#10B981',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: plottedTradeId?.startsWith('trader-daily')
                      ? '0 0 12px rgba(16, 185, 129, 0.4)'
                      : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <Crosshair size={14} />
                  <span>
                    {plottedTradeId?.startsWith('trader-daily')
                      ? '¡Niveles Trazados en Gráfico! 🎯'
                      : 'Ver Niveles en Gráfico TradingView'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 3. Retroalimentación para Crypto Pattern Analyzer */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Award size={15} style={{ color: '#10B981' }} /> RETROALIMENTACIÓN PARA LA APP
              </span>
              <span style={{ color: '#F59E0B', fontSize: '0.85rem', letterSpacing: '2px' }}>
                {syntheticTrader.feedback.stars}
              </span>
            </div>

            <h5 style={{ margin: 0, fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {syntheticTrader.feedback.title}
            </h5>

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {syntheticTrader.feedback.comment}
            </p>

            <div style={{ background: 'var(--glass-bg)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid #3B82F6' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#60A5FA' }}>Sugerencia Algorítmica:</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {syntheticTrader.feedback.suggestion}
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              <span>Aporte al Modelo: {syntheticTrader.feedback.learningContribution}</span>
            </div>
          </div>

          {/* 4. Feed de Actividad en Vivo ("En Movimiento") */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} className="text-bullish" /> PULSO EN VIVO (ACTIVIDAD RECIENTE)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {syntheticTrader.activityLog?.slice(0, 5).map((act, i) => (
                <div key={act.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.73rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', marginTop: '5px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: '700' }}>
                      <span>{act.action}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '1px' }}>
                      {act.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
          Generando trader simulado del día...
        </div>
      )}
    </div>
  );
}
