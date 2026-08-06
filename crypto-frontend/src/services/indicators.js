/**
 * Cálculo de indicadores técnicos y detección de patrones de velas japonesas en JavaScript
 * Idéntico a la implementación cuantitativa del backend en Python.
 */

export function calculateRSI(closes, period = 14) {
  if (!closes || closes.length <= period) return new Array(closes.length).fill(null);

  const rsi = new Array(closes.length).fill(null);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));
  }

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateSMA(closes, period) {
  if (!closes || closes.length < period) return new Array(closes.length).fill(null);
  const sma = new Array(closes.length).fill(null);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  sma[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period];
    sma[i] = sum / period;
  }

  return sma;
}

export function calculateEMA(closes, period) {
  if (!closes || closes.length < period) return new Array(closes.length).fill(null);
  const ema = new Array(closes.length).fill(null);
  const k = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  ema[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
  }

  return ema;
}

export function detectCandlestickPatterns(candles) {
  if (!candles || candles.length < 3) return [];
  const patterns = [];

  for (let i = 2; i < candles.length; i++) {
    const c3 = candles[i];
    const c2 = candles[i - 1];
    const c1 = candles[i - 2];

    const open = parseFloat(c3.open);
    const high = parseFloat(c3.high);
    const low = parseFloat(c3.low);
    const close = parseFloat(c3.close);
    const body = Math.abs(close - open);
    const totalRange = high - low || 0.00001;
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;

    // 1. Doji
    if (body / totalRange <= 0.1) {
      patterns.push({
        patron: 'Doji Neutral',
        tipo_patron_display: 'Doji (Indecisión)',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.75
      });
    }

    // 2. Hammer (Martillo)
    if (lowerShadow >= 2 * body && upperShadow <= 0.2 * body && close >= open) {
      patterns.push({
        patron: 'Hammer Bullish',
        tipo_patron_display: 'Martillo Alcista (Hammer)',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.82
      });
    }

    // 3. Shooting Star (Estrella Fugaz)
    if (upperShadow >= 2 * body && lowerShadow <= 0.2 * body && close <= open) {
      patterns.push({
        patron: 'Shooting Star Bearish',
        tipo_patron_display: 'Estrella Fugaz Bajista',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.80
      });
    }

    // 4. Bullish Engulfing (Envolvente Alcista)
    const prevOpen = parseFloat(c2.open);
    const prevClose = parseFloat(c2.close);
    if (prevClose < prevOpen && close > open && open <= prevClose && close >= prevOpen) {
      patterns.push({
        patron: 'Bullish Engulfing',
        tipo_patron_display: 'Envolvente Alcista',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.88
      });
    }

    // 5. Bearish Engulfing (Envolvente Bajista)
    if (prevClose > prevOpen && close < open && open >= prevClose && close <= prevOpen) {
      patterns.push({
        patron: 'Bearish Engulfing',
        tipo_patron_display: 'Envolvente Bajista',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.88
      });
    }

    // 6. Morning Star (Estrella de la Mañana - 3 velas)
    const c1Close = parseFloat(c1.close);
    const c1Open = parseFloat(c1.open);
    if (c1Close < c1Open && Math.abs(prevClose - prevOpen) < (c1Open - c1Close) * 0.5 && close > open && close > (c1Open + c1Close) / 2) {
      patterns.push({
        patron: 'Morning Star Bullish',
        tipo_patron_display: 'Estrella de la Mañana (Morning Star)',
        fecha: c3.fecha || new Date(c3.time * 1000).toISOString(),
        close: close,
        confianza: 0.90
      });
    }
  }

  return patterns;
}
