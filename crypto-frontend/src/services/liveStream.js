/**
 * Real-Time Streaming Engine for Crypto Pattern Analyzer
 * Conecta directamente a Binance WebSocket / REST para mover las velas y el precio en tiempo real.
 */
import { calculateRSI, calculateSMA, detectCandlestickPatterns } from './indicators';

function parseSymbol(rawSymbol) {
  if (!rawSymbol) return 'BTCUSDT';
  let cleaned = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!cleaned.endsWith('USDT') && !cleaned.endsWith('USD') && !cleaned.endsWith('BUSD')) {
    cleaned += 'USDT';
  }
  return cleaned;
}

function mapTimeframe(tf) {
  const map = {
    '1m': '1m',
    '3m': '3m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '2h': '2h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w'
  };
  return map[tf] || '1m';
}

export class CryptoLiveStream {
  constructor(symbol = 'BTC/USDT', timeframe = '1m', onUpdate = null) {
    this.symbol = symbol;
    this.binanceSymbol = parseSymbol(symbol);
    this.timeframe = mapTimeframe(timeframe);
    this.onUpdate = onUpdate;
    this.ws = null;
    this.pollInterval = null;
    this.candles = [];
    this.isConnected = false;
    this.lastPrice = null;
    this.priceChange24h = 0;
  }

  async initHistory(limit = 150) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${this.binanceSymbol}&interval=${this.timeframe}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Binance API error: ${res.statusText}`);
      const data = await res.json();

      this.candles = data.map(item => ({
        time: Math.floor(item[0] / 1000),
        fecha: new Date(item[0]).toISOString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5])
      }));

      this.enrichData();
      return this.getState();
    } catch (err) {
      console.warn('Fallback al cargar historial directo de Binance:', err);
      return null;
    }
  }

  enrichData() {
    if (!this.candles || this.candles.length === 0) return;
    const closes = this.candles.map(c => c.close);
    const rsis = calculateRSI(closes, 14);
    const sma20s = calculateSMA(closes, 20);
    const sma50s = calculateSMA(closes, 50);

    for (let i = 0; i < this.candles.length; i++) {
      this.candles[i].rsi_14 = rsis[i];
      this.candles[i].sma_20 = sma20s[i];
      this.candles[i].sma_50 = sma50s[i];
    }
  }

  getState() {
    this.enrichData();
    const patterns = detectCandlestickPatterns(this.candles);
    const lastCandle = this.candles[this.candles.length - 1];
    const prevCandle = this.candles[this.candles.length - 2];
    
    let change24h = 0;
    if (this.candles.length > 1) {
      const firstClose = this.candles[0].close;
      const currentClose = lastCandle ? lastCandle.close : 0;
      change24h = firstClose ? ((currentClose - firstClose) / firstClose) * 100 : 0;
    }

    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      candles: [...this.candles],
      patterns,
      lastCandle,
      currentPrice: lastCandle ? lastCandle.close : 0,
      priceChange24h: change24h,
      isConnected: this.isConnected
    };
  }

  connect() {
    this.disconnect();
    const streamName = `${this.binanceSymbol.toLowerCase()}@kline_${this.timeframe}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.onUpdate) this.onUpdate(this.getState(), 'connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message && message.k) {
            this.handleKlineMessage(message.k);
          }
        } catch (e) {
          console.error('Error parseando mensaje WS:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error, activando polling fallback:', err);
        this.isConnected = false;
        this.startPollingFallback();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.onUpdate) this.onUpdate(this.getState(), 'disconnected');
      };
    } catch (e) {
      console.warn('Error inicializando WebSocket, usando polling:', e);
      this.startPollingFallback();
    }
  }

  handleKlineMessage(k) {
    const candleTime = Math.floor(k.t / 1000);
    const open = parseFloat(k.o);
    const high = parseFloat(k.h);
    const low = parseFloat(k.l);
    const close = parseFloat(k.c);
    const volume = parseFloat(k.v);
    const isFinal = k.x;

    const newCandle = {
      time: candleTime,
      fecha: new Date(k.t).toISOString(),
      open,
      high,
      low,
      close,
      volume
    };

    if (this.candles.length === 0) {
      this.candles.push(newCandle);
    } else {
      const lastIndex = this.candles.length - 1;
      const lastCandle = this.candles[lastIndex];

      if (lastCandle.time === candleTime) {
        // Actualizar la vela actual en tiempo real
        this.candles[lastIndex] = {
          ...lastCandle,
          high: Math.max(lastCandle.high, high),
          low: Math.min(lastCandle.low, low),
          close: close,
          volume: volume
        };
      } else if (candleTime > lastCandle.time) {
        // Nueva vela completada
        this.candles.push(newCandle);
        if (this.candles.length > 300) {
          this.candles.shift();
        }
      }
    }

    this.enrichData();
    const state = this.getState();
    if (this.onUpdate) {
      this.onUpdate(state, 'tick', newCandle);
    }
  }

  startPollingFallback() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${this.binanceSymbol}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const price = parseFloat(data.price);

        if (this.candles.length > 0) {
          const lastIndex = this.candles.length - 1;
          const lastCandle = this.candles[lastIndex];
          this.candles[lastIndex] = {
            ...lastCandle,
            high: Math.max(lastCandle.high, price),
            low: Math.min(lastCandle.low, price),
            close: price
          };
          this.enrichData();
          if (this.onUpdate) this.onUpdate(this.getState(), 'tick', this.candles[lastIndex]);
        }
      } catch (e) {
        // Silencio en errores de red periódicos
      }
    }, 2000);
  }

  disconnect() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
  }
}
