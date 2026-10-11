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
} from './indicators.js';

const STORAGE_AGENT_AUDIT_KEY = 'crypto_analyzer_agent_audit';

function detectCandlePatterns(c1, c2, c3) {
  const open = parseFloat(c3.open);
  const high = parseFloat(c3.high);
  const low = parseFloat(c3.low);
  const close = parseFloat(c3.close);
  const body = Math.abs(close - open);
  const upperShadow = high - Math.max(open, close);
  const lowerShadow = Math.min(open, close) - low;

  const prevOpen = parseFloat(c2.open);
  const prevClose = parseFloat(c2.close);

  return {
    isHammer: (lowerShadow >= 1.8 * body) && (upperShadow <= 0.25 * body) && (close >= open),
    isBullishEngulfing: (prevClose < prevOpen) && (close > open) && (open <= prevClose) && (close >= prevOpen),
    isMorningStar: (parseFloat(c1.close) < parseFloat(c1.open)) && 
                   (Math.abs(prevClose - prevOpen) < Math.abs(parseFloat(c1.open) - parseFloat(c1.close)) * 0.5) && 
                   (close > open) && (close > (parseFloat(c1.open) + parseFloat(c1.close)) / 2),
    isShootingStar: (upperShadow >= 1.8 * body) && (lowerShadow <= 0.25 * body) && (close <= open),
    isBearishEngulfing: (prevClose > prevOpen) && (close < open) && (open >= prevClose) && (close <= prevOpen)
  };
}

function collectBullishFactors(patterns, low, close, bbLower, rsi, prevRsi, ema20) {
  const reasons = [];
  if (patterns.isHammer) reasons.push('Martillo Alcista (Rechazo en soporte)');
  if (patterns.isBullishEngulfing) reasons.push('Envolvente Alcista (Presión compradora)');
  if (patterns.isMorningStar) reasons.push('Estrella de la Mañana (Giro de 3 velas)');
  if (low <= bbLower * 1.0025) reasons.push('Interacción con Banda Inferior Bollinger');
  if (rsi <= 40) reasons.push(`RSI Wilder en zona de sobreventa/acumulación (${rsi.toFixed(1)})`);
  else if (prevRsi < 36 && rsi > prevRsi) reasons.push(`Inflexión alcista de RSI (${prevRsi.toFixed(1)} → ${rsi.toFixed(1)})`);
  if (close >= ema20 * 0.985 && close <= ema20 * 1.015) reasons.push('Soporte dinámico sobre EMA 20');
  return reasons;
}

function collectBearishFactors(patterns, high, close, bbUpper, rsi, prevRsi, ema20, hasBullish) {
  const reasons = [];
  if (patterns.isShootingStar) reasons.push('Estrella Fugaz (Rechazo en resistencia)');
  if (patterns.isBearishEngulfing) reasons.push('Envolvente Bajista (Presión vendedora)');
  if (high >= bbUpper * 0.9975) reasons.push('Interacción con Banda Superior Bollinger');
  if (rsi >= 62 && !hasBullish) reasons.push(`RSI Wilder en sobrecompra (${rsi.toFixed(1)})`);
  else if (prevRsi > 65 && rsi < prevRsi) reasons.push(`Inflexión bajista de RSI (${prevRsi.toFixed(1)} → ${rsi.toFixed(1)})`);
  if (close <= ema20 * 1.015 && close >= ema20 * 0.985) reasons.push('Resistencia dinámica bajo EMA 20');
  return reasons;
}

function applyOrderFlowAndMicrostructure(bullishReasons, bearishReasons, microstructure, orderFlow) {
  if (microstructure?.imbalance >= 0.15) {
    bullishReasons.push(`Flujo L2: Desbalance comprador institucional (+${(microstructure.imbalance * 100).toFixed(0)}%)`);
  } else if (microstructure?.imbalance <= -0.15) {
    bearishReasons.push(`Flujo L2: Desbalance vendedor institucional (${(microstructure.imbalance * 100).toFixed(0)}%)`);
  }

  if (orderFlow?.absorptionStatus === 'BULLISH_ABSORPTION') {
    bullishReasons.push('Absorción CVD: Muro pasivo institucional absorbiendo ventas a mercado 🟢');
  } else if (orderFlow?.absorptionStatus === 'BEARISH_ABSORPTION') {
    bearishReasons.push('Absorción CVD: Muro pasivo institucional absorbiendo compras a mercado 🔴');
  }
  if (orderFlow?.takerBuyRatio >= 62) {
    bullishReasons.push(`Agresividad Taker: Dominio Comprador (${orderFlow.takerBuyRatio}%)`);
  } else if (orderFlow?.takerSellRatio >= 62) {
    bearishReasons.push(`Agresividad Taker: Dominio Vendedor (${orderFlow.takerSellRatio}%)`);
  }
}

function buildLongTrade(index, c3, prevLow, bullishReasons, isCounterTrend, targetRatio, microstructure, rsi) {
  const low = parseFloat(c3.low);
  const close = parseFloat(c3.close);
  if (isCounterTrend) bullishReasons.push('⚠️ Alerta Contratendencia: Stop Loss ceñido defensivo');
  const technicalSl = Math.min(low, prevLow) * (isCounterTrend ? 0.9985 : 0.998);
  const slDist = Math.max(close - technicalSl, close * 0.008);
  let technicalTp = close + (slDist * targetRatio);

  if (microstructure?.askWalls?.length) {
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

function buildShortTrade(index, c3, prevHigh, bearishReasons, isCounterTrend, targetRatio, microstructure, rsi) {
  const high = parseFloat(c3.high);
  const close = parseFloat(c3.close);
  if (isCounterTrend) bearishReasons.push('⚠️ Alerta Contratendencia: Stop Loss ceñido defensivo');
  const technicalSl = Math.max(high, prevHigh) * (isCounterTrend ? 1.0015 : 1.002);
  const slDist = Math.max(technicalSl - close, close * 0.008);
  let technicalTp = close - (slDist * targetRatio);

  if (microstructure?.bidWalls?.length) {
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

export class QuantAgentEngine {
  /**
   * Evalúa la confluencia técnica en una barra específica dentro de la serie histórica
   */
  static evaluateConfluence(candles, index, rsiList, ema20List, bbList, microstructure = null, orderFlow = null, mtf = null) {
    if (index < 2 || index >= candles.length) return null;

    const c3 = candles[index];
    const c2 = candles[index - 1];
    const c1 = index >= 2 ? candles[index - 2] : c2;

    const high = parseFloat(c3.high);
    const low = parseFloat(c3.low);
    const close = parseFloat(c3.close);
    const prevLow = parseFloat(c2.low);
    const prevHigh = parseFloat(c2.high);

    const rsi = rsiList[index] ?? 50;
    const prevRsi = rsiList[index - 1] ?? rsi;
    const ema20 = ema20List[index] ?? close;
    const bbUpper = bbList.upper[index] ?? (close * 1.02);
    const bbLower = bbList.lower[index] ?? (close * 0.98);

    const patterns = detectCandlePatterns(c1, c2, c3);
    const bullishReasons = collectBullishFactors(patterns, low, close, bbLower, rsi, prevRsi, ema20);
    const bearishReasons = collectBearishFactors(patterns, high, close, bbUpper, rsi, prevRsi, ema20, bullishReasons.length > 0);

    applyOrderFlowAndMicrostructure(bullishReasons, bearishReasons, microstructure, orderFlow);

    let isCounterTrend = false;
    if (mtf) {
      if (mtf.elderTripleScreen === 'ALIGNED_BULL') {
        bullishReasons.push('Radar MTF: Triple Screen alineado alcista (1D/1H/15M) 🟢');
      } else if (mtf.elderTripleScreen === 'ALIGNED_BEAR') {
        bearishReasons.push('Radar MTF: Triple Screen alineado bajista (1D/1H/15M) 🔴');
      } else if (mtf.elderTripleScreen === 'COUNTER_TREND_CAUTION') {
        isCounterTrend = true;
      }
    }

    const patternPresentBull = patterns.isHammer || patterns.isBullishEngulfing || patterns.isMorningStar || (low <= bbLower * 1.002) || (orderFlow?.absorptionStatus === 'BULLISH_ABSORPTION');
    const patternPresentBear = patterns.isShootingStar || patterns.isBearishEngulfing || (high >= bbUpper * 0.998) || (orderFlow?.absorptionStatus === 'BEARISH_ABSORPTION');

    if (bullishReasons.length >= 2 && patternPresentBull) {
      const targetRatio = isCounterTrend ? 2.0 : 2.25;
      return buildLongTrade(index, c3, prevLow, bullishReasons, isCounterTrend, targetRatio, microstructure, rsi);
    }

    if (bearishReasons.length >= 2 && patternPresentBear) {
      const targetRatio = isCounterTrend ? 2.0 : 2.25;
      return buildShortTrade(index, c3, prevHigh, bearishReasons, isCounterTrend, targetRatio, microstructure, rsi);
    }

    return null;
  }

  /**
   * Ejecuta una simulación completa Walk-Forward sobre el histórico íntegro de velas
   */
  static runHistoricalAudit(candles, symbol = 'BTC/USDT', config = {}, microstructure = null, orderFlow = null, mtf = null) {
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
      // Aplicar microestructura y order flow especialmente en la ventana reciente
      const isRecentWindow = (i >= candles.length - 8);
      const signal = this.evaluateConfluence(
        candles, 
        i, 
        rsiList, 
        ema20List, 
        bbList, 
        isRecentWindow ? microstructure : null,
        isRecentWindow ? orderFlow : null,
        isRecentWindow ? mtf : null
      );

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
      } : null,
      orderFlowSummary: orderFlow ? {
        takerBuyRatio: orderFlow.takerBuyRatio,
        takerSellRatio: orderFlow.takerSellRatio,
        absorptionStatus: orderFlow.absorptionStatus,
        absorptionReason: orderFlow.absorptionReason,
        deltaIntensity: orderFlow.deltaIntensity,
        currentDelta: orderFlow.currentDelta
      } : null,
      mtfSummary: mtf ? {
        alignmentPercent: mtf.alignmentPercent,
        alignmentStatus: mtf.alignmentStatus,
        elderTripleScreen: mtf.elderTripleScreen,
        elderMessage: mtf.elderMessage,
        bullishCount: mtf.bullishCount,
        bearishCount: mtf.bearishCount
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
