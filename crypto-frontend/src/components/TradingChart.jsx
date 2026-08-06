import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, ChevronsRight, Radio, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
  onTimeframeChange = null
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
  const [priceFlash, setPriceFlash] = useState(null); // 'bullish' | 'bearish' | null
  const prevPriceRef = useRef(currentPrice);

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

  // Inicializar el gráfico y las series una sola vez por activo/dataset
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 400,
      layout: {
        background: { type: 'solid', color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(148, 163, 184, 0.3)',
          style: 3,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          color: 'rgba(148, 163, 184, 0.3)',
          style: 3,
          labelBackgroundColor: '#1E293B',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        autoScale: true,
      },
      watermark: {
        visible: true,
        fontSize: 40,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.03)',
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

    // Serie de velas japonesas
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

    // Serie de SMA 20
    const sma20Series = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'SMA 20',
    });
    sma20SeriesRef.current = sma20Series;

    // Serie de SMA 50
    const sma50Series = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 2,
      title: 'SMA 50',
    });
    sma50SeriesRef.current = sma50Series;

    // Gráfico de RSI
    const rsiChart = createChart(rsiContainerRef.current, {
      width: rsiContainerRef.current.clientWidth,
      height: 110,
      layout: {
        background: { type: 'solid', color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.015)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        visible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
    });
    rsiChartRef.current = rsiChart;

    const rsiSeries = rsiChart.addSeries(LineSeries, {
      color: '#8B5CF6',
      lineWidth: 1.5,
      title: 'RSI (14)',
    });
    rsiSeriesRef.current = rsiSeries;

    // Líneas de sobrecompra (70) y sobreventa (30)
    rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239, 68, 68, 0.5)',
      lineWidth: 1,
      lineStyle: 3,
      axisLabelVisible: true,
      title: '70 SOBRECOMPRA',
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(16, 185, 129, 0.5)',
      lineWidth: 1,
      lineStyle: 3,
      axisLabelVisible: true,
      title: '30 SOBREVENTA',
    });

    // Sincronizar escalas de tiempo
    let isSyncing = false;
    const timeScalePrincipal = chart.timeScale();
    const timeScaleRsi = rsiChart.timeScale();

    timeScalePrincipal.subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing) return;
      isSyncing = true;
      timeScaleRsi.setVisibleLogicalRange(range);
      isSyncing = false;
    });

    timeScaleRsi.subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncing) return;
      isSyncing = true;
      timeScalePrincipal.setVisibleLogicalRange(range);
      isSyncing = false;
    });

    isFirstRenderRef.current = true;

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      rsiChart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    };
  }, [selectedDataset?.id, liveSymbol]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Actualización masiva de datos iniciales
  useEffect(() => {
    if (!data || !candlestickSeriesRef.current) return;

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

    if (uniqueFormattedData.length > 0) {
      candlestickSeriesRef.current.setData(uniqueFormattedData);
    }

    // Sincronizar SMA 20
    if (sma20SeriesRef.current) {
      const rawSmaData = data.filter(d => d.sma_20 !== null && d.sma_20 !== undefined).map(d => ({
        time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
        value: parseFloat(d.sma_20)
      })).sort((a, b) => a.time - b.time);

      const uniqueSmaData = [];
      const seenSmaTimes = new Set();
      for (const item of rawSmaData) {
        if (!seenSmaTimes.has(item.time)) {
          seenSmaTimes.add(item.time);
          uniqueSmaData.push(item);
        }
      }
      sma20SeriesRef.current.setData(uniqueSmaData);
    }

    // Sincronizar SMA 50
    if (sma50SeriesRef.current) {
      const rawSma50Data = data.filter(d => d.sma_50 !== null && d.sma_50 !== undefined).map(d => ({
        time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.fecha).getTime() / 1000),
        value: parseFloat(d.sma_50)
      })).sort((a, b) => a.time - b.time);

      const uniqueSma50Data = [];
      const seenSma50Times = new Set();
      for (const item of rawSma50Data) {
        if (!seenSma50Times.has(item.time)) {
          seenSma50Times.add(item.time);
          uniqueSma50Data.push(item);
        }
      }
      sma50SeriesRef.current.setData(uniqueSma50Data);
    }

    // Sincronizar RSI 14
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

  // Actualización fluida en tiempo real (Tick a Tick vía WebSocket)
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
    } catch (e) {
      console.warn('Error aplicando liveTick:', e);
    }
  }, [liveTick]);

  // Actualizar marcadores de patrones
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    if (!patterns || patterns.length === 0) {
      createSeriesMarkers(candlestickSeriesRef.current, []);
      return;
    }

    const markers = patterns.map(p => {
      const isBullish = p.patron && (
        p.patron.toLowerCase().includes('bullish') || 
        p.patron.toLowerCase().includes('morning') || 
        p.patron.toLowerCase().includes('hammer')
      );
      
      const isFocused = focusedTime === p.fecha;
      const markerTime = typeof p.time === 'number' ? p.time : Math.floor(new Date(p.fecha).getTime() / 1000);
      
      return {
        time: markerTime,
        position: isBullish ? 'belowBar' : 'aboveBar',
        color: isBullish 
          ? (isFocused ? '#10B981' : 'rgba(16, 185, 129, 0.6)')
          : (isFocused ? '#EF4444' : 'rgba(239, 68, 68, 0.6)'),
        shape: isBullish ? 'arrowUp' : 'arrowDown',
        text: isFocused ? p.patron : '',
        size: isFocused ? 2 : 1,
      };
    });

    markers.sort((a, b) => a.time - b.time);

    const uniqueMarkers = [];
    const seenTimes = new Set();
    for (const marker of markers) {
      if (!seenTimes.has(marker.time)) {
        seenTimes.add(marker.time);
        uniqueMarkers.push(marker);
      } else if (marker.text !== '') {
        const idx = uniqueMarkers.findIndex(m => m.time === marker.time);
        if (idx !== -1) {
          uniqueMarkers[idx] = marker;
        }
      }
    }

    createSeriesMarkers(candlestickSeriesRef.current, uniqueMarkers);
  }, [data, patterns, focusedTime]);

  // Proyecciones TP/SL al enfocar un patrón
  useEffect(() => {
    if (priceLinesRef.current && priceLinesRef.current.length > 0 && candlestickSeriesRef.current) {
      priceLinesRef.current.forEach(line => {
        try {
          candlestickSeriesRef.current.removePriceLine(line);
        } catch (err) {
          console.warn('Error al remover línea de precio:', err);
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

      let stopLossPrice = 0;
      let targetPrice = 0;

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
      
      {/* Header del Gráfico en Tiempo Real */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Ticker y Precio en Vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#F8FAFC' }}>
                {liveSymbol}
              </h2>
              {isLiveStreaming && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10B981', letterSpacing: '0.05em' }}>EN VIVO 1s</span>
                </div>
              )}
            </div>
            
            {/* Selector de temporalidades rápidas */}
            {onTimeframeChange && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {['1m', '5m', '15m', '1h', '1d'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => onTimeframeChange(tf)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: liveTimeframe === tf ? 'var(--neon-blue)' : 'rgba(255, 255, 255, 0.05)',
                      color: liveTimeframe === tf ? '#FFFFFF' : '#94A3B8',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Badge de Precio en Tiempo Real con Flash Reactivo */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '0.6rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              backgroundColor: priceFlash === 'bullish' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : priceFlash === 'bearish' 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${
                priceFlash === 'bullish' 
                  ? 'rgba(16, 185, 129, 0.5)' 
                  : priceFlash === 'bearish' 
                    ? 'rgba(239, 68, 68, 0.5)' 
                    : 'rgba(255, 255, 255, 0.08)'
              }`,
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            <span style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'monospace', color: priceFlash === 'bullish' ? '#10B981' : priceFlash === 'bearish' ? '#EF4444' : '#F8FAFC' }}>
              ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', color: isPositiveChange ? '#10B981' : '#EF4444' }}>
              {isPositiveChange ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {isPositiveChange ? '+' : ''}{priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* Barra de Controles de Zoom y Desplazamiento */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            onClick={handleScrollLeft} 
            title="Desplazarse al Pasado"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={handleZoomOut} 
            title="Alejar (Zoom Out)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ZoomOut size={18} />
          </button>
 
          <button 
            onClick={handleReset} 
            title="Ajustar Todo (Fit Content)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Maximize2 size={18} />
          </button>
 
          <button 
            onClick={handleZoomIn} 
            title="Acercar (Zoom In)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ZoomIn size={18} />
          </button>
 
          <button 
            onClick={handleScrollRight} 
            title="Desplazarse al Futuro"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} />
          </button>
 
          <button 
            onClick={handleScrollToRecent} 
            title="Ir a la Vela Actual (En Vivo)"
            style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Contenedores de Gráficos (Velas Principales + Oscilador RSI) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
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
    </div>
  );
}
