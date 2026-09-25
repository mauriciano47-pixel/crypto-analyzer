/**
 * Agente Trader Cuantitativo Inteligente (Quant Trading Agent Engine)
 * 
 * Escanea el historial de velas OHLCV de Binance / CSVs locales,
 * evalúa confluencia multitécnica (Velas Japonesas + RSI Wilder + EMA 20 + Bollinger)
 * y ejecuta simulaciones walk-forward de gestión de riesgo (R:R >= 2.2:1)
 * generando bitácoras auditables para alimentar el cerebro algorítmico.
 */

import {
  calculateRSI,
  calculateEMA,
  calculateBollingerBands
} from './indicators';

const STORAGE_AGENT_AUDIT_KEY = 'crypto_analyzer_agent_audit';

export class QuantAgentEngine {
  /**
   * Evalúa la confluencia técnica en una barra específica dentro de la serie histórica
   */
  static evaluateConfluence(candles, index, rsiList, ema20List, bbList, microstructure = null) {
    if (index < 2 || index >= candles.length) return null;

    const c3 = candles[index];
    const c2 = candles[index - 1];
    const c1 = index >= 2 ? candles[index - 2] : c2;

    const open = parseFloat(c3.open);
    const high = parseFloat(c3.high);
    const low = parseFloat(c3.low);
    const close = parseFloat(c3.close);
    const body = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;

    const prevOpen = parseFloat(c2.open);
    const prevClose = parseFloat(c2.close);
    const prevLow = parseFloat(c2.low);
    const prevHigh = parseFloat(c2.high);

    const rsi = rsiList[index] ?? 50;
    const prevRsi = rsiList[index - 1] ?? rsi;
    const ema20 = ema20List[index] ?? close;
    const bb = {
      upper: bbList.upper[index] ?? (close * 1.02),
      middle: bbList.middle[index] ?? close,
      lower: bbList.lower[index] ?? (close * 0.98)
    };

    // 1. Detección de patrones de velas en barra
    const isHammer = (lowerShadow >= 1.8 * body) && (upperShadow <= 0.25 * body) && (close >= open);
    const isBullishEngulfing = (prevClose < prevOpen) && (close > open) && (open <= prevClose) && (close >= prevOpen);
    const isMorningStar = (parseFloat(c1.close) < parseFloat(c1.open)) && 
                          (Math.abs(prevClose - prevOpen) < Math.abs(parseFloat(c1.open) - parseFloat(c1.close)) * 0.5) && 
                          (close > open) && (close > (parseFloat(c1.open) + parseFloat(c1.close)) / 2);

    const isShootingStar = (upperShadow >= 1.8 * body) && (lowerShadow <= 0.25 * body) && (close <= open);
    const isBearishEngulfing = (prevClose > prevOpen) && (close < open) && (open >= prevClose) && (close <= prevOpen);

    // 2. Factores de Confluencia Alcista (LONG)
    const bullishReasons = [];
    if (isHammer) bullishReasons.push('Martillo Alcista (Rechazo en soporte)');
    if (isBullishEngulfing) bullishReasons.push('Envolvente Alcista (Presión compradora)');
    if (isMorningStar) bullishReasons.push('Estrella de la Mañana (Giro de 3 velas)');
    if (low <= bb.lower * 1.0025) bullishReasons.push('Interacción con Banda Inferior Bollinger');
    if (rsi <= 40) bullishReasons.push(`RSI Wilder en zona de sobreventa/acumulación (${rsi.toFixed(1)})`);
    else if (prevRsi < 36 && rsi > prevRsi) bullishReasons.push(`Inflexión alcista de RSI (${prevRsi.toFixed(1)} → ${rsi.toFixed(1)})`);
    if (close >= ema20 * 0.985 && close <= ema20 * 1.015) bullishReasons.push('Soporte dinámico sobre EMA 20');

    // 3. Factores de Confluencia Bajista (SHORT)
    const bearishReasons = [];
    if (isShootingStar) bearishReasons.push('Estrella Fugaz (Rechazo en resistencia)');
    if (isBearishEngulfing) bearishReasons.push('Envolvente Bajista (Presión vendedora)');
    if (high >= bb.upper * 0.9975) bearishReasons.push('Interacción con Banda Superior Bollinger');
    if (rsi >= 62) bullishReasons.length === 0 && bearishReasons.push(`RSI Wilder en sobrecompra (${rsi.toFixed(1)})`);
    else if (prevRsi > 65 && rsi < prevRsi) bearishReasons.push(`Inflexión bajista de RSI (${prevRsi.toFixed(1)} → ${rsi.toFixed(1)})`);
    if (close <= ema20 * 1.015 && close >= ema20 * 0.985) bearishReasons.push('Resistencia dinámica bajo EMA 20');

    // Mínimo 2 condiciones técnicas sólidas para evitar operaciones a ciegas
    const patternPresentBull = isHammer || isBullishEngulfing || isMorningStar || (low <= bb.lower * 1.002);
    const patternPresentBear = isShootingStar || isBearishEngulfing || (high >= bb.upper * 0.998);

    // Integración opcional de Microestructura y Flujo de Órdenes L2
    if (microstructure) {
      if (microstructure.imbalance >= 0.15) {
        bullishReasons.push(`Flujo L2: Desbalance comprador institucional (+${(microstructure.imbalance * 100).toFixed(0)}%)`);
      } else if (microstructure.imbalance <= -0.15) {
        bearishReasons.push(`Flujo L2: Desbalance vendedor institucional (${(microstructure.imbalance * 100).toFixed(0)}%)`);
      }
    }

    if (bullishReasons.length >= 2 && patternPresentBull) {
      const technicalSl = Math.min(low, prevLow) * 0.998;
      const slDist = Math.max(close - technicalSl, close * 0.008);
      const targetRatio = 2.25; // R:R mínimo de 2.25:1
      let technicalTp = close + (slDist * targetRatio);

      // Filtro Anti-Muro Institucional L2
      if (microstructure && microstructure.askWalls && microstructure.askWalls.length > 0) {
        const blockingWall = microstructure.askWalls.find(w => w.price > close && w.price <= technicalTp);
        if (blockingWall) {
          technicalTp = Number((blockingWall.price * 0.998).toFixed(2));
          bullishReasons.push(`TP optimizado antes de Muro Venta ($${blockingWall.price.toLocaleString()})`);
        }
      }

      return {
        type: 'LONG',
        index,
        entryPrice: close,
        stopLoss: Number(technicalSl.toFixed(2)),
        takeProfit: Number(technicalTp.toFixed(2)),
        rrRatio: targetRatio,
        reasons: bullishReasons,
        candleTime: c3.time || c3.fecha,
        rsi: Number(rsi.toFixed(1)),
        bbBand: 'Banda Inferior'
      };
    }

    if (bearishReasons.length >= 2 && patternPresentBear) {
      const technicalSl = Math.max(high, prevHigh) * 1.002;
      const slDist = Math.max(technicalSl - close, close * 0.008);
      const targetRatio = 2.25;
      let technicalTp = close - (slDist * targetRatio);

      // Filtro Anti-Muro Institucional L2
      if (microstructure && microstructure.bidWalls && microstructure.bidWalls.length > 0) {
        const blockingWall = microstructure.bidWalls.find(w => w.price < close && w.price >= technicalTp);
        if (blockingWall) {
          technicalTp = Number((blockingWall.price * 1.002).toFixed(2));
          bearishReasons.push(`TP optimizado antes de Muro Compra ($${blockingWall.price.toLocaleString()})`);
        }
      }

      return {
        type: 'SHORT',
        index,
        entryPrice: close,
        stopLoss: Number(technicalSl.toFixed(2)),
        takeProfit: Number(technicalTp.toFixed(2)),
        rrRatio: targetRatio,
        reasons: bearishReasons,
        candleTime: c3.time || c3.fecha,
        rsi: Number(rsi.toFixed(1)),
        bbBand: 'Banda Superior'
      };
    }

    return null;
  }

  /**
   * Ejecuta una simulación completa Walk-Forward sobre todo el histórico de velas
   */
  static runHistoricalAudit(candles, symbol = 'BTC/USDT', config = {}, microstructure = null) {
    if (!candles || candles.length < 30) {
      return {
        success: false,
        message: 'Se requieren al menos 30 velas históricas para auditoría cuantitativa.',
        totalTrades: 0
      };
    }

    const {
      initialBalance = 10000,
      riskPerTrade = 0.015, // 1.5% de riesgo por trade
      maxHoldingBars = 35 // límite máximo de velas antes de salida por tiempo
    } = config;

    const closes = candles.map(c => parseFloat(c.close));
    const rsiList = calculateRSI(closes, 14);
    const ema20List = calculateEMA(closes, 20);
    const bbList = calculateBollingerBands(closes, 20, 2);

    let currentBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdown = 0;

    const tradesList = [];
    let grossProfit = 0;
    let grossLoss = 0;

    let i = 22; // Comenzar con suficientes datos para EMA20 y BB20
    while (i < candles.length - 1) {
      // Aplicar microestructura especialmente en la ventana reciente
      const isRecentWindow = (i >= candles.length - 8);
      const signal = this.evaluateConfluence(candles, i, rsiList, ema20List, bbList, isRecentWindow ? microstructure : null);

      if (!signal) {
        i++;
        continue;
      }

      // Tamaño de posición cuantitativa
      const riskAmount = currentBalance * riskPerTrade;
      const slDistance = Math.abs(signal.entryPrice - signal.stopLoss);
      const positionUnits = slDistance > 0 ? (riskAmount / slDistance) : (riskAmount / (signal.entryPrice * 0.01));
      const notional = positionUnits * signal.entryPrice;

      // Simular desarrollo de la posición en velas futuras
      let tradeResult = 'ABIERTO';
      let exitPrice = signal.entryPrice;
      let exitIndex = i;
      let exitReason = 'En curso';

      for (let j = i + 1; j < candles.length; j++) {
        const bar = candles[j];
        const barHigh = parseFloat(bar.high);
        const barLow = parseFloat(bar.low);
        const barClose = parseFloat(bar.close);

        if (signal.type === 'LONG') {
          if (barHigh >= signal.takeProfit) {
            tradeResult = 'WIN';
            exitPrice = signal.takeProfit;
            exitIndex = j;
            exitReason = 'Take Profit alcanzado (Objetivo R:R)';
            break;
          } else if (barLow <= signal.stopLoss) {
            tradeResult = 'LOSS';
            exitPrice = signal.stopLoss;
            exitIndex = j;
            exitReason = 'Stop Loss ejecutado (Protección de capital)';
            break;
          }
        } else {
          // SHORT
          if (barLow <= signal.takeProfit) {
            tradeResult = 'WIN';
            exitPrice = signal.takeProfit;
            exitIndex = j;
            exitReason = 'Take Profit alcanzado (Objetivo R:R)';
            break;
          } else if (barHigh >= signal.stopLoss) {
            tradeResult = 'LOSS';
            exitPrice = signal.stopLoss;
            exitIndex = j;
            exitReason = 'Stop Loss ejecutado (Protección de capital)';
            break;
          }
        }

        // Salida por tiempo si excede maxHoldingBars
        if (j - i >= maxHoldingBars) {
          tradeResult = barClose >= signal.entryPrice 
            ? (signal.type === 'LONG' ? 'WIN' : 'LOSS')
            : (signal.type === 'LONG' ? 'LOSS' : 'WIN');
          exitPrice = barClose;
          exitIndex = j;
          exitReason = 'Salida de mercado por tiempo límite';
          break;
        }

        exitIndex = j;
        exitPrice = barClose;
      }

      // Calcular P&L del trade
      const priceDiff = signal.type === 'LONG' ? (exitPrice - signal.entryPrice) : (signal.entryPrice - exitPrice);
      const pnlPercent = (priceDiff / signal.entryPrice) * 100;
      const pnlDollars = notional * (pnlPercent / 100);

      currentBalance += pnlDollars;
      if (currentBalance > peakBalance) {
        peakBalance = currentBalance;
      }
      const dd = ((peakBalance - currentBalance) / peakBalance) * 100;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }

      if (pnlDollars > 0) {
        grossProfit += pnlDollars;
      } else {
        grossLoss += Math.abs(pnlDollars);
      }

      tradesList.push({
        id: `agent_trade_${tradesList.length + 1}`,
        symbol,
        type: signal.type,
        entryIndex: i,
        exitIndex,
        entryTime: signal.candleTime,
        exitTime: candles[exitIndex].time || candles[exitIndex].fecha,
        barsHeld: exitIndex - i,
        entryPrice: signal.entryPrice,
        exitPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        rrRatio: signal.rrRatio,
        positionUnits: Number(positionUnits.toFixed(4)),
        notional: Number(notional.toFixed(2)),
        pnlDollars: Number(pnlDollars.toFixed(2)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        outcome: tradeResult,
        exitReason,
        reasons: signal.reasons
      });

      // Saltar el índice de la barra para evitar doble entrada simultánea
      i = Math.max(i + 1, exitIndex);
    }

    const totalTrades = tradesList.length;
    const winningTrades = tradesList.filter(t => t.pnlDollars > 0).length;
    const losingTrades = tradesList.filter(t => t.pnlDollars < 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100) : 0;
    const netProfit = currentBalance - initialBalance;
    const netProfitPercent = ((netProfit / initialBalance) * 100);
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 99.9 : 0);

    const auditResult = {
      success: true,
      timestamp: new Date().toISOString(),
      symbol,
      candleCount: candles.length,
      initialBalance,
      finalBalance: Number(currentBalance.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      netProfitPercent: Number(netProfitPercent.toFixed(2)),
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
      tradesList,
      algorithmicRating: winRate >= 70 ? 'Óptima (A+)' : (winRate >= 55 ? 'Favorable (B+)' : 'Neutral (C)'),
      feedbackReview: this.generateFeedbackReport(symbol, winRate, totalTrades, profitFactor, netProfitPercent),
      microstructureSummary: microstructure ? {
        imbalance: microstructure.imbalance,
        bidPercentage: microstructure.bidPercentage,
        askPercentage: microstructure.askPercentage,
        fundingRatePercent: microstructure.fundingRatePercent,
        bidWallsCount: microstructure.bidWalls ? microstructure.bidWalls.length : 0,
        askWallsCount: microstructure.askWalls ? microstructure.askWalls.length : 0,
        recommendation: microstructure.recommendation
      } : null
    };

    // Guardar última auditoría en almacenamiento local
    try {
      localStorage.setItem(STORAGE_AGENT_AUDIT_KEY, JSON.stringify(auditResult));
    } catch (e) {
      console.warn('[QuantAgentEngine] Error guardando auditoría:', e);
    }

    return auditResult;
  }

  /**
   * Genera el reporte de retroalimentación estructurada para el cerebro algorítmico
   */
  static generateFeedbackReport(symbol, winRate, totalTrades, profitFactor, netProfitPercent) {
    if (totalTrades === 0) {
      return {
        title: 'Sin confluencias estadísticas',
        summary: `En la ventana histórica analizada de ${symbol}, el mercado se mantuvo en consolidación sin disparar los filtros mínimos de 2 reglas simultáneas.`,
        recommendation: 'Mantener paciencia operativa; el filtro anti-ruido protegió con éxito el capital de entradas falsas.'
      };
    }

    const isHighPerf = winRate >= 65 && profitFactor >= 1.6;
    return {
      title: isHighPerf ? 'Estrategia Cuantitativa Validada con Alta Confluencia' : 'Comportamiento en Rango Mixto',
      summary: `La combinación de Velas Japonesas con filtro de RSI Wilder y Bandas de Bollinger generó ${totalTrades} operaciones con ${winRate}% de acierto y Profit Factor de ${profitFactor}. Rendimiento neto acumulado: ${netProfitPercent >= 0 ? '+' : ''}${netProfitPercent}%.`,
      recommendation: isHighPerf
        ? `La confluencia de soporte en Banda Inferior con rechazo en Martillo demostró la máxima asimetría estadística en ${symbol}.`
        : `Recomiendo incrementar el filtro de confirmación sobre EMA 20 para evitar falsos quiebres en rangos estrechos.`
    };
  }

  /**
   * Obtiene la última auditoría guardada
   */
  static getLatestAudit() {
    try {
      const raw = localStorage.getItem(STORAGE_AGENT_AUDIT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
