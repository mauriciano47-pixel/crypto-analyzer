import { calculateFibonacciLevels, calculatePivotPoints } from '../../services/indicators';

/**
 * Genera marcadores visuales para Lightweight Charts a partir de los patrones detectados.
 */
export function buildPatternMarkers(patterns, focusedTime) {
  if (!patterns || patterns.length === 0) return [];

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

  return uniqueMarkers;
}

/**
 * Traza líneas de retroceso de Fibonacci sobre la serie de velas.
 */
export function renderFibonacciLines(candlestickSeries, data) {
  if (!candlestickSeries || !data || data.length === 0) return [];

  const highs = data.map(d => parseFloat(d.high));
  const lows = data.map(d => parseFloat(d.low));
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const levels = calculateFibonacciLevels(high, low);

  const lines = [];
  levels.forEach(lvl => {
    const line = candlestickSeries.createPriceLine({
      price: lvl.price,
      color: lvl.color,
      lineWidth: 1,
      title: lvl.label,
    });
    lines.push(line);
  });
  return lines;
}

/**
 * Traza puntos de pivote clásicos sobre la serie de velas.
 */
export function renderPivotLines(candlestickSeries, data) {
  if (!candlestickSeries || !data || data.length === 0) return [];

  const highs = data.map(d => parseFloat(d.high));
  const lows = data.map(d => parseFloat(d.low));
  const closes = data.map(d => parseFloat(d.close));
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const close = closes[closes.length - 1];
  const { pivot, r1, s1, r2, s2 } = calculatePivotPoints(high, low, close);

  const points = [
    { price: pivot, label: 'P', color: '#FFC107' },
    { price: r1, label: 'R1', color: '#10B981' },
    { price: s1, label: 'S1', color: '#EF4444' },
    { price: r2, label: 'R2', color: '#10B981' },
    { price: s2, label: 'S2', color: '#EF4444' },
  ];

  const lines = [];
  points.forEach(p => {
    const line = candlestickSeries.createPriceLine({
      price: p.price,
      color: p.color,
      lineWidth: 1,
      title: p.label,
    });
    lines.push(line);
  });
  return lines;
}
