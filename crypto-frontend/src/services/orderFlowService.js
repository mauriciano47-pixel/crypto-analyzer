/**
 * Motor de Order Flow & Delta de Volumen Acumulado (CVD - Cumulative Volume Delta)
 * Conecta al WebSocket de Binance (@aggTrade) para procesar transacciones individuales en vivo:
 * 1. Clasifica cada trade como Taker Buy (+vol) o Taker Sell (-vol)
 * 2. Calcula el Delta neto por vela y el CVD acumulado
 * 3. Identifica divergencias de absorción institucional (Bullish/Bearish Absorption)
 * 4. Provee Time & Sales resumido y ratio de agresión de mercado
 */

function cleanSymbol(rawSymbol) {
  if (!rawSymbol) return 'BTCUSDT';
  let s = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!s.endsWith('USDT') && !s.endsWith('USD') && !s.endsWith('BUSD')) {
    s += 'USDT';
  }
  return s;
}

class OrderFlowService {
  constructor() {
    this.currentSymbol = 'BTC/USDT';
    this.binanceSymbol = 'BTCUSDT';
    this.ws = null;
    this.pollInterval = null;
    this.listeners = new Set();

    // Estado reactivo de Order Flow
    this.state = {
      symbol: 'BTC/USDT',
      currentDelta: 0,
      cumulativeDelta: 0,
      buyVolume: 0,
      sellVolume: 0,
      totalVolume: 0,
      takerBuyRatio: 50, // % de compras agresivas a mercado
      takerSellRatio: 50,
      absorptionStatus: 'NEUTRAL', // 'BULLISH_ABSORPTION' | 'BEARISH_ABSORPTION' | 'NEUTRAL'
      absorptionReason: 'Flujo de agresividad equilibrado',
      recentTrades: [], // [{ id, price, qty, isBuy, time }]
      cvdHistory: [], // [{ time, cvd, delta, close }]
      deltaIntensity: 'Normal', // 'Extrema Compradora' | 'Moderada Compradora' | 'Equilibrada' | 'Moderada Vendedora' | 'Extrema Vendedora'
      lastPrice: 0,
      isConnected: false
    };

    this.simulatedTradesCount = 0;
  }

  /**
   * Suscribe un listener a las actualizaciones en tiempo real
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const s = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(s);
      } catch (err) {
        console.warn('[OrderFlowService] Error en listener:', err);
      }
    });
  }

  getState() {
    return { ...this.state };
  }

  /**
   * Inicia el stream de WebSocket para el activo dado
   */
  startStream(symbol) {
    if (this.currentSymbol === symbol && this.ws && this.state.isConnected) {
      return;
    }

    this.disconnect();
    this.currentSymbol = symbol;
    this.binanceSymbol = cleanSymbol(symbol);
    this.state.symbol = symbol;
    this.state.currentDelta = 0;
    this.state.buyVolume = 0;
    this.state.sellVolume = 0;
    this.state.totalVolume = 0;
    this.state.recentTrades = [];

    const streamName = `${this.binanceSymbol.toLowerCase()}@aggTrade`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.state.isConnected = true;
        this.stopFallback();
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.e === 'aggTrade') {
            this.processAggTrade(data);
          }
        } catch (e) {
          console.warn('[OrderFlowService] Error parseando aggTrade:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[OrderFlowService] WebSocket aggTrade error, activando simulación fallback:', err);
        this.state.isConnected = false;
        this.startFallback();
      };

      this.ws.onclose = () => {
        this.state.isConnected = false;
        this.notify();
        this.startFallback();
      };
    } catch (e) {
      console.warn('[OrderFlowService] Error conectando a WS, usando fallback:', e);
      this.startFallback();
    }
  }

  /**
   * Procesa cada trade individual de Binance
   * @param {Object} trade - Mensaje aggTrade { p: price, q: quantity, m: isBuyerMaker, T: tradeTime, a: aggTradeId }
   */
  processAggTrade(trade) {
    const price = parseFloat(trade.p);
    const qty = parseFloat(trade.q);
    // En Binance aggTrade: m = true significa que el comprador fue el maker (orden pasiva límite),
    // por lo tanto el agresor que ejecutó la orden a mercado fue el VENDEDOR (Taker Sell).
    // Si m = false, el agresor fue el COMPRADOR (Taker Buy).
    const isTakerBuy = !trade.m;
    const deltaImpact = isTakerBuy ? qty : -qty;

    this.state.lastPrice = price;
    this.state.currentDelta += deltaImpact;
    this.state.cumulativeDelta += deltaImpact;

    if (isTakerBuy) {
      this.state.buyVolume += qty;
    } else {
      this.state.sellVolume += qty;
    }

    this.state.totalVolume = this.state.buyVolume + this.state.sellVolume;

    // Calcular ratios de agresividad
    if (this.state.totalVolume > 0) {
      this.state.takerBuyRatio = Number(((this.state.buyVolume / this.state.totalVolume) * 100).toFixed(1));
      this.state.takerSellRatio = Number((100 - this.state.takerBuyRatio).toFixed(1));
    }

    // Intensidad del Delta
    if (this.state.takerBuyRatio >= 68) {
      this.state.deltaIntensity = 'Extrema Compradora 🟢';
    } else if (this.state.takerBuyRatio >= 55) {
      this.state.deltaIntensity = 'Moderada Compradora 🟢';
    } else if (this.state.takerBuyRatio <= 32) {
      this.state.deltaIntensity = 'Extrema Vendedora 🔴';
    } else if (this.state.takerBuyRatio <= 45) {
      this.state.deltaIntensity = 'Moderada Vendedora 🔴';
    } else {
      this.state.deltaIntensity = 'Equilibrada 🟡';
    }

    // Registro en cinta de trades recientes (máx 15)
    const newTradeItem = {
      id: trade.a || Date.now(),
      price,
      qty: Number(qty.toFixed(4)),
      isBuy: isTakerBuy,
      time: trade.T || Date.now()
    };
    this.state.recentTrades = [newTradeItem, ...this.state.recentTrades.slice(0, 14)];

    // Detección de Absorción Institucional
    this.evaluateAbsorption(price);

    this.notify();
  }

  /**
   * Evalúa absorciones y divergencias entre precio y agresión de mercado
   */
  evaluateAbsorption() {
    if (this.state.recentTrades.length < 8) return;

    const oldTrades = this.state.recentTrades.slice(6, 12);
    const recentTrades = this.state.recentTrades.slice(0, 6);

    const oldAvgPrice = oldTrades.reduce((acc, t) => acc + t.price, 0) / (oldTrades.length || 1);
    const recentAvgPrice = recentTrades.reduce((acc, t) => acc + t.price, 0) / (recentTrades.length || 1);

    const isPriceFalling = recentAvgPrice < oldAvgPrice * 0.9995;
    const isPriceRising = recentAvgPrice > oldAvgPrice * 1.0005;

    // Absorción Compradora: El precio cae pero el ratio de compra o delta es fuertemente positivo
    if (isPriceFalling && this.state.takerBuyRatio >= 60) {
      this.state.absorptionStatus = 'BULLISH_ABSORPTION';
      this.state.absorptionReason = 'Absorción Compradora Institucional: Muro pasivo absorbiendo ventas a mercado';
    } 
    // Absorción Vendedora: El precio sube pero el ratio de venta o delta es fuertemente negativo
    else if (isPriceRising && this.state.takerSellRatio >= 60) {
      this.state.absorptionStatus = 'BEARISH_ABSORPTION';
      this.state.absorptionReason = 'Absorción Vendedora Institucional: Muro pasivo distribuyendo ante compras a mercado';
    } else {
      this.state.absorptionStatus = 'NEUTRAL';
      this.state.absorptionReason = 'Flujo de agresividad acorde a la acción de precio';
    }
  }

  /**
   * Sincroniza las velas de la gráfica para construir el historial de CVD vela a vela
   */
  syncWithCandles(candles) {
    if (!candles || candles.length === 0) return;

    let cumulative = 0;
    const cvdSeries = candles.map(c => {
      const open = parseFloat(c.open);
      const close = parseFloat(c.close);
      const vol = parseFloat(c.volume || 10);
      // Estimación cuantitativa de Delta intrabarra si no hay tick histórico
      const isBull = close >= open;
      const barDelta = isBull ? vol * 0.22 : -vol * 0.22;
      cumulative += barDelta;

      return {
        time: c.time || Math.floor(new Date(c.fecha).getTime() / 1000),
        delta: Number(barDelta.toFixed(2)),
        cvd: Number(cumulative.toFixed(2)),
        close
      };
    });

    this.state.cvdHistory = cvdSeries;
    this.state.cumulativeDelta = cumulative;
    this.notify();
  }

  /**
   * Simulación defensiva realista si la red falla o se trabaja con datos locales
   */
  startFallback() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      const basePrice = this.state.lastPrice || 64000;
      const deltaShift = (Math.random() - 0.48) * 4;
      const simTrade = {
        p: (basePrice + deltaShift).toFixed(2),
        q: (Math.random() * 0.5 + 0.05).toFixed(4),
        m: Math.random() > 0.52,
        T: Date.now(),
        a: Date.now() + Math.floor(Math.random() * 1000)
      };
      this.processAggTrade(simTrade);
    }, 1200);
  }

  stopFallback() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  disconnect() {
    this.stopFallback();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignorar
      }
      this.ws = null;
    }
    this.state.isConnected = false;
  }
}

export const orderFlowService = new OrderFlowService();
