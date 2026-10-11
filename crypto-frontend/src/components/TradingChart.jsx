import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { calculateEMA, calculateBollingerBands } from '../services/indicators';
import RiskCalculatorModal from './RiskCalculatorModal';
import MtfRadarBar from './MtfRadarBar';
import ChartHeader from './chart/ChartHeader';
import TradeLevelsBanner from './chart/TradeLevelsBanner';
import { buildPatternMarkers, renderFibonacciLines, renderPivotLines } from './chart/chartOverlayUtils';

export default function TradingChart({ 
  data, 
  patterns, 
  focusedTime, 
  selectedDataset,
  liveTick = null,
  currentPrice = null,
  priceChange24h = 0,
  isLiveStreaming = true,
  liveSymbol = 'BTC/USDT',
  liveTimeframe = '1m',
  onTimeframeChange = null,
  theme = 'dark',
  externalTradeLevels = null,
  orderFlowState = null,
  mtfState = null
}) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const sma20SeriesRef = useRef();
  const sma50SeriesRef = useRef();
  const rsiContainerRef = useRef();
  const rsiChartRef = useRef();
  const rsiSeriesRef = useRef();
  const priceLinesRef = useRef([]);
  const isFirstRenderRef = useRef(true);
  const dataRef = useRef(data);
  const [priceFlash, setPriceFlash] = useState(null);
  const prevPriceRef = useRef(currentPrice);

  // Estados y referencias para indicadores técnicos
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showFibonacci, setShowFibonacci] = useState(false);
  const [showPivot, setShowPivot] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [hasActiveTradeLines, setHasActiveTradeLines] = useState(false);
  const [activeTradeInfo, setActiveTradeInfo] = useState(null);
  const externalTradeLevelsRef = useRef(externalTradeLevels);

  useEffect(() => {
    externalTradeLevelsRef.current = externalTradeLevels;
  }, [externalTradeLevels]);

  const ema20SeriesRef = useRef();
  const bollUpperSeriesRef = useRef();
  const bollLowerSeriesRef = useRef();
  const fibLinesRef = useRef([]);
  const pivotLinesRef = useRef([]);
  const tradeLinesRef = useRef([]);
  const themeRef = useRef(theme);

  // Efecto de parpadeo de precio en tiempo real
  useEffect(() => {
    if (currentPrice !== null && prevPriceRef.current !== null && currentPrice !== prevPriceRef.current) {
      const flash = currentPrice >= prevPriceRef.current ? 'bullish' : 'bearish';
      setPriceFlash(flash);
      const timer = setTimeout(() => setPriceFlash(null), 400);
      prevPriceRef.current = currentPrice;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice]);

  const handleZoomIn = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing;
    timeScale.applyOptions({ barSpacing: Math.min(currentBarSpacing * 1.25, 60) });
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing;
    timeScale.applyOptions({ barSpacing: Math.max(currentBarSpacing * 0.8, 0.5) });
  };

  const handleScrollLeft = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const logicalRange = timeScale.getVisibleLogicalRange();
    if (logicalRange) {
      const barsCount = logicalRange.to - logicalRange.from;
      const shift = Math.max(1, Math.round(barsCount * 0.2));
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from - shift,
        to: logicalRange.to - shift,
      });
    }
  };

  const handleScrollRight = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const logicalRange = timeScale.getVisibleLogicalRange();
    if (logicalRange) {
      const barsCount = logicalRange.to - logicalRange.from;
      const shift = Math.max(1, Math.round(barsCount * 0.2));
      timeScale.setVisibleLogicalRange({
        from: logicalRange.from + shift,
        to: logicalRange.to + shift,
      });
    }
  };

  const handleReset = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
  };

  const handleScrollToRecent = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().scrollToPosition(0, true);
  };

  const handleClearTradeLevels = useCallback(() => {
    if (candlestickSeriesRef.current && tradeLinesRef.current.length > 0) {
      tradeLinesRef.current.forEach(line => {
        try {
          candlestickSeriesRef.current.removePriceLine(line);
        } catch {
          // Línea ya removida
        }
      });
      tradeLinesRef.current = [];
    }
    setHasActiveTradeLines(false);
    setActiveTradeInfo(null);
  }, []);

  const handlePlotTradeLevels = useCallback((levels) => {
    if (!levels || !candlestickSeriesRef.current) return;
    handleClearTradeLevels();

    const { entry, stopLoss, takeProfit, isLong, label } = levels;
    const entryLine = candlestickSeriesRef.current.createPriceLine({
      price: entry,
      color: '#3B82F6',
      lineWidth: 2,
      lineStyle: 0,
      title: label ? `${label} ENTRADA` : 'Entrada Trade',
    });
    const slLine = candlestickSeriesRef.current.createPriceLine({
      price: stopLoss,
      color: '#EF4444',
      lineWidth: 1,
      lineStyle: 1,
      title: label ? `${label} SL` : 'Stop Loss',
    });
    const tpLine = candlestickSeriesRef.current.createPriceLine({
      price: takeProfit,
      color: '#10B981',
      lineWidth: 1,
      title: label ? `${label} TP` : 'Take Profit',
    });
    tradeLinesRef.current = [entryLine, slLine, tpLine];
    setHasActiveTradeLines(true);
    setActiveTradeInfo({
      entry,
      stopLoss,
      takeProfit,
      isLong,
      label: label || 'Posición'
    });

    if (chartRef.current) {
      try {
        chartRef.current.timeScale().scrollToPosition(0, true);
      } catch {
        // Ignorar si aún sincronizando
      }
    }
  }, [handleClearTradeLevels]);

  // Inicializar el gráfico y las series
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const isLight = themeRef.current === 'light';
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 400,
      layout: {
        background: { type: 'solid', color: isLight ? '#FFFFFF' : '#0B0E14' },
        textColor: isLight ? '#475569' : '#94A3B8',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.3)',
          style: 3,
          labelBackgroundColor: isLight ? '#E2E8F0' : '#1E293B',
        },
        horzLine: {
          color: isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.3)',
          style: 3,
          labelBackgroundColor: isLight ? '#E2E8F0' : '#1E293B',
        },
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
        autoScale: true,
      },
      watermark: {
        visible: true,
        fontSize: 40,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        color: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
        text: liveSymbol || 'CRYPTO ANALYZER',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400
        });
      }
      if (rsiContainerRef.current) {
        rsiChartRef.current?.applyOptions({
          width: rsiContainerRef.current.clientWidth,
          height: 110
        });
      }
    };
    window.addEventListener('resize', handleResize);

    chartRef.current = chart;

    // Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderVisible: true,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'SMA 20',
    });
    sma20SeriesRef.current = sma20Series;

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 2,
      title: 'SMA 50',
    });
    sma50SeriesRef.current = sma50Series;

    const ema20Series = chart.addSeries(LineSeries, {
      color: '#1E3A8A',
      lineWidth: 2,
      title: 'EMA 20',
    });
    ema20SeriesRef.current = ema20Series;

    const bollUpperSeries = chart.addSeries(LineSeries, {
      color: '#F97316',
      lineWidth: 1,
      title: 'Boll Upper',
    });
    const bollLowerSeries = chart.addSeries(LineSeries, {
      color: '#F97316',
      lineWidth: 1,
      title: 'Boll Lower',
    });
    bollUpperSeriesRef.current = bollUpperSeries;
    bollLowerSeriesRef.current = bollLowerSeries;

    // Gráfico RSI
    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 110,
      layout: {
        background: { type: 'solid', color: isLight ? '#FFFFFF' : '#0B0E14' },
        textColor: isLight ? '#475569' : '#94A3B8',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });
    rsiChartRef.current = rsiChart;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 2,
      title: 'RSI 14',
    });
    rsiSeriesRef.current = rsiSeries;

    rsiSeries.createPriceLine({ price: 70, color: '#EF4444', lineWidth: 1, lineStyle: 2, title: '70' });
    rsiSeries.createPriceLine({ price: 30, color: '#10B981', lineWidth: 1, lineStyle: 2, title: '30' });

    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) rsiChart.timeScale().setVisibleLogicalRange(range);
    });
    rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) chart.timeScale().setVisibleLogicalRange(range);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      rsiChart.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      isFirstRenderRef.current = true;
    };
  }, [liveSymbol]);

  // Actualizar tema
  useEffect(() => {
    themeRef.current = theme;
    const isLight = theme === 'light';
    const chartOptions = {
      layout: {
        background: { type: 'solid', color: isLight ? '#FFFFFF' : '#0B0E14' },
        textColor: isLight ? '#475569' : '#94A3B8',
      },
      grid: {
        vertLines: { color: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)' },
      },
      watermark: {
        color: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)',
      }
    };
    chartRef.current?.applyOptions(chartOptions);
    rsiChartRef.current?.applyOptions(chartOptions);
  }, [theme]);

  // Sincronizar velas históricas
  useEffect(() => {
    dataRef.current = data;
    if (!data || data.length === 0 || !candlestickSeriesRef.current) return;

    const formattedData = data.map(d => ({
      time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    })).sort((a, b) => a.time - b.time);

    const uniqueFormattedData = [];
    const seenTimes = new Set();
    for (const item of formattedData) {
      if (!seenTimes.has(item.time)) {
        seenTimes.add(item.time);
        uniqueFormattedData.push(item);
      }
    }
    candlestickSeriesRef.current.setData(uniqueFormattedData);

    // SMA 20
    if (sma20SeriesRef.current) {
      const rawSma20Data = data.filter(d => d.sma_20 !== null && d.sma_20 !== undefined).map(d => ({
        time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
        value: parseFloat(d.sma_20)
      })).sort((a, b) => a.time - b.time);

      const uniqueSma20Data = [];
      const seenSma20Times = new Set();
      for (const item of rawSma20Data) {
        if (!seenSma20Times.has(item.time)) {
          seenSma20Times.add(item.time);
          uniqueSma20Data.push(item);
        }
      }
      sma20SeriesRef.current.setData(uniqueSma20Data);
    }

    // SMA 50
    if (sma50SeriesRef.current) {
      const rawSma50Data = data.filter(d => d.sma_50 !== null && d.sma_50 !== undefined).map(d => ({
        time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
        value: parseFloat(d.sma_50)
      })).sort((a, b) => a.time - b.time);

      const uniqueSma50Data = [];
      const seenSma50Times = new Set();
      for (const item of rawSma50Data) {
        if (!seenSma50Times.has(item.time)) {
          seenSma20Times.add(item.time);
          uniqueSma50Data.push(item);
        }
      }
      sma50SeriesRef.current.setData(uniqueSma50Data);
    }

    // RSI 14
    if (rsiSeriesRef.current) {
      const rawRsiData = data.filter(d => d.rsi_14 !== null && d.rsi_14 !== undefined).map(d => ({
        time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
        value: parseFloat(d.rsi_14)
      })).sort((a, b) => a.time - b.time);

      const uniqueRsiData = [];
      const seenRsiTimes = new Set();
      for (const item of rawRsiData) {
        if (!seenRsiTimes.has(item.time)) {
          seenRsiTimes.add(item.time);
          uniqueRsiData.push(item);
        }
      }
      rsiSeriesRef.current.setData(uniqueRsiData);
    }

    if (isFirstRenderRef.current && chartRef.current && uniqueFormattedData.length > 0) {
      chartRef.current.timeScale().fitContent();
      isFirstRenderRef.current = false;
    }
  }, [data]);

  // Actualización en tiempo real vía WebSocket
  useEffect(() => {
    if (!liveTick || !candlestickSeriesRef.current) return;

    try {
      const formattedTick = {
        time: typeof liveTick.time === 'number' ? liveTick.time : Math.floor(new Date(liveTick.fecha).getTime() / 1000),
        open: parseFloat(liveTick.open),
        high: parseFloat(liveTick.high),
        low: parseFloat(liveTick.low),
        close: parseFloat(liveTick.close),
      };

      candlestickSeriesRef.current.update(formattedTick);

      if (liveTick.rsi_14 !== undefined && liveTick.rsi_14 !== null && rsiSeriesRef.current) {
        rsiSeriesRef.current.update({
          time: formattedTick.time,
          value: parseFloat(liveTick.rsi_14)
        });
      }

      if (liveTick.sma_20 !== undefined && liveTick.sma_20 !== null && sma20SeriesRef.current) {
        sma20SeriesRef.current.update({
          time: formattedTick.time,
          value: parseFloat(liveTick.sma_20)
        });
      }

      if (liveTick.sma_50 !== undefined && liveTick.sma_50 !== null && sma50SeriesRef.current) {
        sma50SeriesRef.current.update({
          time: formattedTick.time,
          value: parseFloat(liveTick.sma_50)
        });
      }
    } catch {
      // Ignorar desincronización transitoria de tick en streaming
    }
  }, [liveTick]);

  // Efecto EMA 20
  useEffect(() => {
    if (!ema20SeriesRef.current) return;
    if (showEMA20 && data && data.length > 0) {
      const closes = data.map(d => parseFloat(d.close));
      const emaValues = calculateEMA(closes, 20);
      const emaData = emaValues.map((v, i) => ({
        time: typeof data[i].time === 'number' ? data[i].time : Math.floor(new Date(data[i].fecha).getTime() / 1000),
        value: v,
      }));
      ema20SeriesRef.current.setData(emaData);
      ema20SeriesRef.current.applyOptions({ visible: true });
    } else {
      ema20SeriesRef.current.applyOptions({ visible: false });
    }
  }, [showEMA20, data]);

  // Efecto Bandas de Bollinger
  useEffect(() => {
    if (!bollUpperSeriesRef.current || !bollLowerSeriesRef.current) return;
    if (showBollinger && data && data.length > 0) {
      const closes = data.map(d => parseFloat(d.close));
      const { upper, lower } = calculateBollingerBands(closes);
      const upperData = upper.map((v, i) => ({
        time: typeof data[i].time === 'number' ? data[i].time : Math.floor(new Date(data[i].fecha).getTime() / 1000),
        value: v,
      }));
      const lowerData = lower.map((v, i) => ({
        time: typeof data[i].time === 'number' ? data[i].time : Math.floor(new Date(data[i].fecha).getTime() / 1000),
        value: v,
      }));
      bollUpperSeriesRef.current.setData(upperData);
      bollLowerSeriesRef.current.setData(lowerData);
      bollUpperSeriesRef.current.applyOptions({ visible: true });
      bollLowerSeriesRef.current.applyOptions({ visible: true });
    } else {
      bollUpperSeriesRef.current.applyOptions({ visible: false });
      bollLowerSeriesRef.current.applyOptions({ visible: false });
    }
  }, [showBollinger, data]);

  // Efecto Niveles de Fibonacci
  useEffect(() => {
    fibLinesRef.current.forEach(line => candlestickSeriesRef.current?.removePriceLine(line));
    fibLinesRef.current = [];
    if (!showFibonacci || !candlestickSeriesRef.current) return;
    fibLinesRef.current = renderFibonacciLines(candlestickSeriesRef.current, data);
  }, [showFibonacci, data]);

  // Efecto Puntos Pivot
  useEffect(() => {
    pivotLinesRef.current.forEach(line => candlestickSeriesRef.current?.removePriceLine(line));
    pivotLinesRef.current = [];
    if (!showPivot || !candlestickSeriesRef.current) return;
    pivotLinesRef.current = renderPivotLines(candlestickSeriesRef.current, data);
  }, [showPivot, data]);

  // Escuchar niveles externos (trader simulado o agente cuántico)
  useEffect(() => {
    if (externalTradeLevels && candlestickSeriesRef.current) {
      handlePlotTradeLevels(externalTradeLevels);
    }
  }, [externalTradeLevels, handlePlotTradeLevels]);

  // Marcadores de Patrones
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;
    const uniqueMarkers = buildPatternMarkers(patterns, focusedTime);
    createSeriesMarkers(candlestickSeriesRef.current, uniqueMarkers);
  }, [data, patterns, focusedTime]);

  // Proyecciones TP/SL al enfocar un patrón
  useEffect(() => {
    if (priceLinesRef.current && priceLinesRef.current.length > 0 && candlestickSeriesRef.current) {
      priceLinesRef.current.forEach(line => {
        try {
          candlestickSeriesRef.current.removePriceLine(line);
        } catch {
          // Ignorar desincronización de línea de precio previa
        }
      });
      priceLinesRef.current = [];
    }

    if (!focusedTime || !chartRef.current) return;
    const currentData = dataRef.current;
    if (!currentData || currentData.length === 0) return;

    const targetTime = Math.floor(new Date(focusedTime).getTime() / 1000);
    const targetCandle = currentData.find(d => {
      const t = typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000);
      return t === targetTime;
    });
    
    if (targetCandle && candlestickSeriesRef.current) {
      const entryPrice = parseFloat(targetCandle.close);
      const high = parseFloat(targetCandle.high);
      const low = parseFloat(targetCandle.low);
      
      const matchingPattern = patterns.find(p => p.fecha === focusedTime);
      const isBullish = matchingPattern && matchingPattern.patron && (
        matchingPattern.patron.toLowerCase().includes('bullish') || 
        matchingPattern.patron.toLowerCase().includes('morning') || 
        matchingPattern.patron.toLowerCase().includes('hammer')
      );

      let stopLossPrice;
      let targetPrice;

      if (isBullish) {
        stopLossPrice = low * 0.997;
        const risk = entryPrice - stopLossPrice;
        targetPrice = entryPrice + (risk * 2);
      } else {
        stopLossPrice = high * 1.003;
        const risk = stopLossPrice - entryPrice;
        targetPrice = entryPrice - (risk * 2);
      }

      const entryLine = candlestickSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: '#2563EB',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'ENTRADA',
      });

      const targetLine = candlestickSeriesRef.current.createPriceLine({
        price: targetPrice,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `TP $${targetPrice.toFixed(2)}`,
      });

      const stopLine = candlestickSeriesRef.current.createPriceLine({
        price: stopLossPrice,
        color: '#EF4444',
        lineWidth: 2,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `SL $${stopLossPrice.toFixed(2)}`,
      });

      priceLinesRef.current = [entryLine, targetLine, stopLine];
    }
  }, [focusedTime, patterns]);

  const displayPrice = currentPrice !== null 
    ? currentPrice 
    : (data && data.length > 0 ? parseFloat(data[data.length - 1].close) : 0);

  const isPositiveChange = priceChange24h >= 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '670px', padding: '1.25rem' }}>
      <ChartHeader
        liveSymbol={liveSymbol}
        isLiveStreaming={isLiveStreaming}
        onTimeframeChange={onTimeframeChange}
        liveTimeframe={liveTimeframe}
        showEMA20={showEMA20}
        setShowEMA20={setShowEMA20}
        showBollinger={showBollinger}
        setShowBollinger={setShowBollinger}
        showFibonacci={showFibonacci}
        setShowFibonacci={setShowFibonacci}
        showPivot={showPivot}
        setShowPivot={setShowPivot}
        openRiskModal={() => setRiskModalOpen(true)}
        theme={theme}
        priceFlash={priceFlash}
        displayPrice={displayPrice}
        isPositiveChange={isPositiveChange}
        priceChange24h={priceChange24h}
        handleScrollLeft={handleScrollLeft}
        handleZoomOut={handleZoomOut}
        handleReset={handleReset}
        handleZoomIn={handleZoomIn}
        handleScrollRight={handleScrollRight}
        handleScrollToRecent={handleScrollToRecent}
      />

      {/* Barra HUD: Radar Multitemporal (MTF) & Order Flow (CVD) */}
      <MtfRadarBar 
        mtfState={mtfState}
        orderFlowState={orderFlowState}
        activeTimeframe={liveTimeframe}
        onTimeframeChange={onTimeframeChange}
      />
      
      {/* Contenedores de Gráficos (Velas Principales + Oscilador RSI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <TradeLevelsBanner
          hasActiveTradeLines={hasActiveTradeLines}
          activeTradeInfo={activeTradeInfo}
          onClearTradeLevels={handleClearTradeLevels}
        />

        <div 
          ref={chartContainerRef} 
          style={{ position: 'relative', height: '390px', width: '100%' }} 
        />
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 4px 8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#8B5CF6', letterSpacing: '0.05em' }}>MOMENTUM OSCILLATOR - RSI (14) EN TIEMPO REAL</span>
          </div>
          <div 
            ref={rsiContainerRef} 
            style={{ position: 'relative', height: '110px', width: '100%' }} 
          />
        </div>
      </div>

      {riskModalOpen && (
        <RiskCalculatorModal
          isOpen={riskModalOpen}
          onClose={() => setRiskModalOpen(false)}
          currentPrice={displayPrice}
          liveSymbol={liveSymbol}
          onPlotTradeLevels={handlePlotTradeLevels}
          onClearTradeLevels={handleClearTradeLevels}
          hasActivePlots={hasActiveTradeLines}
        />
      )}
    </div>
  );
}
