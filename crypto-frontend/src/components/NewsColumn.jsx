import { useState, useMemo, useEffect } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  BarChart2, 
  Bot, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { syntheticTraderService } from '../services/syntheticTraderService';
import { QuantAgentEngine } from '../services/quantAgentEngine';
import { microstructureService } from '../services/microstructureService';

import NewsFeedTab from './news/NewsFeedTab';
import SentimentTab from './news/SentimentTab';
import TechnicalTab from './news/TechnicalTab';
import AgentAuditView from './news/AgentAuditView';
import DailyTraderView from './news/DailyTraderView';

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
  onTabChange = null,
  orderFlowState = null,
  mtfState = null
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

  const [filterSentiment, setFilterSentiment] = useState('all'); // 'all' | 'alcista' | 'bajista' | 'macro'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syntheticTrader, setSyntheticTrader] = useState(() => syntheticTraderService.getTrader());
  const [agentAudit, setAgentAudit] = useState(() => QuantAgentEngine.getLatestAudit());
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [traderSubTab, setTraderSubTab] = useState('agent'); // 'agent' | 'daily'
  const [microstructure, setMicrostructure] = useState(() => microstructureService.getState());
  const [plottedTradeId, setPlottedTradeId] = useState(null);

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
        }, microstructure, orderFlowState, mtfState);
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
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <aside className="card" style={{ 
      width: '380px', 
      minWidth: '340px', 
      height: 'calc(100vh - 2.5rem)',
      margin: '1.25rem 1.25rem 1.25rem 0',
      display: 'flex', 
      flexDirection: 'column',
      padding: '0',
      overflow: 'hidden',
      borderRadius: '16px'
    }}>
      {/* Cabecera de la Barra Lateral */}
      <div style={{ 
        padding: '1rem 1.25rem', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'var(--bg-elevated)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neon-green)'
          }}>
            {activeTab === 'noticias' && <Newspaper size={16} />}
            {activeTab === 'sentimiento' && <TrendingUp size={16} />}
            {activeTab === 'tecnico' && <BarChart2 size={16} />}
            {activeTab === 'traders' && <Bot size={16} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
              Terminal Contextual
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {cleanSym}/USDT • Datos de Binance
            </span>
          </div>
        </div>

        {onRefreshNews && (
          <button 
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Actualizar datos"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: isRefreshing ? 'var(--neon-green)' : 'var(--text-secondary)', 
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        )}
      </div>

      {/* Selector de Pestañas de Navegación */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-base)',
        padding: '0.25rem'
      }}>
        {[
          { id: 'noticias', label: 'Noticias', icon: Newspaper },
          { id: 'sentimiento', label: 'Sentimiento', icon: TrendingUp },
          { id: 'tecnico', label: 'Técnico', icon: BarChart2 },
          { id: 'traders', label: 'IA Traders', icon: Bot }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.25rem',
                fontSize: '0.75rem',
                fontWeight: isSelected ? '800' : '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: isSelected ? 'var(--neon-green)' : 'transparent',
                color: isSelected ? '#000000' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Dinámico de la Pestaña */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {activeTab === 'noticias' && (
          <NewsFeedTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cleanSym={cleanSym}
            filterSentiment={filterSentiment}
            setFilterSentiment={setFilterSentiment}
            filteredNews={filteredNews}
            formatTime={formatTime}
          />
        )}

        {activeTab === 'sentimiento' && (
          <SentimentTab
            fearAndGreed={fearAndGreed}
            cleanSym={cleanSym}
            priceChange24h={priceChange24h}
          />
        )}

        {activeTab === 'tecnico' && (
          <TechnicalTab
            technicalSummary={technicalSummary}
            patterns={patterns}
          />
        )}

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

            {traderSubTab === 'agent' && (
              <AgentAuditView
                cleanSym={cleanSym}
                chartData={chartData}
                liveSymbol={liveSymbol}
                handleRunAgentAudit={handleRunAgentAudit}
                isRunningAudit={isRunningAudit}
                microstructure={microstructure}
                orderFlowState={orderFlowState}
                mtfState={mtfState}
                agentAudit={agentAudit}
                onPlotTradeLevels={onPlotTradeLevels}
                plottedTradeId={plottedTradeId}
                setPlottedTradeId={setPlottedTradeId}
              />
            )}

            {traderSubTab === 'daily' && (
              <DailyTraderView
                syntheticTrader={syntheticTrader}
                syntheticTraderService={syntheticTraderService}
                liveSymbol={liveSymbol}
                currentPrice={currentPrice}
                chartData={chartData}
                onPlotTradeLevels={onPlotTradeLevels}
                plottedTradeId={plottedTradeId}
                setPlottedTradeId={setPlottedTradeId}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
