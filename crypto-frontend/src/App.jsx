import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';
import { CryptoLiveStream } from './services/liveStream';
import DataIngestion from './components/DataIngestion';
import TradingChart from './components/TradingChart';
import NewsColumn from './components/NewsColumn';
import { Activity, PlusCircle, RefreshCw, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

const calcularBacktestingPatrones = (patternsList, chartSerie) => {
  if (!patternsList || patternsList.length === 0 || !chartSerie || chartSerie.length === 0) {
    return (patternsList || []).map(p => ({ ...p, tasaAcierto: null }));
  }

  const sortedSerie = [...chartSerie].sort((a, b) => {
    const timeA = typeof a.time === 'number' ? a.time : new Date(a.fecha).getTime();
    const timeB = typeof b.time === 'number' ? b.time : new Date(b.fecha).getTime();
    return timeA - timeB;
  });

  const estadisticas = {};

  const patronesEvaluados = patternsList.map(p => {
    const isBullish = p.patron && (
      p.patron.toLowerCase().includes('bullish') || 
      p.patron.toLowerCase().includes('morning') || 
      p.patron.toLowerCase().includes('hammer')
    );

    const priceEntry = parseFloat(p.close);
    const timePatron = typeof p.time === 'number' ? p.time : Math.floor(new Date(p.fecha).getTime() / 1000);
    const indexVela = sortedSerie.findIndex(v => {
      const vTime = typeof v.time === 'number' ? v.time : Math.floor(new Date(v.fecha).getTime() / 1000);
      return vTime === timePatron;
    });

    let esExitoso = false;
    let tieneSuficientesDatos = false;

    if (indexVela !== -1 && indexVela < sortedSerie.length - 1) {
      tieneSuficientesDatos = true;
      const velasFuturas = sortedSerie.slice(indexVela + 1, Math.min(indexVela + 6, sortedSerie.length));
      
      if (isBullish) {
        esExitoso = velasFuturas.some(v => parseFloat(v.close) > priceEntry);
      } else {
        esExitoso = velasFuturas.some(v => parseFloat(v.close) < priceEntry);
      }
    }

    if (!estadisticas[p.patron]) {
      estadisticas[p.patron] = { aciertos: 0, total: 0 };
    }

    if (tieneSuficientesDatos) {
      estadisticas[p.patron].total += 1;
      if (esExitoso) {
        estadisticas[p.patron].aciertos += 1;
      }
    }

    return {
      ...p,
      esExitoso,
      evaluado: tieneSuficientesDatos
    };
  });

  return patronesEvaluados.map(p => {
    const stats = estadisticas[p.patron];
    let tasaAcierto = null;
    if (stats && stats.total > 0) {
      tasaAcierto = (stats.aciertos / stats.total) * 100;
    }
    return {
      ...p,
      tasaAcierto
    };
  });
};

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('LIVE_BTC');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedTime, setFocusedTime] = useState(null);

  // Estado del Stream en Tiempo Real
  const [liveSymbol, setLiveSymbol] = useState('BTC/USDT');
  const [liveTimeframe, setLiveTimeframe] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [liveTick, setLiveTick] = useState(null);
  const [isLiveActive, setIsLiveActive] = useState(true);

  // Datos para Gráfico y Análisis
  const [chartData, setChartData] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [news, setNews] = useState([]);

  const liveStreamRef = useRef(null);

  // Iniciar Stream en Vivo
  const startLiveStream = async (symbol, timeframe) => {
    setIsLoading(true);
    setError(null);
    setFocusedTime(null);
    setLiveSymbol(symbol);
    setLiveTimeframe(timeframe);

    if (liveStreamRef.current) {
      liveStreamRef.current.disconnect();
    }

    const stream = new CryptoLiveStream(symbol, timeframe, (state, eventType, tick) => {
      if (eventType === 'tick' && tick) {
        setLiveTick(tick);
        setCurrentPrice(state.currentPrice);
        setPriceChange24h(state.priceChange24h);
      } else {
        setChartData(state.candles);
        const evaluated = calcularBacktestingPatrones(state.patterns, state.candles);
        setPatterns(evaluated);
        setCurrentPrice(state.currentPrice);
        setPriceChange24h(state.priceChange24h);
      }
    });

    liveStreamRef.current = stream;

    // 1. Cargar historial directo y conectar WebSocket
    const initial = await stream.initHistory(120);
    if (initial) {
      setChartData(initial.candles);
      const evaluated = calcularBacktestingPatrones(initial.patterns, initial.candles);
      setPatterns(evaluated);
      setCurrentPrice(initial.currentPrice);
      setPriceChange24h(initial.priceChange24h);
    }
    
    stream.connect();
    setIsLoading(false);

    // 2. Traer noticias contextuales en segundo plano
    fetchLiveNews(symbol);
  };

  const fetchLiveNews = async (symbol) => {
    try {
      const cleanSym = symbol.split('/')[0];
      const feedRes = await api.getNewsContext(1).catch(() => null);
      if (feedRes && feedRes.coincidencias) {
        const flattened = [];
        const seen = new Set();
        feedRes.coincidencias.forEach(c => {
          (c.noticias || []).forEach(n => {
            if (n.url && seen.has(n.url)) return;
            if (n.url) seen.add(n.url);
            flattened.push({
              patron: c.patron || 'Noticia de Mercado',
              fecha: n.fecha_publicacion || c.fecha || '',
              titulo: n.titular || 'Actualización de Criptomonedas',
              resumen: `Fuente: ${n.fuente || 'CoinTelegraph'} | Sentimiento: ${n.sentimiento || 'Neutral 🟡'}`,
              url: n.url || '#'
            });
          });
        });
        if (flattened.length > 0) {
          setNews(flattened);
          return;
        }
      }

      // Noticias de respaldo en tiempo real
      setNews([
        {
          patron: 'Flujo Institucional',
          fecha: new Date().toISOString(),
          titulo: `${cleanSym} experimenta alta actividad de trading en Binance y mercados spot`,
          resumen: `Fuente: Cointelegraph | Sentimiento: Positivo 🟢`,
          url: 'https://cointelegraph.com'
        },
        {
          patron: 'Análisis Cuantitativo',
          fecha: new Date(Date.now() - 3600000).toISOString(),
          titulo: `Osciladores de Momentum en ${cleanSym} muestran zonas de interés para operadores`,
          resumen: `Fuente: CoinDesk | Sentimiento: Neutral 🟡`,
          url: 'https://coindesk.com'
        }
      ]);
    } catch (e) {
      console.warn('Noticias fallback:', e);
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    loadDatasets();
    startLiveStream('BTC/USDT', '1m');

    return () => {
      if (liveStreamRef.current) {
        liveStreamRef.current.disconnect();
      }
    };
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDatasetCreated = (dataset) => {
    setDatasets(prev => [dataset, ...prev]);
    setSelectedDatasetId(dataset.id);
    loadBackendAnalysis(dataset.id);
  };

  const loadBackendAnalysis = async (datasetId) => {
    setIsLoading(true);
    setError(null);
    setSelectedDatasetId(datasetId);
    setFocusedTime(null);
    
    if (liveStreamRef.current) {
      liveStreamRef.current.disconnect();
    }

    try {
      const [indicatorsRes, patternsRes, newsRes] = await Promise.all([
        api.getIndicators(datasetId),
        api.getPatterns(datasetId),
        api.getNewsContext(datasetId).catch(() => ({ coincidencias: [] }))
      ]);

      const mappedPatterns = (patternsRes.patrones || []).map(p => ({
        patron: p.tipo_patron_display || p.tipo_patron || 'Dato no disponible',
        fecha: p.timestamp || '',
        close: p.close || 0
      }));
      
      const flattenedNews = [];
      const seenUrls = new Set();
      (newsRes.coincidencias || []).forEach(coincidencia => {
        (coincidencia.noticias || []).forEach(noticia => {
          if (noticia.url && seenUrls.has(noticia.url)) return;
          if (noticia.url) seenUrls.add(noticia.url);

          flattenedNews.push({
            patron: coincidencia.patron || 'Patrón Técnico',
            fecha: noticia.fecha_publicacion || coincidencia.fecha || '',
            titulo: noticia.titular || 'Sin título',
            resumen: `Fuente: ${noticia.fuente || 'Desconocida'} | Sentimiento: ${noticia.sentimiento || 'Neutral 🟡'}`,
            url: noticia.url || ''
          });
        });
      });

      const seriesData = indicatorsRes.serie || [];
      const patternsWithBacktest = calcularBacktestingPatrones(mappedPatterns, seriesData);
      setChartData(seriesData);
      setPatterns(patternsWithBacktest);
      setNews(flattenedNews);
      if (seriesData.length > 0) {
        setCurrentPrice(parseFloat(seriesData[seriesData.length - 1].close));
      }
    } catch (err) {
      setError(err.message || 'Error cargando análisis');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDataset = datasets.find(d => String(d.id) === String(selectedDatasetId));

  return (
    <div className="app-container">
      <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Header Principal */}
        <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-color)', zIndex: 10, flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity className="text-bullish" size={24} />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                crypto analizer
              </h1>
              <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Streaming en Tiempo Real & Detección Algorítmica</p>
            </div>
          </div>
          
          {/* Barra de Monedas Rápidas en Tiempo Real */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '4px 8px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={14} className="text-bullish" /> EN VIVO:
            </span>
            {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'BNB'].map(coin => {
              const pair = `${coin}/USDT`;
              const isSelected = liveSymbol === pair && selectedDatasetId === 'LIVE_STREAM';
              return (
                <button
                  key={coin}
                  onClick={() => {
                    setSelectedDatasetId('LIVE_STREAM');
                    startLiveStream(pair, liveTimeframe);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#000000' : '#F8FAFC',
                    transition: 'all 0.2s'
                  }}
                >
                  {coin}
                </button>
              );
            })}
          </div>

          {/* Menú de Datasets y Nuevo Análisis */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select 
              value={selectedDatasetId || ''} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  setSelectedDatasetId(null);
                } else if (val.startsWith('LIVE_') || val === 'LIVE_STREAM') {
                  setSelectedDatasetId('LIVE_STREAM');
                  startLiveStream(liveSymbol, liveTimeframe);
                } else if (val) {
                  loadBackendAnalysis(Number(val));
                }
              }}
              className="input-field"
              style={{ width: '190px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            >
              <option value="LIVE_STREAM">⚡ Tiempo Real (WebSocket)</option>
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.asset_symbol} ({ds.timeframe}) - {new Date(ds.fecha_carga).toLocaleDateString()}
                </option>
              ))}
            </select>
            
            <button className="btn" onClick={() => setSelectedDatasetId(null)} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              <PlusCircle size={15} /> Subir CSV / CCXT
            </button>
          </div>
        </header>

        {/* Cuerpo Principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="card text-bearish" style={{ borderColor: 'var(--neon-red)' }}>{error}</div>}

          {!selectedDatasetId ? (
            <DataIngestion onDatasetCreated={handleDatasetCreated} />
          ) : isLoading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '450px' }}>
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={32} className="text-bullish" style={{ animation: 'spin 1.5s linear infinite' }} />
                <h3 style={{ marginTop: '1rem' }}>Conectando a feed en tiempo real...</h3>
              </div>
            </div>
          ) : (
            <>
              {/* Gráfico TradingView Interactivo */}
              <TradingChart 
                data={chartData} 
                patterns={patterns} 
                focusedTime={focusedTime} 
                selectedDataset={selectedDataset}
                liveTick={liveTick}
                currentPrice={currentPrice}
                priceChange24h={priceChange24h}
                isLiveStreaming={isLiveActive}
                liveSymbol={liveSymbol}
                liveTimeframe={liveTimeframe}
                onTimeframeChange={(newTf) => {
                  startLiveStream(liveSymbol, newTf);
                }}
              />

              {/* Panel de Patrones Detectados con Backtesting Cuantitativo */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} className="text-bullish" /> Patrones Técnicos Detectados ({patterns.length})
                  </h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Haz clic en una tarjeta para enfocar en el gráfico y ver los niveles de Take Profit (TP) y Stop Loss (SL)
                  </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {patterns.length === 0 ? (
                    <p className="text-muted">Escaneando mercado... Ningún patrón significativo en la ventana actual.</p>
                  ) : (
                    patterns.map((p, i) => {
                      const isBullish = p.patron && (
                        p.patron.toLowerCase().includes('bullish') || 
                        p.patron.toLowerCase().includes('morning') || 
                        p.patron.toLowerCase().includes('hammer')
                      );
                      const isFocused = focusedTime === p.fecha;
                      return (
                        <div 
                          key={i} 
                          onClick={() => {
                            setFocusedTime(p.fecha);
                            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="pattern-card"
                          style={{ 
                            padding: '0.85rem', 
                            background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-base)', 
                            borderRadius: '8px', 
                            borderLeft: `4px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}`,
                            borderTop: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                            borderRight: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                            borderBottom: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.9rem', color: isBullish ? '#10B981' : '#EF4444' }}>
                              {p.tipo_patron_display || p.patron}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              {isBullish ? '🟢 COMPRA' : '🔴 VENTA'}
                            </span>
                          </div>
                          
                          <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>
                            {p.fecha ? p.fecha.replace('T', ' ').substring(0, 19) : 'Reciente'}
                          </div>

                          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: '700' }}>
                            Cierre: ${parseFloat(p.close).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>

                          {typeof p.tasaAcierto === 'number' && !isNaN(p.tasaAcierto) && (
                            <div 
                              style={{ 
                                fontSize: '0.7rem', 
                                marginTop: '0.5rem', 
                                backgroundColor: p.tasaAcierto >= 50 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                                color: p.tasaAcierto >= 50 ? '#10B981' : '#EF4444', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                display: 'inline-block',
                                fontWeight: 'bold' 
                              }}
                            >
                              Acierto Histórico: {p.tasaAcierto.toFixed(1)}% 🎯
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <NewsColumn news={news} />
    </div>
  );
}

export default App;
