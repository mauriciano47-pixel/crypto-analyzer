import { 
  ShieldCheck, 
  Cpu, 
  Scale, 
  Anchor, 
  Activity, 
  BarChart2, 
  Award, 
  Layers, 
  Crosshair 
} from 'lucide-react';

export default function AgentAuditView({
  cleanSym,
  chartData,
  liveSymbol,
  handleRunAgentAudit,
  isRunningAudit,
  microstructure,
  orderFlowState,
  mtfState,
  agentAudit,
  onPlotTradeLevels,
  plottedTradeId,
  setPlottedTradeId
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header de la Consola del Agente */}
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} className="text-bullish" />
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Agente Cuantitativo Walk-Forward
            </span>
          </div>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontWeight: '700',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            Activo ⚡
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Audita la serie histórica de <strong>{cleanSym}/USDT</strong> mediante confluencia de Velas Japonesas, RSI Wilder (14), EMA 20 y Bandas de Bollinger (R:R &ge; 2.25:1).
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Velas en memoria: <strong style={{ color: 'var(--text-primary)' }}>{chartData ? chartData.length : 0}</strong></span>
          <span>Riesgo máx: <strong style={{ color: '#10B981' }}>1.5% / trade</strong></span>
        </div>

        <button
          type="button"
          onClick={handleRunAgentAudit}
          disabled={isRunningAudit || !chartData || chartData.length < 30}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            backgroundColor: isRunningAudit ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            fontWeight: '800',
            fontSize: '0.78rem',
            cursor: (isRunningAudit || !chartData || chartData.length < 30) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            opacity: (!chartData || chartData.length < 30) ? 0.6 : 1
          }}
        >
          <Cpu size={14} />
          <span>
            {isRunningAudit ? 'Analizando Confluencias...' : 'Ejecutar Auditoría Histórica'}
          </span>
        </button>
      </div>

      {/* Monitor de Microestructura y Desbalance L2 */}
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Scale size={14} className="text-bullish" /> PROFUNDIDAD L2 (ORDER BOOK STREAM)
          </span>
          <span style={{
            fontSize: '0.64rem',
            fontWeight: '800',
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: microstructure.isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: microstructure.isConnected ? '#10B981' : '#EF4444',
            border: `1px solid ${microstructure.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {microstructure.isConnected ? '● EN VIVO L2' : '○ SIMULACIÓN'}
          </span>
        </div>

        {/* Barra de Presión Compradora vs Vendedora */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
            <span style={{ color: '#10B981', fontWeight: '800' }}>
              🟢 Compras: {microstructure.bidPercentage}% ({microstructure.totalBidVol.toLocaleString()} {cleanSym})
            </span>
            <span style={{ color: '#EF4444', fontWeight: '800' }}>
              🔴 Ventas: {microstructure.askPercentage}% ({microstructure.totalAskVol.toLocaleString()} {cleanSym})
            </span>
          </div>

          <div style={{
            height: '8px',
            width: '100%',
            borderRadius: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.75)',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{
              height: '100%',
              width: `${microstructure.bidPercentage}%`,
              backgroundColor: '#10B981',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            <span>
              Desbalance: <strong style={{ color: microstructure.imbalance >= 0 ? '#10B981' : '#EF4444' }}>
                {microstructure.imbalance >= 0 ? '+' : ''}{(microstructure.imbalance * 100).toFixed(1)}%
              </strong>
            </span>
            <span>
              Puntuación L2: <strong style={{ color: microstructure.microstructureScore >= 0 ? '#10B981' : '#EF4444' }}>
                {microstructure.microstructureScore >= 0 ? '+' : ''}{microstructure.microstructureScore}/100
              </strong>
            </span>
          </div>
        </div>

        {/* Tasa de Financiación de Futuros & Riesgo de Liquidación */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          backgroundColor: 'var(--glass-bg)',
          padding: '7px 9px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>Funding Rate (8h)</div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: '800',
              color: microstructure.fundingRatePercent > 0.03 ? '#EF4444' : (microstructure.fundingRatePercent < -0.015 ? '#10B981' : '#60A5FA')
            }}>
              {microstructure.fundingRatePercent >= 0 ? '+' : ''}{microstructure.fundingRatePercent}%
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {microstructure.fundingStatus.split('(')[0]}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>Riesgo de Liquidación</div>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {microstructure.liquidationRisk.split('(')[0]}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
              Filtro Anti-Squeeze Activo
            </div>
          </div>
        </div>

        {/* Radar de Muros Institucionales (Bid/Ask Walls) */}
        <div style={{
          backgroundColor: 'var(--glass-bg)',
          padding: '7px 9px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.66rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Anchor size={12} style={{ color: '#F59E0B' }} />
            <span>Muros Institucionales Detectados:</span>
          </div>

          <div style={{ fontSize: '0.68rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
            <span>
              🟢 Muro Compra: {microstructure.bidWalls && microstructure.bidWalls.length > 0 ? (
                <strong style={{ color: '#10B981' }}>
                  ${microstructure.bidWalls[0].price.toLocaleString()} ({microstructure.bidWalls[0].qty} {cleanSym})
                </strong>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Sin muro</span>
              )}
            </span>
            <span>
              🔴 Muro Venta: {microstructure.askWalls && microstructure.askWalls.length > 0 ? (
                <strong style={{ color: '#EF4444' }}>
                  ${microstructure.askWalls[0].price.toLocaleString()} ({microstructure.askWalls[0].qty} {cleanSym})
                </strong>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Sin muro</span>
              )}
            </span>
          </div>
        </div>

        {/* Recomendación y Filtro del Agente */}
        <div style={{
          backgroundColor: 'var(--glass-bg)',
          padding: '6px 8px',
          borderRadius: '6px',
          borderLeft: `3px solid ${microstructure.microstructureScore >= 20 ? '#10B981' : (microstructure.microstructureScore <= -20 ? '#EF4444' : '#3B82F6')}`,
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.35
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Filtro de Microestructura: </strong>
          {microstructure.recommendation}
        </div>
      </div>

      {/* Monitor en Vivo de Order Flow & CVD (@aggTrade) */}
      {orderFlowState && (
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={14} style={{ color: '#06B6D4' }} /> ORDER FLOW & CVD EN VIVO (@aggTrade)
            </span>
            <span style={{
              fontSize: '0.64rem',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: orderFlowState.isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: orderFlowState.isConnected ? '#10B981' : '#EF4444',
              border: `1px solid ${orderFlowState.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {orderFlowState.isConnected ? '● STREAM ACTIVO' : '○ SIMULACIÓN'}
            </span>
          </div>

          {/* Barra de Agresividad Taker (Market Orders) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '3px' }}>
              <span style={{ color: '#10B981', fontWeight: '700' }}>Taker Buy: {orderFlowState.takerBuyRatio}%</span>
              <span style={{ color: '#EF4444', fontWeight: '700' }}>Taker Sell: {orderFlowState.takerSellRatio}%</span>
            </div>
            <div style={{
              height: '6px',
              width: '100%',
              backgroundColor: 'rgba(239, 68, 68, 0.5)',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{
                width: `${orderFlowState.takerBuyRatio}%`,
                backgroundColor: '#10B981',
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Delta Actual y CVD Acumulado */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: 'var(--glass-bg)',
            padding: '7px 9px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>Delta de Agresión</div>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                color: (orderFlowState.currentDelta || 0) >= 0 ? '#10B981' : '#EF4444'
              }}>
                {(orderFlowState.currentDelta || 0) >= 0 ? '+' : ''}{(orderFlowState.currentDelta || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Flujo {orderFlowState.deltaIntensity}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)' }}>CVD Acumulado</div>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                color: (orderFlowState.cumulativeDelta || 0) >= 0 ? '#10B981' : '#EF4444'
              }}>
                {(orderFlowState.cumulativeDelta || 0) >= 0 ? '+' : ''}{(orderFlowState.cumulativeDelta || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Vol. Total: {(orderFlowState.totalVolume || 0).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Detección de Absorción Institucional */}
          <div style={{
            backgroundColor: orderFlowState.absorptionStatus === 'BULLISH_ABSORPTION'
              ? 'rgba(16, 185, 129, 0.1)'
              : orderFlowState.absorptionStatus === 'BEARISH_ABSORPTION'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'var(--glass-bg)',
            padding: '7px 9px',
            borderRadius: '8px',
            borderLeft: `3px solid ${
              orderFlowState.absorptionStatus === 'BULLISH_ABSORPTION'
                ? '#10B981'
                : orderFlowState.absorptionStatus === 'BEARISH_ABSORPTION'
                ? '#EF4444'
                : '#06B6D4'
            }`,
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.35
          }}>
            <div style={{
              fontWeight: '800',
              color: orderFlowState.absorptionStatus === 'BULLISH_ABSORPTION'
                ? '#10B981'
                : orderFlowState.absorptionStatus === 'BEARISH_ABSORPTION'
                ? '#EF4444'
                : 'var(--text-primary)',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {orderFlowState.absorptionStatus === 'BULLISH_ABSORPTION' && '🛡️ ABSORCIÓN COMPRADORA INSTITUCIONAL DETECTADA'}
              {orderFlowState.absorptionStatus === 'BEARISH_ABSORPTION' && '⚠️ ABSORCIÓN VENDEDORA INSTITUCIONAL DETECTADA'}
              {orderFlowState.absorptionStatus === 'NEUTRAL' && '⚖️ Absorción Institucional Equilibrada'}
            </div>
            <div>{orderFlowState.absorptionReason}</div>
          </div>

          {/* Resumen MTF Confluence si existe */}
          {mtfState && (
            <div style={{
              backgroundColor: 'var(--glass-bg)',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.67rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Sesgo MTF (Triple Screen):
              </span>
              <span style={{
                fontWeight: '800',
                color: mtfState.overallBias === 'ALIGNED_BULL' ? '#10B981' : (mtfState.overallBias === 'ALIGNED_BEAR' ? '#EF4444' : '#F59E0B')
              }}>
                {mtfState.overallBias === 'ALIGNED_BULL' ? '🟢 ALINEACIÓN ALCISTA' : (mtfState.overallBias === 'ALIGNED_BEAR' ? '🔴 ALINEACIÓN BAJISTA' : '🟡 MIXTO / CONTRATENDENCIA')} ({mtfState.alignmentScore >= 0 ? '+' : ''}{mtfState.alignmentScore}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Resultados de la Auditoría */}
      {agentAudit && agentAudit.success ? (
        <>
          {/* Tarjeta de Métricas Globales */}
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BarChart2 size={14} style={{ color: '#10B981' }} /> RESULTADOS HISTÓRICOS AUDITADOS
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                {agentAudit.algorithmicRating}
              </span>
            </div>

            {/* Cuadrícula de Métricas Clave */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              backgroundColor: 'var(--glass-bg)',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Tasa Acierto</div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: agentAudit.winRate >= 50 ? '#10B981' : '#EF4444'
                }}>
                  {agentAudit.winRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Profit Factor</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#60A5FA' }}>
                  {agentAudit.profitFactor}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>P&amp;L Neto</div>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: agentAudit.netProfit >= 0 ? '#10B981' : '#EF4444'
                }}>
                  {agentAudit.netProfit >= 0 ? '+' : ''}${agentAudit.netProfit}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.71rem',
              color: 'var(--text-secondary)',
              padding: '0 4px'
            }}>
              <span>Trades: <strong style={{ color: 'var(--text-primary)' }}>{agentAudit.totalTrades}</strong> (<strong style={{ color: '#10B981' }}>{agentAudit.winningTrades}W</strong> / <strong style={{ color: '#EF4444' }}>{agentAudit.losingTrades}L</strong>)</span>
              <span>Max Drawdown: <strong style={{ color: '#EF4444' }}>{agentAudit.maxDrawdownPercent}%</strong></span>
            </div>
          </div>

          {/* Retroalimentación para el Cerebro Algorítmico */}
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Award size={14} style={{ color: '#F59E0B' }} /> RETROALIMENTACIÓN PARA EL CEREBRO
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {agentAudit.symbol}
              </span>
            </div>

            <h5 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {agentAudit.feedbackReview.title}
            </h5>

            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {agentAudit.feedbackReview.summary}
            </p>

            <div style={{
              backgroundColor: 'var(--glass-bg)',
              padding: '7px 9px',
              borderRadius: '8px',
              borderLeft: '3px solid #10B981'
            }}>
              <div style={{ fontSize: '0.66rem', fontWeight: '700', color: '#10B981' }}>Recomendación de Optimización:</div>
              <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                {agentAudit.feedbackReview.recommendation}
              </div>
            </div>
          </div>

          {/* Bitácora de Operaciones Auditadas con Proyección en Gráfico */}
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={14} className="text-bullish" /> OPERACIONES AUDITADAS ({agentAudit.tradesList.length})
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                Walk-Forward R:R &ge; 2.25
              </span>
            </div>

            {agentAudit.tradesList.length === 0 ? (
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No se detectaron confluencias de alto rigor estadístico en este rango de velas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
                {agentAudit.tradesList.map((t) => {
                  const isWin = t.outcome === 'WIN';
                  const isLong = t.type === 'LONG';
                  return (
                    <div
                      key={t.id}
                      style={{
                        backgroundColor: 'var(--glass-bg)',
                        border: `1px solid ${isWin ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: '800',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: isLong ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isLong ? '#10B981' : '#EF4444'
                          }}>
                            {t.type}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: '800',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: isWin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isWin ? '#10B981' : '#EF4444'
                          }}>
                            {isWin ? 'WIN 🎯' : 'LOSS 🛑'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          color: isWin ? '#10B981' : '#EF4444'
                        }}>
                          {t.pnlDollars >= 0 ? '+' : ''}${t.pnlDollars} ({t.pnlPercent}%)
                        </div>
                      </div>

                      {/* Confluencias Detectadas */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                        {t.reasons.map((r, ri) => (
                          <span
                            key={ri}
                            style={{
                              fontSize: '0.62rem',
                              backgroundColor: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>

                      {/* Precios de Entrada, SL y TP */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary)',
                        marginTop: '2px'
                      }}>
                        <span>Entrada: <strong style={{ color: 'var(--text-primary)' }}>${t.entryPrice.toLocaleString()}</strong></span>
                        <span>SL: <strong style={{ color: '#EF4444' }}>${t.stopLoss.toLocaleString()}</strong></span>
                        <span>TP: <strong style={{ color: '#10B981' }}>${t.takeProfit.toLocaleString()}</strong></span>
                      </div>

                      {/* Botón Proyectar en Gráfico */}
                      {onPlotTradeLevels && (
                        <button
                          type="button"
                          onClick={() => {
                            const tradeKey = `agent-${t.id || t.timestamp || t.type}`;
                            onPlotTradeLevels({
                              symbol: t.symbol || liveSymbol,
                              entry: t.entryPrice,
                              stopLoss: t.stopLoss,
                              takeProfit: t.takeProfit,
                              isLong: t.type === 'LONG',
                              label: `Agente Cuántico (${t.type})`
                            });
                            setPlottedTradeId(tradeKey);
                            setTimeout(() => setPlottedTradeId(null), 3500);
                          }}
                          style={{
                            width: '100%',
                            padding: '5px',
                            marginTop: '3px',
                            borderRadius: '6px',
                            border: plottedTradeId === `agent-${t.id || t.timestamp || t.type}`
                              ? '1px solid #10B981'
                              : '1px solid rgba(16, 185, 129, 0.3)',
                            backgroundColor: plottedTradeId === `agent-${t.id || t.timestamp || t.type}`
                              ? 'rgba(16, 185, 129, 0.25)'
                              : 'rgba(16, 185, 129, 0.08)',
                            color: plottedTradeId === `agent-${t.id || t.timestamp || t.type}`
                              ? '#34D399'
                              : '#10B981',
                            fontWeight: '700',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            boxShadow: plottedTradeId === `agent-${t.id || t.timestamp || t.type}`
                              ? '0 0 8px rgba(16, 185, 129, 0.35)'
                              : 'none'
                          }}
                        >
                          <Crosshair size={12} />
                          <span>
                            {plottedTradeId === `agent-${t.id || t.timestamp || t.type}`
                              ? '¡Nivel Proyectado en Gráfico! 🎯'
                              : 'Ver Trade en Gráfico'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Cpu size={24} style={{ opacity: 0.5, color: '#10B981' }} />
          <span>Presiona <strong>"Ejecutar Auditoría Histórica"</strong> para analizar las {chartData ? chartData.length : 0} velas de {cleanSym} mediante confluencias técnicas.</span>
        </div>
      )}
    </div>
  );
}
