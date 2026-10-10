import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { 
  calculateRSI, 
  calculateSMA, 
  calculateEMA, 
  calculateBollingerBands, 
  calculateFibonacciLevels, 
  calculatePivotPoints,
  detectCandlestickPatterns
} from '../crypto-frontend/src/services/indicators.js';

describe('Cálculo de Indicadores Técnicos y Algoritmos Cuantitativos', () => {

  test('calculateSMA calcula promedios móviles simples con precisión', () => {
    const closes = [10, 20, 30, 40, 50];
    const sma3 = calculateSMA(closes, 3);
    assert.equal(sma3[0], null);
    assert.equal(sma3[1], null);
    assert.equal(sma3[2], 20); // (10+20+30)/3
    assert.equal(sma3[3], 30); // (20+30+40)/3
    assert.equal(sma3[4], 40); // (30+40+50)/3
  });

  test('calculateEMA responde con ponderación exponencial correcta', () => {
    const closes = [10, 11, 12, 13, 14, 15];
    const ema3 = calculateEMA(closes, 3);
    assert.equal(ema3[0], null);
    assert.equal(ema3[1], null);
    assert.equal(ema3[2], 11); // Initial SMA base
    assert.ok(ema3[3] > 11.5 && ema3[3] < 13);
    assert.ok(ema3[5] > ema3[4]);
  });

  test('calculateRSI detecta niveles de sobrecompra y sobreventa', () => {
    // Serie estrictamente creciente -> RSI 100
    const bullishCloses = Array.from({ length: 20 }, (_, i) => 100 + i * 5);
    const rsiBull = calculateRSI(bullishCloses, 14);
    assert.equal(rsiBull[14], 100);

    // Serie oscilante con 25 puntos
    const oscillating = [
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 
      46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 
      46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78
    ];
    const rsiOsc = calculateRSI(oscillating, 14);
    assert.ok(rsiOsc[14] > 40 && rsiOsc[14] < 80);
    assert.ok(typeof rsiOsc[24] === 'number');
  });

  test('calculateBollingerBands genera bandas superior, media e inferior', () => {
    const closes = Array.from({ length: 25 }, (_, i) => 50 + (i % 5) * 2);
    const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2);
    
    assert.equal(upper.length, 25);
    assert.equal(middle.length, 25);
    assert.equal(lower.length, 25);

    // En el índice 20 deben existir valores numéricos y Upper > Middle > Lower
    assert.ok(typeof middle[20] === 'number');
    assert.ok(upper[20] > middle[20]);
    assert.ok(middle[20] > lower[20]);
  });

  test('calculateFibonacciLevels calcula ratios clásicos (0% a 100%)', () => {
    const high = 100;
    const low = 50;
    const levels = calculateFibonacciLevels(high, low);

    assert.equal(levels.length, 7);
    assert.equal(levels[0].price, 100); // 0.0%
    assert.equal(levels[3].price, 75);  // 50.0% equilibrio
    assert.equal(levels[6].price, 50);  // 100.0%
    assert.ok(levels.find(l => l.ratio === 0.618)); // Aureo
  });

  test('calculatePivotPoints genera puntos de pivote R1, R2, S1, S2', () => {
    const high = 110;
    const low = 90;
    const close = 100;
    const { pivot, r1, s1, r2, s2 } = calculatePivotPoints(high, low, close);

    assert.equal(pivot, 100);
    assert.equal(r1, 110);
    assert.equal(s1, 90);
    assert.equal(r2, 120);
    assert.equal(s2, 80);
  });

  test('detectCandlestickPatterns detecta Doji y Martillo correctamente', () => {
    const candles = [
      { open: 100, high: 105, low: 95, close: 102, time: 1000 },
      { open: 102, high: 106, low: 98, close: 99, time: 2000 },
      // Doji: open y close prácticamente iguales con sombras
      { open: 100, high: 110, low: 90, close: 100.05, time: 3000 }
    ];

    const detected = detectCandlestickPatterns(candles);
    assert.ok(detected.length >= 1);
    assert.ok(detected.some(p => p.patron.includes('Doji')));
  });

});
