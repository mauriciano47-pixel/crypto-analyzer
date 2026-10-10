import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { calcularBacktestingPatrones } from '../crypto-frontend/src/utils/patternBacktesting.js';

describe('Algoritmo de Backtesting Walk-Forward para Patrones Cuantitativos', () => {

  test('Manejo seguro ante listas vacías o nulas', () => {
    const emptyResult = calcularBacktestingPatrones([], []);
    assert.deepEqual(emptyResult, []);

    const nullResult = calcularBacktestingPatrones(null, null);
    assert.deepEqual(nullResult, []);
  });

  test('Evalúa éxito de un patrón alcista cuando el precio sube en las siguientes velas', () => {
    const chartData = [
      { close: 100, time: 1000 },
      { close: 102, time: 2000 }, // Patrón Bullish detectado aquí
      { close: 104, time: 3000 }, // Vela futura 1 (sube)
      { close: 106, time: 4000 }  // Vela futura 2 (sube)
    ];

    const patterns = [
      {
        patron: 'Bullish Engulfing',
        close: 102,
        time: 2000
      }
    ];

    const evaluated = calcularBacktestingPatrones(patterns, chartData);

    assert.equal(evaluated.length, 1);
    assert.equal(evaluated[0].evaluado, true);
    assert.equal(evaluated[0].esExitoso, true);
    assert.equal(evaluated[0].tasaAcierto, 100);
  });

  test('Evalúa fallo de un patrón bajista cuando el precio no cae en las siguientes velas', () => {
    const chartData = [
      { close: 100, time: 1000 },
      { close: 98, time: 2000 },  // Patrón Bearish detectado aquí
      { close: 101, time: 3000 }, // Vela futura 1 (sube en vez de caer)
      { close: 103, time: 4000 }  // Vela futura 2 (sube en vez de caer)
    ];

    const patterns = [
      {
        patron: 'Bearish Engulfing',
        close: 98,
        time: 2000
      }
    ];

    const evaluated = calcularBacktestingPatrones(patterns, chartData);

    assert.equal(evaluated.length, 1);
    assert.equal(evaluated[0].evaluado, true);
    assert.equal(evaluated[0].esExitoso, false);
    assert.equal(evaluated[0].tasaAcierto, 0);
  });

  test('Calcula la tasa de acierto acumulada cuando hay múltiples ocurrencias del mismo patrón', () => {
    const chartData = [
      { close: 50, time: 100 },
      { close: 52, time: 200 }, // Hammer 1 -> futuro sube a 55
      { close: 55, time: 300 },
      { close: 53, time: 400 }, // Hammer 2 -> futuro baja a 48
      { close: 48, time: 500 },
      { close: 47, time: 600 }
    ];

    const patterns = [
      { patron: 'Hammer Bullish', close: 52, time: 200 },
      { patron: 'Hammer Bullish', close: 53, time: 400 }
    ];

    const evaluated = calcularBacktestingPatrones(patterns, chartData);

    assert.equal(evaluated.length, 2);
    // 1 éxito de 2 intentos = 50%
    assert.equal(evaluated[0].tasaAcierto, 50);
    assert.equal(evaluated[1].tasaAcierto, 50);
  });

});
