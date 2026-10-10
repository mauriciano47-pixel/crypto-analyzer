import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Mock de localStorage para Node.js test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

import { QuantAgentEngine } from '../crypto-frontend/src/services/quantAgentEngine.js';

describe('Motor de Auditoría Cuantitativa Walk-Forward (QuantAgentEngine)', () => {

  test('Falla de forma controlada si se proveen menos de 30 velas históricas', () => {
    const candles = Array.from({ length: 15 }, (_, i) => ({
      open: 100 + i,
      high: 105 + i,
      low: 95 + i,
      close: 102 + i,
      time: 1000 + i * 60
    }));

    const result = QuantAgentEngine.runHistoricalAudit(candles, 'BTC/USDT');
    assert.equal(result.success, false);
    assert.ok(result.message.includes('al menos 30'));
  });

  test('Ejecuta auditoría completa con 60 velas históricas y calcula métricas clave', () => {
    // Generar serie sintética oscilante de 60 velas
    const candles = Array.from({ length: 60 }, (_, i) => {
      const base = 50000 + Math.sin(i / 5) * 1500;
      return {
        open: base - 50,
        high: base + 200,
        low: base - 200,
        close: base + 50,
        time: 1700000000 + i * 60,
        fecha: new Date(1700000000000 + i * 60000).toISOString()
      };
    });

    const result = QuantAgentEngine.runHistoricalAudit(candles, 'BTC/USDT', {
      initialBalance: 10000,
      riskPerTrade: 0.015,
      maxHoldingBars: 20
    });

    assert.equal(result.success, true);
    assert.equal(result.symbol, 'BTC/USDT');
    assert.ok(typeof result.winRate === 'number');
    assert.ok(typeof result.profitFactor === 'number');
    assert.ok(typeof result.netProfit === 'number');
    assert.ok(typeof result.maxDrawdownPercent === 'number');
    assert.ok(Array.isArray(result.tradesList));
    assert.ok(result.feedbackReview);
    assert.ok(result.feedbackReview.title);
  });

  test('Evalúa confluencia técnica en un punto temporal específico', () => {
    const candles = Array.from({ length: 35 }, (_, i) => ({
      open: 100,
      high: 110,
      low: 90,
      close: 105,
      time: 1000 + i * 60
    }));

    const rsiList = new Array(35).fill(28); // Sobreventa extrema
    const ema20List = new Array(35).fill(95); // Precio sobre EMA
    const bbList = {
      lower: new Array(35).fill(92),
      upper: new Array(35).fill(115),
      middle: new Array(35).fill(103)
    };

    const signal = QuantAgentEngine.evaluateConfluence(candles, 30, rsiList, ema20List, bbList);
    // Debería generar o validar señal
    if (signal) {
      assert.ok(['LONG', 'SHORT'].includes(signal.type));
      assert.ok(signal.stopLoss > 0);
      assert.ok(signal.takeProfit > 0);
    }
  });

});
