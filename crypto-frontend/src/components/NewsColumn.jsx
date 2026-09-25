import { useState, useMemo, useEffect } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  Flame, 
  RefreshCw, 
  ExternalLink, 
  Gauge, 
  BarChart2, 
  Activity, 
  Clock, 
  Search,
  CheckCircle2,
  Info,
  Bot,
  MapPin,
  TrendingDown,
  Crosshair,
  Award,
  Zap,
  RotateCw,
  ShieldCheck,
  Cpu,
  Layers,
  Play,
  Scale,
  Anchor
} from 'lucide-react';
import { syntheticTraderService } from '../services/syntheticTraderService';
import { QuantAgentEngine } from '../services/quantAgentEngine';
import { microstructureService } from '../services/microstructureService';

export default function NewsColumn({ 
  news = [], 
  liveSymbol = 'BTC/USDT', 
  currentPrice = null, 
  priceChange24h = 0, 
  patterns = [], 
  chartData = [], 
  onRefreshNews,
  onPlotTradeLevels = null,
  activeTab: controlledTab = null,
  onTabChange = null
}) {
  const [internalTab, setInternalTab] = useState('noticias'); // 'noticias' | 'sentimiento' | 'tecnico' | 'traders'
  const activeTab = controlledTab || internalTab;

  const handleTabClick = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [filterSentiment, setFilterSentiment] = useState('todos'); // 'todos' | 'alcista' | 'bajista' | 'macro'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syntheticTrader, setSyntheticTrader] = useState(() => syntheticTraderService.getTrader());
  const [agentAudit, setAgentAudit] = useState(() => QuantAgentEngine.getLatestAudit());
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [traderSubTab, setTraderSubTab] = useState('agent'); // 'agent' | 'daily'
  const [microstructure, setMicrostructure] = useState(() => microstructureService.getState());

  useEffect(() => {
    const unsub = syntheticTraderService.subscribe((trader) => {
      if (trader) {
        setSyntheticTrader({ ...trader });
      }
    });
    return unsub;
  }, []);

  // Suscripción y conexión al motor de microestructura L2 y funding rates
  useEffect(() => {
    const unsub = microstructureService.subscribe((ms) => {
      if (ms) setMicrostructure({ ...ms });
    });
    microstructureService.startStream(liveSymbol, currentPrice);
    return () => {
      unsub();
      microstructureService.stopStream();
    };
  }, [liveSymbol, currentPrice]);

  // Sincronizar al trader con las velas históricas reales cuando estén disponibles
  useEffect(() => {
    if (chartData && chartData.length >= 30) {
      syntheticTraderService.syncWithCandles(chartData, liveSymbol, currentPrice);
    }
  }, [chartData, liveSymbol, currentPrice]);

  const handleRunAgentAudit = () => {
    if (!chartData || chartData.length < 30) {
      alert('Se requieren al menos 30 velas históricas para ejecutar la auditoría cuantitativa.');
      return;
    }
    setIsRunningAudit(true);
    setTimeout(() => {
      try {
        const result = QuantAgentEngine.runHistoricalAudit(chartData, liveSymbol, {
          initialBalance: 10000,
          riskPerTrade: 0.015,
          maxHoldingBars: 35
        }, microstructure);
        setAgentAudit(result);
      } catch (err) {
        console.error('[QuantAgent] Error en auditoría cuantitativa:', err);
      } finally {
        setIsRunningAudit(false);
      }
    }, 250);
  };

  const cleanSym = (liveSymbol || 'BTC').split('/')[0].toUpperCase();

  // Calcular métricas técnicas basadas en la última vela
  const technicalSummary = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        rsi: 54.2,
        rsiStatus: 'Neutral 🟡',
        sma20: null,
        sma50: null,
        smaComparison: 'Calculando...',
        trend: 'Neutral'
      };
    }

    const lastCandle = chartData[chartData.length - 1];
    const prevCandle = chartData.length > 1 ? chartData[chartData.length - 2] : lastCandle;

    const rsi = typeof lastCandle.rsi_14 === 'number' ? lastCandle.rsi_14 : 52.5;
    let rsiStatus = 'Neutral 🟡';
    let rsiColor = '#F59E0B';
    if (rsi >= 70) {
      rsiStatus = 'Sobrecompra ⚠️';
      rsiColor = '#EF4444';
    } else if (rsi <= 30) {
      rsiStatus = 'Sobreventa 🟢';
      rsiColor = '#10B981';
    }

    const close = parseFloat(lastCandle.close || currentPrice || 0);
    const sma20 = typeof lastCandle.sma_20 === 'number' ? lastCandle.sma_20 : null;
    const sma50 = typeof lastCandle.sma_50 === 'number' ? lastCandle.sma_50 : null;

    let smaComparison = 'Precio alineado con medias móviles';
    let trend = 'Neutral';

    if (sma20 && close > sma20) {
      smaComparison = 'Precio sobre SMA 20 (Soporte dinámico alcista)';
      trend = 'Alcista 🟢';
    } else if (sma20 && close < sma20) {
      smaComparison = 'Precio bajo SMA 20 (Resistencia inmediata)';
      trend = 'Bajista 🔴';
    }

    return {
      rsi: rsi.toFixed(1),
      rsiStatus,
      rsiColor,
      close,
      sma20: sma20 ? sma20.toFixed(2) : null,
      sma50: sma50 ? sma50.toFixed(2) : null,
      smaComparison,
      trend,
      prevClose: parseFloat(prevCandle.close || close)
    };
  }, [chartData, currentPrice]);

  // Cálculo dinámico del Crypto Fear & Greed Index
  const fearAndGreed = useMemo(() => {
    const rsiVal = parseFloat(technicalSummary.rsi) || 50;
    const change = priceChange24h || 0;

    // Fórmula equilibrada de sentimiento basada en momento y variación
    let score = Math.round(50 + (rsiVal - 50) * 0.65 + change * 1.8);
    score = Math.max(12, Math.min(92, score));

    let label = 'Neutral';
    let color = '#F59E0B';
    let advice = 'Mercado en consolidación equilibrada sin sesgo direccional extremo.';

    if (score >= 75) {
      label = 'Extrema Codicia';
      color = '#10B981';
      advice = 'Optimismo muy elevado en el mercado spot. Precaución ante posibles tomas de beneficios.';
    } else if (score >= 56) {
      label = 'Codicia Moderada';
      color = '#34D399';
      advice = 'Sentimiento positivo con flujo comprador constante en Binance Spot y derivados.';
    } else if (score <= 25) {
      label = 'Extremo Miedo';
      color = '#EF4444';
      advice = 'Pesimismo generalizado y ventas forzadas. Oportunidad histórica de acumulación por rebote.';
    } else if (score <= 45) {
      label = 'Miedo';
      color = '#F87171';
      advice = 'Cautela en participantes institucionales con preferencia por preservación de capital.';
    }

    return { score, label, color, advice };
  }, [technicalSummary.rsi, priceChange24h]);

  // Filtrar noticias
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      // Filtro por sentimiento / categoría
      if (filterSentiment === 'alcista') {
        const isBull = (item.sentimiento || '').toLowerCase().includes('alcista') || (item.sentimiento || '').toLowerCase().includes('positivo');
        if (!isBull) return false;
      } else if (filterSentiment === 'bajista') {
        const isBear = (item.sentimiento || '').toLowerCase().includes('bajista') || (item.sentimiento || '').toLowerCase().includes('negativo');
        if (!isBear) return false;
      } else if (filterSentiment === 'macro') {
        const isMacro = (item.patron || '').toLowerCase().includes('macro') || (item.categoria || '').toLowerCase().includes('macro');
        if (!isMacro) return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (item.titulo || '').toLowerCase().includes(q);
        const inSummary = (item.resumen || '').toLowerCase().includes(q);
        const inSource = (item.fuente || '').toLowerCase().includes(q);
        if (!inTitle && !inSummary && !inSource) return false;
      }

      return true;
    });
  }, [news, filterSentiment, searchQuery]);

  // Manejador de refresco con micro-animación
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshNews) {
      await onRefreshNews();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Reciente';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <aside 
      className="glass" 
      style={{ 
        borderLeft: '1px solid var(--border-color)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '360px',
        overflow: 'hidden',
        background: 'var(--glass-bg)'
      }}
    >
      {/* Encabezado del Panel */}
      <div style={{ 
        padding: '1.15rem 1.25rem 0.85rem 1.25rem', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Newspaper size={18} className="text-bullish" />
            <h2 style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.01em', margin: 0, color: 'var(--heading-color)' }}>
              Inteligencia de Mercado
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refrescar feeds y métricas"
            aria-label="Refrescar noticias"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '5px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Feed Activo: <strong style={{ color: 'var(--text-primary)' }}>{cleanSym}</strong>
          </span>
          <span>Actualización continua</span>
        </div>

        {/* Pestañas Principales del Panel */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '3px',
          backgroundColor: 'var(--bg-elevated)',
          padding: '3px',
          borderRadius: '8px'
        }}>
          <button
            type="button"
            onClick={() => handleTabClick('noticias')}
            style={{
              padding: '6px 2px',
              fontSize: '0.72rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'noticias' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'noticias' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 0.15s'
            }}
          >
            Noticias
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('sentimiento')}
            style={{
              padding: '6px 2px',
              fontSize: '0.72rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'sentimiento' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'sentimiento' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 0.15s'
            }}
          >
            Sentimiento
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('tecnico')}
            style={{
              padding: '6px 2px',
              fontSize: '0.72rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'tecnico' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'tecnico' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 0.15s'
            }}
          >
            Técnico
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('traders')}
            style={{
              padding: '6px 2px',
              fontSize: '0.72rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'traders' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'traders' ? '#000000' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <Bot size={12} />
            <span>Traders IA</span>
          </button>
        </div>
      </div>

      {/* Contenido Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* ========================================================
            PESTAÑA 1: NOTICIAS EN VIVO Y FEEDS CONTEXTUALES
            ======================================================== */}
        {activeTab === 'noticias' && (
          <>
            {/* Buscador de Noticias */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748B' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar en noticias de ${cleanSym}...`}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '0.775rem', padding: '6px 10px 6px 32px' }}
              />
            </div>

            {/* Filtros Rápidos */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'todos', label: 'Todo' },
                { id: 'alcista', label: 'Alcistas 🟢' },
                { id: 'bajista', label: 'Bajistas 🔴' },
                { id: 'macro', label: 'Macro 🌐' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterSentiment(f.id)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: filterSentiment === f.id ? 'var(--neon-green)' : 'var(--border-color)',
                    background: filterSentiment === f.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                    color: filterSentiment === f.id ? '#10B981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Listado de Noticias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredNews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <Info size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.825rem' }}>No se encontraron noticias con los filtros actuales.</p>
                </div>
              ) : (
                filteredNews.map((item, i) => {
                  const isBull = (item.sentimiento || '').toLowerCase().includes('alcista') || (item.sentimiento || '').toLowerCase().includes('positivo');
                  const isBear = (item.sentimiento || '').toLowerCase().includes('bajista') || (item.sentimiento || '').toLowerCase().includes('negativo');

                  return (
                    <article 
                      key={item.id || i}
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '10px', 
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        transition: 'transform 0.15s, border-color 0.15s'
                      }}
                    >
                      {/* Meta: Fuente, Sentimiento e Impacto */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: '700',
                          padding: '2px 6px', 
                          background: 'rgba(59, 130, 246, 0.12)', 
                          color: '#60A5FA',
                          borderRadius: '4px',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          {item.fuente || 'CoinTelegraph'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: '600',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: isBull ? 'rgba(16, 185, 129, 0.12)' : isBear ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: isBull ? '#10B981' : isBear ? '#EF4444' : '#F59E0B'
                          }}>
                            {isBull ? '🟢 Alcista' : isBear ? '🔴 Bajista' : '🟡 Neutral'}
                          </span>

                          <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> {formatTime(item.fecha)}
                          </span>
                        </div>
                      </div>

                      {/* Titular */}
                      <h4 style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        lineHeight: 1.35, 
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {item.titulo}
                      </h4>

                      {/* Resumen */}
                      <p style={{ 
                        fontSize: '0.775rem', 
                        lineHeight: 1.45, 
                        color: 'var(--text-secondary)', 
                        margin: 0 
                      }}>
                        {item.resumen}
                      </p>

                      {/* Pie con Enlace */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748B' }}>
                          Categoría: {item.patron || 'Mercado'}
                        </span>
                        {item.url && item.url !== '#' && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              fontSize: '0.725rem', 
                              color: 'var(--neon-green)', 
                              textDecoration: 'none', 
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <span>Leer análisis</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ========================================================
            PESTAÑA 2: RADAR DE SENTIMIENTO & FEAR & GREED INDEX
            ======================================================== */}
        {activeTab === 'sentimiento' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Widget Fear & Greed */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gauge size={16} className="text-bullish" /> ÍNDICE MIEDO Y CODICIA
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tiempo Real</span>
              </div>

              {/* Medidor Numérico Central */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: fearAndGreed.color, lineHeight: 1 }}>
                  {fearAndGreed.score}
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/100</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: fearAndGreed.color, marginTop: '0.35rem' }}>
                  {fearAndGreed.label}
                </div>
              </div>

              {/* Barra Visual Gradiente */}
              <div>
                <div style={{ 
                  height: '8px', 
                  borderRadius: '4px', 
                  background: 'linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    left: `${fearAndGreed.score}%`,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '3px solid #0F172A',
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>0 (Miedo Extremo)</span>
                  <span>50</span>
                  <span>100 (Codicia)</span>
                </div>
              </div>

              {/* Consejo Táctico */}
              <div style={{ 
                padding: '0.6rem 0.8rem', 
                background: 'var(--bg-surface)', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                lineHeight: 1.45,
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>Interpretación:</strong> {fearAndGreed.advice}
              </div>
            </div>

            {/* KPIs del Par Activo */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Flame size={15} style={{ color: '#F59E0B' }} /> MÉTRICAS DE LIQUIDEZ ({cleanSym})
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div style={{ padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Variación 24h</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
                    {priceChange24h >= 0 ? `+${priceChange24h.toFixed(2)}%` : `${priceChange24h.toFixed(2)}%`}
                  </div>
                </div>

                <div style={{ padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sesgo General</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
                    {priceChange24h >= 0 ? 'Fuerte Comprador' : 'Presión Vendedora'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                <span>Binance WebSocket conectado sin cortes de transmisión.</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            PESTAÑA 3: DIAGNÓSTICO TÉCNICO & OSCILADORES
            ======================================================== */}
        {activeTab === 'tecnico' && (
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
        )}

        {/* ========================================================
            PESTAÑA 4: TRADER DEL DÍA (SIMULADO) & FEEDBACK ALGORÍTMICO
            ======================================================== */}
        {/* ========================================================
            PESTAÑA 4: AGENTE CUÁNTICO IA & TRADER DEL DÍA (AUDITORÍA HISTÓRICA)
            ======================================================== */}
        {activeTab === 'traders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Selector de Subpestañas Cuánticas */}
            <div style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'var(--bg-elevated)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setTraderSubTab('agent')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: traderSubTab === 'agent' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                  color: traderSubTab === 'agent' ? '#10B981' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Cpu size={14} />
                <span>Agente Cuántico</span>
              </button>
              <button
                type="button"
                onClick={() => setTraderSubTab('daily')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: traderSubTab === 'daily' ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
                  color: traderSubTab === 'daily' ? '#3B82F6' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                <Bot size={14} />
                <span>Trader del Día</span>
              </button>
            </div>

            {/* VISTA 1: CONSOLA DEL AGENTE CUANTITATIVO AUTÓNOMO */}
            {traderSubTab === 'agent' && (
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
                    {isRunningAudit ? (
                      <>
                        <RotateCw size={14} className="spin-slow" />
                        <span>Ejecutando Backtesting Walk-Forward...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        <span>🚀 Ejecutar Auditoría Histórica ({chartData ? chartData.length : 0} velas)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tarjeta de Microestructura de Mercado & Flujo de Órdenes L2 */}
                <div style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scale size={15} style={{ color: '#3B82F6' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Flujo de Órdenes L2 &amp; Microestructura
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: microstructure.isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: microstructure.isConnected ? '#10B981' : '#F59E0B',
                      border: `1px solid ${microstructure.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}>
                      {microstructure.isConnected ? 'Binance L2 Live 🟢' : 'Depth Sintético 🟡'}
                    </span>
                  </div>

                  {/* Medidor Visual de Desbalance Bids vs Asks */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', marginBottom: '4px' }}>
                      <span style={{ color: '#10B981', fontWeight: '800' }}>
                        🟢 Compras: {microstructure.bidPercentage}% ({microstructure.totalBidVol.toLocaleString()} {cleanSym})
                      </span>
                      <span style={{ color: '#EF4444', fontWeight: '800' }}>
                        🔴 Ventas: {microstructure.askPercentage}% ({microstructure.totalAskVol.toLocaleString()} {cleanSym})
                      </span>
                    </div>

                    {/* Barra de Progreso Bicolor */}
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
                                      onPlotTradeLevels({
                                        entry: t.entryPrice,
                                        stopLoss: t.stopLoss,
                                        takeProfit: t.takeProfit,
                                        isLong: t.type === 'LONG',
                                        label: `Agente: ${t.type} (${t.outcome})`
                                      });
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '4px',
                                      marginTop: '3px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                      color: '#10B981',
                                      fontWeight: '700',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Crosshair size={12} />
                                    <span>Ver Trade en Gráfico</span>
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
            )}

            {/* VISTA 2: TRADER DEL DÍA (IA SIMULADO) */}
            {traderSubTab === 'daily' && (
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
                              onPlotTradeLevels({
                                entry: pos.entryPrice,
                                stopLoss: pos.stopLoss,
                                takeProfit: pos.takeProfit,
                                isLong: pos.type === 'LONG',
                                label: `${syntheticTrader.profile.name.split(' ')[0]}`
                              });
                            }}
                            style={{
                              width: '100%',
                              padding: '7px',
                              borderRadius: '8px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              fontWeight: '700',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Crosshair size={14} />
                            <span>Ver Niveles en Gráfico TradingView</span>
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
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
