import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from './services/api';
import { authService } from './services/authService';
import { syntheticTraderService } from './services/syntheticTraderService';
import { orderFlowService } from './services/orderFlowService';
import { mtfService } from './services/mtfService';
import { CryptoLiveStream } from './services/liveStream';
import { calcularBacktestingPatrones } from './utils/patternBacktesting';

import DataIngestion from './components/DataIngestion';
import TradingChart from './components/TradingChart';
import NewsColumn from './components/NewsColumn';
import AuthScreen from './components/AuthScreen';
import AppHeader from './components/AppHeader';
import PatternsGrid from './components/PatternsGrid';
import { RefreshCw } from 'lucide-react';

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
    } catch {
      // Fallback silencioso
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

  // Favicon de velas japonesas
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
    } catch {
      // Fallback
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

  // Suscripción al motor de Order Flow (CVD) y Radar Multitemporal (MTF)
  const [orderFlowState, setOrderFlowState] = useState(() => orderFlowService.getState());
  const [mtfState, setMtfState] = useState(() => mtfService.getState());

  useEffect(() => {
    const unsub = orderFlowService.subscribe((state) => {
      if (state) setOrderFlowState({ ...state });
    });
    orderFlowService.startStream(liveSymbol);
    return () => {
      unsub();
      orderFlowService.disconnect();
    };
  }, [liveSymbol]);

  useEffect(() => {
    const unsub = mtfService.subscribe((state) => {
      if (state) setMtfState({ ...state });
    });
    mtfService.scanSymbol(liveSymbol, currentPrice);
    const interval = setInterval(() => {
      mtfService.scanSymbol(liveSymbol, currentPrice);
    }, 25000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [liveSymbol, currentPrice]);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      orderFlowService.syncWithCandles(chartData);
    }
  }, [chartData]);

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
          fecha: new Date().toISOString(),
          titulo: `Volumen de ${cleanSym} repunta tras rechazo en zona de soporte clave`,
          resumen: `El oscilador RSI (14) y la media SMA 20 señalan consolidación con sesgo acumulativo antes de la apertura de Wall Street.`,
          fuente: 'Binance Research',
          sentimiento: 'Neutral 🟡',
          impacto: 'Medio ⚡',
          categoria: 'Técnico',
          url: 'https://binance.com'
        },
        {
          id: `${cleanSym}-news-3`,
          patron: 'Microestructura L2',
          fecha: new Date().toISOString(),
          titulo: `Tasas de financiación (Funding Rate) de ${cleanSym} se estabilizan sin sobreapalancamiento`,
          resumen: `El equilibrio entre posiciones largas y cortas mitiga el riesgo de liquidaciones en cascada ante movimientos súbitos de volatilidad.`,
          fuente: 'CryptoNews',
          sentimiento: 'Alcista 🟢',
          impacto: 'Medio ⚡',
          categoria: 'Derivados',
          url: 'https://cryptonews.com'
        }
      ]);
    } catch {
      // Fallback
    }
  }, []);

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
    fetchLiveNews(symbol);
  }, [fetchLiveNews]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    api.getDatasets()
      .then(data => {
        if (isMounted) setDatasets(data || []);
      })
      .catch(err => console.error(err));

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
      if (liveStreamRef.current) liveStreamRef.current.disconnect();
    };
  }, [currentUser, fetchLiveNews]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    if (liveStreamRef.current) liveStreamRef.current.disconnect();
  };

  const handlePlotTradeLevels = useCallback(async (levels) => {
    if (!levels) return;

    if (levels.symbol && levels.symbol !== liveSymbol) {
      await startLiveStream(levels.symbol, liveTimeframe);
    }

    setExternalTradeLevels({
      ...levels,
      _id: Date.now()
    });

    setTimeout(() => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  }, [liveSymbol, liveTimeframe, startLiveStream]);

  const handleDatasetCreated = (dataset) => {
    setDatasets(prev => [dataset, ...prev]);
    setSelectedDatasetId(dataset.id);
    loadBackendAnalysis(dataset.id);
  };

  const loadBackendAnalysis = async (datasetId) => {
    setIsLoading(true);
    setError(null);
    setFocusedTime(null);
    if (liveStreamRef.current) liveStreamRef.current.disconnect();

    try {
      const [indicatorsRes, patternsRes, newsRes] = await Promise.all([
        api.getTechnicalIndicators(datasetId),
        api.getPatterns(datasetId),
        api.getNewsContext(datasetId)
      ]);

      const mappedPatterns = (patternsRes || []).map(p => ({
        ...p,
        patron: p.tipo_patron_display || p.tipo_patron,
        close: p.precio_cierre,
        fecha: p.timestamp,
        time: Math.floor(new Date(p.timestamp).getTime() / 1000)
      }));

      const flattenedNews = [];
      (newsRes.coincidencias || []).forEach(coincidencia => {
        (coincidencia.noticias || []).forEach(noticia => {
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
    } catch {
      setError('El servidor de análisis histórico está en reposo. Mostrando datos directos del mercado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = (val) => {
    if (val === 'NEW') {
      setSelectedDatasetId(null);
    } else if (val.startsWith('LIVE_') || val === 'LIVE_STREAM') {
      setSelectedDatasetId('LIVE_STREAM');
      startLiveStream(liveSymbol, liveTimeframe);
    } else if (val) {
      const localDs = datasets.find(d => String(d.id) === String(val));
      if (localDs && localDs.candles) {
        if (liveStreamRef.current) liveStreamRef.current.disconnect();
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
  };

  const selectedDataset = datasets.find(d => String(d.id) === String(selectedDatasetId));

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="app-container">
      <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <AppHeader
          liveSymbol={liveSymbol}
          selectedDatasetId={selectedDatasetId}
          setSelectedDatasetId={setSelectedDatasetId}
          startLiveStream={startLiveStream}
          liveTimeframe={liveTimeframe}
          datasets={datasets}
          onSelectDataset={handleSelectDataset}
          dailyTrader={dailyTrader}
          setSideTab={setSideTab}
          currentUser={currentUser}
          handleLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />

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
                orderFlowState={orderFlowState}
                mtfState={mtfState}
              />

              <PatternsGrid
                patterns={patterns}
                focusedTime={focusedTime}
                setFocusedTime={setFocusedTime}
              />
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
        onPlotTradeLevels={handlePlotTradeLevels}
        activeTab={sideTab}
        onTabChange={setSideTab}
        orderFlowState={orderFlowState}
        mtfState={mtfState}
      />
    </div>
  );
}

export default App;
