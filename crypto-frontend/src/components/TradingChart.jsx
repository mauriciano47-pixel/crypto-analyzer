import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, ChevronsRight } from 'lucide-react';

export default function TradingChart({ data, patterns, focusedTime, selectedDataset }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const sma20SeriesRef = useRef();
  const sma50SeriesRef = useRef();
  const rsiContainerRef = useRef();
  const rsiChartRef = useRef();
  const rsiSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const priceLinesRef = useRef([]);
  const isFirstRenderRef = useRef(true);
  const dataRef = useRef(data);

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
      height: container.clientHeight || 480,
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
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      watermark: {
        visible: true,
        fontSize: 44,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.03)',
        text: selectedDataset ? `${selectedDataset.asset_symbol} (${selectedDataset.timeframe})` : 'Cargando...',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 380
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

    // Crear serie de velas
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

    // Crear serie de SMA 20
    const sma20Series = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'SMA 20',
    });
    sma20SeriesRef.current = sma20Series;

    // Crear serie de SMA 50
    const sma50Series = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 2,
      title: 'SMA 50',
    });
    sma50SeriesRef.current = sma50Series;

    // Crear gráfico de RSI
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
        visible: false, // Ocultar escala del RSI ya que está alineado temporalmente
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

    // Líneas horizontales de sobrecompra (70) y sobreventa (30) en el RSI
    rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239, 68, 68, 0.4)',
      lineWidth: 1,
      lineStyle: 3,
      axisLabelVisible: true,
      title: 'SOBRECOMPRA',
    });
    rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(16, 185, 129, 0.4)',
      lineWidth: 1,
      lineStyle: 3,
      axisLabelVisible: true,
      title: 'SOBREVENTA',
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

    // Marcar que es el primer render para ajustar la escala visual al cargar los primeros datos
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
  }, [selectedDataset?.id]);

  // Sincronizar data en la referencia mutable para su uso en callbacks de eventos sin disparar hooks
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Actualizar datos de las series (velas y SMA) de forma reactiva sin destruir el gráfico
  useEffect(() => {
    if (!data || !candlestickSeriesRef.current) return;

    // Convertir y ordenar fechas como timestamps UNIX
    const formattedData = data.map(d => ({
      time: Math.floor(new Date(d.fecha).getTime() / 1000), 
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    })).sort((a, b) => a.time - b.time);

    // Filtrar duplicados de fecha
    const uniqueFormattedData = [];
    const seenTimes = new Set();
    for (const item of formattedData) {
      if (!seenTimes.has(item.time)) {
        seenTimes.add(item.time);
        uniqueFormattedData.push(item);
      }
    }

    candlestickSeriesRef.current.setData(uniqueFormattedData);

    // Sincronizar SMA 20
    if (sma20SeriesRef.current) {
      const rawSmaData = data.filter(d => d.sma_20).map(d => ({
        time: Math.floor(new Date(d.fecha).getTime() / 1000),
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
      const rawSma50Data = data.filter(d => d.sma_50).map(d => ({
        time: Math.floor(new Date(d.fecha).getTime() / 1000),
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
        time: Math.floor(new Date(d.fecha).getTime() / 1000),
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

    // Centrar todo el contenido únicamente en la primera carga del dataset
    if (isFirstRenderRef.current && chartRef.current && uniqueFormattedData.length > 0) {
      chartRef.current.timeScale().fitContent();
      isFirstRenderRef.current = false;
    }
  }, [data]);

  // Actualizar dinámicamente los marcadores de patrones
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
      const markerTime = Math.floor(new Date(p.fecha).getTime() / 1000);
      
      return {
        time: markerTime,
        position: isBullish ? 'belowBar' : 'aboveBar',
        color: isBullish 
          ? (isFocused ? '#10B981' : 'rgba(16, 185, 129, 0.4)')
          : (isFocused ? '#EF4444' : 'rgba(239, 68, 68, 0.4)'),
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

  // Desplazar el gráfico al patrón enfocado y dibujar proyecciones de inversión (TP, SL, Entrada)
  useEffect(() => {
    // 1. Limpiar líneas de precio anteriores si existen
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
    
    // Buscar la vela seleccionada para obtener precios
    const targetCandle = currentData.find(d => Math.floor(new Date(d.fecha).getTime() / 1000) === targetTime);
    
    if (targetCandle && candlestickSeriesRef.current) {
      const entryPrice = parseFloat(targetCandle.close);
      const high = parseFloat(targetCandle.high);
      const low = parseFloat(targetCandle.low);
      
      // Identificar si el patrón es alcista (bullish) o bajista (bearish)
      const matchingPattern = patterns.find(p => p.fecha === focusedTime);
      const isBullish = matchingPattern && matchingPattern.patron && (
        matchingPattern.patron.toLowerCase().includes('bullish') || 
        matchingPattern.patron.toLowerCase().includes('morning') || 
        matchingPattern.patron.toLowerCase().includes('hammer')
      );

      let stopLossPrice = 0;
      let targetPrice = 0;

      if (isBullish) {
        // Alcista: Stop loss por debajo del mínimo de la vela (0.3% holgura), TP a ratio 1:2
        stopLossPrice = low * 0.997;
        const risk = entryPrice - stopLossPrice;
        targetPrice = entryPrice + (risk * 2);
      } else {
        // Bajista: Stop loss por encima del máximo de la vela (0.3% holgura), TP a ratio 1:2
        stopLossPrice = high * 1.003;
        const risk = stopLossPrice - entryPrice;
        targetPrice = entryPrice - (risk * 2);
      }

      // Dibujar las líneas en el gráfico principal
      const entryLine = candlestickSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: '#2563EB', // Azul
        lineWidth: 2,
        lineStyle: 2, // Punteada
        axisLabelVisible: true,
        title: 'ENTRADA',
      });

      const targetLine = candlestickSeriesRef.current.createPriceLine({
        price: targetPrice,
        color: '#10B981', // Verde
        lineWidth: 2,
        lineStyle: 1, // Discontinua
        axisLabelVisible: true,
        title: `TP (TARGET) $${targetPrice.toFixed(2)}`,
      });

      const stopLine = candlestickSeriesRef.current.createPriceLine({
        price: stopLossPrice,
        color: '#EF4444', // Rojo
        lineWidth: 2,
        lineStyle: 1, // Discontinua
        axisLabelVisible: true,
        title: `SL (STOP LOSS) $${stopLossPrice.toFixed(2)}`,
      });

      priceLinesRef.current = [entryLine, targetLine, stopLine];
    }
    
    // Calcular margen temporal dinámico
    let timeDelta = 15 * 24 * 60 * 60;
    if (currentData.length > 1) {
      const firstTime = new Date(currentData[0].fecha).getTime();
      const lastTime = new Date(currentData[currentData.length - 1].fecha).getTime();
      const avgIntervalSeconds = Math.floor((lastTime - firstTime) / (currentData.length - 1) / 1000);
      if (avgIntervalSeconds > 0) {
        timeDelta = avgIntervalSeconds * 15;
      }
    }

    try {
      chartRef.current.timeScale().setVisibleRange({
        from: targetTime - timeDelta,
        to: targetTime + timeDelta,
      });
    } catch (err) {
      console.warn('Error setting visible range:', err);
    }
  }, [focusedTime, patterns]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Gráfico de Precio</h3>
        
        {/* Barra de controles de navegación */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            onClick={handleScrollLeft} 
            title="Desplazarse a la Izquierda (Pasado)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={handleZoomOut} 
            title="Alejar (Zoom Out)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ZoomOut size={18} />
          </button>
 
          <button 
            onClick={handleReset} 
            title="Ajustar Contenido Completo"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <Maximize2 size={18} />
          </button>
 
          <button 
            onClick={handleZoomIn} 
            title="Acercar (Zoom In)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ZoomIn size={18} />
          </button>
 
          <button 
            onClick={handleScrollRight} 
            title="Desplazarse a la Derecha (Futuro)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ChevronRight size={18} />
          </button>
 
          <button 
            onClick={handleScrollToRecent} 
            title="Ir al Final (Más Reciente)"
            style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#F8FAFC'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Contenedores de Gráficos Integrados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div 
          ref={chartContainerRef} 
          style={{ position: 'relative', height: '380px', width: '100%' }} 
        />
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 4px 8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#8B5CF6', letterSpacing: '0.05em' }}>MOMENTUM OSCILLATOR - RSI (14)</span>
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
