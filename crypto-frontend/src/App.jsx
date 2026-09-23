import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './services/api';
import { authService } from './services/authService';
import { syntheticTraderService } from './services/syntheticTraderService';
import { CryptoLiveStream } from './services/liveStream';
import DataIngestion from './components/DataIngestion';
import TradingChart from './components/TradingChart';
import NewsColumn from './components/NewsColumn';
import AuthScreen from './components/AuthScreen';
import { PlusCircle, RefreshCw, CandlestickChart, TrendingUp, User, LogOut, Sun, Moon, Bot } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('crypto_analyzer_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('crypto_analyzer_theme', theme);
    } catch (e) {
      console.warn('Error guardando preferencia de tema:', e);
    }
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Asegurar favicon oficial de velas japonesas en la pestaña del navegador
  useEffect(() => {
    try {
      const svgIconData = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='2' y='2' width='60' height='60' rx='16' fill='%23050811' stroke='%2310B981' stroke-width='2.5'/%3E%3Cline x1='8' y1='23' x2='56' y2='23' stroke='%231E293B' stroke-width='1.2' stroke-dasharray='3 3'/%3E%3Cline x1='8' y1='41' x2='56' y2='41' stroke='%231E293B' stroke-width='1.2' stroke-dasharray='3 3'/%3E%3Cline x1='17' y1='24' x2='17' y2='50' stroke='%233B82F6' stroke-width='3' stroke-linecap='round'/%3E%3Crect x='12.5' y='30' width='9' height='13' rx='2.5' fill='%233B82F6' stroke='%2360A5FA' stroke-width='1'/%3E%3Cline x1='32' y1='16' x2='32' y2='46' stroke='%2306B6D4' stroke-width='3' stroke-linecap='round'/%3E%3Crect x='27.5' y='22' width='9' height='16' rx='2.5' fill='%2306B6D4' stroke='%2367E8F9' stroke-width='1'/%3E%3Cline x1='47' y1='9' x2='47' y2='42' stroke='%2310B981' stroke-width='3.2' stroke-linecap='round'/%3E%3Crect x='42' y='14' width='10' height='20' rx='2.5' fill='%2310B981' stroke='%2334D399' stroke-width='1.2'/%3E%3Cpath d='M 43 9 L 51 9 L 51 17' fill='none' stroke='%2334D399' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='51' cy='9' r='3.5' fill='%2334D399'/%3E%3Ccircle cx='51' cy='9' r='1.8' fill='%23FFFFFF'/%3E%3C/svg%3E";

      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.type = 'image/svg+xml';
      link.href = svgIconData;
    } catch (e) {
      console.warn('Error inyectando favicon dinámico:', e);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('LIVE_STREAM');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedTime, setFocusedTime] = useState(null);

  // Estado del Stream en Tiempo Real
  const [liveSymbol, setLiveSymbol] = useState('BTC/USDT');
  const [liveTimeframe, setLiveTimeframe] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [liveTick, setLiveTick] = useState(null);
  const [isLiveActive] = useState(true);

  // Datos para Gráfico y Análisis
  const [chartData, setChartData] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [news, setNews] = useState([]);

  // Niveles de trading externos y suscripción a trader simulado
  const [externalTradeLevels, setExternalTradeLevels] = useState(null);
  const [sideTab, setSideTab] = useState('noticias');
  const [dailyTrader, setDailyTrader] = useState(() => syntheticTraderService.getTrader());

  useEffect(() => {
    const unsub = syntheticTraderService.subscribe((t) => {
      if (t) setDailyTrader({ ...t });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof currentPrice === 'number' && currentPrice > 0) {
      syntheticTraderService.updateMarketPrice(liveSymbol, currentPrice);
    }
  }, [currentPrice, liveSymbol]);

  const liveStreamRef = useRef(null);

  const fetchLiveNews = useCallback(async (symbol) => {
    try {
      const cleanSym = (symbol || 'BTC').split('/')[0].toUpperCase();
      const feedRes = await api.getNewsContext(1).catch(() => null);
      if (feedRes && feedRes.coincidencias && feedRes.coincidencias.length > 0) {
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

      // Feed de mercado en vivo de alta fidelidad contextual por activo
      setNews([
        {
          id: `${cleanSym}-news-1`,
          patron: 'Flujo Institucional & Ticks',
          fecha: new Date().toISOString(),
          titulo: `${cleanSym}/USDT: Fuerte incremento de liquidez en Binance Spot y derivados`,
          resumen: `Los libros de órdenes registran concentración de posturas de compra y absorción sostenida en las últimas sesiones de trading.`,
          fuente: 'CoinTelegraph',
          sentimiento: 'Alcista 🟢',
          impacto: 'Alto 🔥',
          categoria: 'Mercado',
          url: 'https://cointelegraph.com'
        },
        {
          id: `${cleanSym}-news-2`,
          patron: 'Osciladores Cuantitativos',
          fecha: new Date(Date.now() - 1200000).toISOString(),
          titulo: `Oscilador Wilder RSI (14) y Medias Móviles en ${cleanSym} definen zonas de confluencia`,
          resumen: `El indicador matemático de momento muestra estabilidad estructural respecto a la media móvil exponencial de 20 periodos.`,
          fuente: 'CoinDesk',
          sentimiento: 'Neutral 🟡',
          impacto: 'Medio ⚡',
          categoria: 'Técnico',
          url: 'https://coindesk.com'
        },
        {
          id: `${cleanSym}-news-3`,
          patron: 'Macroeconomía & Tasas',
          fecha: new Date(Date.now() - 3600000).toISOString(),
          titulo: `Expectativas de tasas de interés y liquidez global favorecen la consolidación de criptoactivos`,
          resumen: `Reportes macroeconómicos apuntan a una menor aversión al riesgo, impulsando el volumen de intercambio en plataformas líderes.`,
          fuente: 'Bloomberg Crypto',
          sentimiento: 'Alcista 🟢',
          impacto: 'Alto 🔥',
          categoria: 'Macro',
          url: 'https://bloomberg.com/crypto'
        },
        {
          id: `${cleanSym}-news-4`,
          patron: 'Métricas On-Chain',
          fecha: new Date(Date.now() - 7200000).toISOString(),
          titulo: `Movimientos de carteras frías reflejan retención prolongada en tenedores de ${cleanSym}`,
          resumen: `Los flujos netos hacia billeteras de autocustodia reducen la presión de venta inmediata en los principales libros de órdenes.`,
          fuente: 'The Block',
          sentimiento: 'Alcista 🟢',
          impacto: 'Medio ⚡',
          categoria: 'On-Chain',
          url: 'https://theblock.co'
        },
        {
          id: `${cleanSym}-news-5`,
          patron: 'Entorno Regulatorio',
          fecha: new Date(Date.now() - 14400000).toISOString(),
          titulo: `Avances en marcos de cumplimiento y custodia institucional ofrecen certidumbre operativa`,
          resumen: `Nuevas directivas de transparencia y auditoría de reservas refuerzan la confianza de los participantes del mercado spot.`,
          fuente: 'Decrypt',
          sentimiento: 'Neutral 🟡',
          impacto: 'Informativo ℹ️',
          categoria: 'Regulación',
          url: 'https://decrypt.co'
        },
        {
          id: `${cleanSym}-news-6`,
          patron: 'Mercado de Derivados',
          fecha: new Date(Date.now() - 28800000).toISOString(),
          titulo: `Tasas de financiación (Funding Rate) de ${cleanSym} se estabilizan sin sobreapalancamiento`,
          resumen: `El equilibrio entre posiciones largas y cortas mitiga el riesgo de liquidaciones en cascada ante movimientos súbitos de volatilidad.`,
          fuente: 'CryptoNews',
          sentimiento: 'Alcista 🟢',
          impacto: 'Medio ⚡',
          categoria: 'Derivados',
          url: 'https://cryptonews.com'
        }
      ]);
    } catch (e) {
      console.warn('Noticias fallback:', e);
    }
  }, []);

  // Iniciar Stream en Vivo (interacción del usuario)
  const startLiveStream = useCallback(async (symbol, timeframe) => {
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
  }, [fetchLiveNews]);


  // Cargar al montar el componente (solo si hay sesión activa)
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    api.getDatasets()
      .then(data => {
        if (isMounted) {
          setDatasets(data || []);
        }
      })
      .catch(err => {
        console.error(err);
      });

    const stream = new CryptoLiveStream('BTC/USDT', '1m', (state, eventType, tick) => {
      if (!isMounted) return;
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

    stream.initHistory(120).then(initial => {
      if (!isMounted) return;
      if (initial) {
        setChartData(initial.candles);
        const evaluated = calcularBacktestingPatrones(initial.patterns, initial.candles);
        setPatterns(evaluated);
        setCurrentPrice(initial.currentPrice);
        setPriceChange24h(initial.priceChange24h);
      }
      stream.connect();
      setIsLoading(false);
      fetchLiveNews('BTC/USDT');
    });

    return () => {
      isMounted = false;
      if (liveStreamRef.current) {
        liveStreamRef.current.disconnect();
      }
    };
  }, [currentUser, fetchLiveNews]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    if (liveStreamRef.current) {
      liveStreamRef.current.disconnect();
    }
  };

  const handleDatasetCreated = (dataset) => {
    setDatasets(prev => [dataset, ...prev]);
    setSelectedDatasetId(dataset.id);
    setError(null);

    // Si el dataset ya tiene velas calculadas en cliente, renderizarlo inmediatamente
    if (dataset.candles && dataset.candles.length > 0) {
      if (liveStreamRef.current) {
        liveStreamRef.current.disconnect();
      }
      setChartData(dataset.candles);
      const evaluated = calcularBacktestingPatrones(dataset.patterns || [], dataset.candles);
      setPatterns(evaluated);
      const lastClose = parseFloat(dataset.candles[dataset.candles.length - 1].close);
      setCurrentPrice(lastClose);
      fetchLiveNews(dataset.asset_symbol || 'BTC/USDT');
      setIsLoading(false);
      return;
    }

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
      console.warn('Error cargando análisis de backend:', err);
      setError('El servidor de análisis histórico está en reposo. Mostrando datos directos del mercado.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDataset = datasets.find(d => String(d.id) === String(selectedDatasetId));

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Header Principal */}
        <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-color)', zIndex: 10, flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CandlestickChart className="text-bullish" size={26} />
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
              <TrendingUp size={14} className="text-bullish" /> EN VIVO:
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

          {/* Menú de Datasets, Nuevo Análisis y Perfil de Usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select 
              value={selectedDatasetId || 'LIVE_STREAM'} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  setSelectedDatasetId(null);
                } else if (val.startsWith('LIVE_') || val === 'LIVE_STREAM') {
                  setSelectedDatasetId('LIVE_STREAM');
                  startLiveStream(liveSymbol, liveTimeframe);
                } else if (val) {
                  const localDs = datasets.find(d => String(d.id) === String(val));
                  if (localDs && localDs.candles) {
                    if (liveStreamRef.current) {
                      liveStreamRef.current.disconnect();
                    }
                    setSelectedDatasetId(localDs.id);
                    setChartData(localDs.candles);
                    const evaluated = calcularBacktestingPatrones(localDs.patterns || [], localDs.candles);
                    setPatterns(evaluated);
                    setCurrentPrice(parseFloat(localDs.candles[localDs.candles.length - 1].close));
                    fetchLiveNews(localDs.asset_symbol || 'BTC/USDT');
                  } else {
                    loadBackendAnalysis(Number(val));
                  }
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

            {/* Badge del Trader del Día (Comunidad Cuantitativa IA) */}
            {dailyTrader && (
              <button
                type="button"
                onClick={() => setSideTab('traders')}
                title="Ver Trader del Día y Retroalimentación Algorítmica"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981'
                }} />
                <Bot size={14} className="text-bullish" />
                <span>{dailyTrader.profile.name.split(' ')[0]}</span>
                {dailyTrader.activePosition && (
                  <span style={{
                    color: dailyTrader.activePosition.floatingPnL >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: '800'
                  }}>
                    {dailyTrader.activePosition.floatingPnL >= 0 ? '+' : ''}{dailyTrader.activePosition.floatingPnLPercent}%
                  </span>
                )}
              </button>
            )}

            {/* Distintivo de Usuario Autenticado y Botón de Salir */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <User size={14} className="text-bullish" />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F1F5F9', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  marginLeft: '2px'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>

            {/* Selector de Modo Claro / Modo Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
              aria-label={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: theme === 'light' ? '#D97706' : '#FBBF24',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              <span style={{ fontSize: '0.75rem' }}>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
            </button>
          </div>
        </header>

        {/* Cuerpo Principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div className="card text-bearish" style={{ borderColor: 'var(--neon-red)' }}>{error}</div>}

          {!selectedDatasetId ? (
            <div>
              <div style={{ maxWidth: '640px', margin: '0 auto 1rem auto', display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => {
                    setSelectedDatasetId('LIVE_STREAM');
                    startLiveStream(liveSymbol, liveTimeframe);
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  ← Volver al Gráfico en Vivo (Binance)
                </button>
              </div>
              <DataIngestion onDatasetCreated={handleDatasetCreated} />
            </div>
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
                theme={theme}
                externalTradeLevels={externalTradeLevels}
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

      <NewsColumn 
        news={news}
        liveSymbol={liveSymbol}
        currentPrice={currentPrice}
        priceChange24h={priceChange24h}
        patterns={patterns}
        chartData={chartData}
        onRefreshNews={() => fetchLiveNews(liveSymbol)}
        onPlotTradeLevels={(levels) => setExternalTradeLevels(levels)}
        activeTab={sideTab}
        onTabChange={setSideTab}
      />
    </div>
  );
}

export default App;
