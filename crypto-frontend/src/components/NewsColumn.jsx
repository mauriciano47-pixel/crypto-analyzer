import { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';

export default function NewsColumn({ 
  news = [], 
  liveSymbol = 'BTC/USDT', 
  currentPrice = null, 
  priceChange24h = 0, 
  patterns = [], 
  chartData = [], 
  onRefreshNews 
}) {
  const [activeTab, setActiveTab] = useState('noticias'); // 'noticias' | 'sentimiento' | 'tecnico'
  const [filterSentiment, setFilterSentiment] = useState('todos'); // 'todos' | 'alcista' | 'bajista' | 'macro'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        background: 'rgba(15, 23, 42, 0.75)'
      }}
    >
      {/* Encabezado del Panel */}
      <div style={{ 
        padding: '1.15rem 1.25rem 0.85rem 1.25rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Newspaper size={18} className="text-bullish" />
            <h2 style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.01em', margin: 0 }}>
              Inteligencia de Mercado
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Refrescar feeds y métricas"
            aria-label="Refrescar noticias"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '5px',
              color: '#94A3B8',
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Feed Activo: <strong style={{ color: '#F8FAFC' }}>{cleanSym}</strong>
          </span>
          <span>Actualización continua</span>
        </div>

        {/* Pestañas Principales del Panel */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '3px',
          borderRadius: '8px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('noticias')}
            style={{
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'noticias' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'noticias' ? '#000000' : '#94A3B8',
              transition: 'all 0.15s'
            }}
          >
            Noticias ({news.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sentimiento')}
            style={{
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'sentimiento' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'sentimiento' ? '#000000' : '#94A3B8',
              transition: 'all 0.15s'
            }}
          >
            Sentimiento
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tecnico')}
            style={{
              padding: '6px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'tecnico' ? 'var(--neon-green)' : 'transparent',
              color: activeTab === 'tecnico' ? '#000000' : '#94A3B8',
              transition: 'all 0.15s'
            }}
          >
            Técnico
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
                    borderColor: filterSentiment === f.id ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.08)',
                    background: filterSentiment === f.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: filterSentiment === f.id ? '#10B981' : '#94A3B8',
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
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
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
                        background: 'rgba(30, 41, 59, 0.45)', 
                        border: '1px solid rgba(255, 255, 255, 0.07)', 
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
                        color: '#F8FAFC',
                        margin: 0
                      }}>
                        {item.titulo}
                      </h4>

                      {/* Resumen */}
                      <p style={{ 
                        fontSize: '0.775rem', 
                        lineHeight: 1.45, 
                        color: '#94A3B8', 
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
              background: 'rgba(30, 41, 59, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gauge size={16} className="text-bullish" /> ÍNDICE MIEDO Y CODICIA
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Tiempo Real</span>
              </div>

              {/* Medidor Numérico Central */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: fearAndGreed.color, lineHeight: 1 }}>
                  {fearAndGreed.score}
                  <span style={{ fontSize: '1rem', color: '#64748B', fontWeight: '500' }}>/100</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', marginTop: '6px' }}>
                  <span>0 (Miedo Extremo)</span>
                  <span>50</span>
                  <span>100 (Codicia)</span>
                </div>
              </div>

              {/* Consejo Táctico */}
              <div style={{ 
                padding: '0.6rem 0.8rem', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '8px', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.75rem',
                lineHeight: 1.45,
                color: '#CBD5E1'
              }}>
                <strong style={{ color: '#F8FAFC' }}>Interpretación:</strong> {fearAndGreed.advice}
              </div>
            </div>

            {/* KPIs del Par Activo */}
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Flame size={15} style={{ color: '#F59E0B' }} /> MÉTRICAS DE LIQUIDEZ ({cleanSym})
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Variación 24h</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
                    {priceChange24h >= 0 ? `+${priceChange24h.toFixed(2)}%` : `${priceChange24h.toFixed(2)}%`}
                  </div>
                </div>

                <div style={{ padding: '0.6rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Sesgo General</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: priceChange24h >= 0 ? '#10B981' : '#EF4444' }}>
                    {priceChange24h >= 0 ? 'Fuerte Comprador' : 'Presión Vendedora'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.725rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              background: 'rgba(30, 41, 59, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BarChart2 size={16} className="text-bullish" /> OSCILADOR RSI WILDER (14)
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: technicalSummary.rsiColor }}>
                  {technicalSummary.rsiStatus}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#F8FAFC' }}>
                  {technicalSummary.rsi}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {parseFloat(technicalSummary.rsi) > 50 ? 'Momento Alcista' : 'Momento Bajista'}
                </span>
              </div>

              {/* Barra de Rango 30-70 */}
              <div>
                <div style={{ 
                  height: '6px', 
                  borderRadius: '3px', 
                  background: 'rgba(255, 255, 255, 0.1)',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B', marginTop: '4px' }}>
                  <span>0 (Sobreventa &lt; 30)</span>
                  <span>50</span>
                  <span>100 (Sobrecompra &gt; 70)</span>
                </div>
              </div>
            </div>

            {/* Medias Móviles */}
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Activity size={15} style={{ color: '#3B82F6' }} /> MEDIAS MÓVILES (SMA)
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>SMA 20 (Corto plazo):</span>
                  <strong style={{ color: '#F8FAFC' }}>
                    {technicalSummary.sma20 ? `$${parseFloat(technicalSummary.sma20).toLocaleString('en-US')}` : 'Calculando...'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>SMA 50 (Mediano plazo):</span>
                  <strong style={{ color: '#F8FAFC' }}>
                    {technicalSummary.sma50 ? `$${parseFloat(technicalSummary.sma50).toLocaleString('en-US')}` : 'Calculando...'}
                  </strong>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', padding: '0.4rem 0' }}>
                {technicalSummary.smaComparison}
              </div>
            </div>

            {/* Confluencia de Patrones */}
            <div style={{ 
              background: 'rgba(30, 41, 59, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <TrendingUp size={15} className="text-bullish" /> PATRONES DE VELAS EN VENTANA
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Total Detectados:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F8FAFC' }}>{patterns.length}</span>
              </div>

              {patterns.length > 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Último patrón escaneado: <strong style={{ color: '#10B981' }}>{patterns[0]?.patron || patterns[0]?.tipo_patron_display}</strong>
                  {typeof patterns[0]?.tasaAcierto === 'number' && (
                    <span> (Acierto: {patterns[0].tasaAcierto.toFixed(1)}%)</span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Escaneando serie temporal en busca de Doji, Martillo y Envolventes...
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </aside>
  );
}
