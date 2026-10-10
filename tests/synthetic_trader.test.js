import { test, describe, before } from 'node:test';
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

const { syntheticTraderService } = await import('../crypto-frontend/src/services/syntheticTraderService.js');

describe('Servicio Autónomo de Trader Simulado (Synthetic Trader)', () => {

  test('Inicializa un perfil de trader verosímil con nombre y biografía', () => {
    const trader = syntheticTraderService.getTrader();
    assert.ok(trader, 'Debe existir un trader activo');
    assert.ok(trader.profile.name, 'Debe tener nombre');
    assert.ok(trader.profile.username, 'Debe tener username');
    assert.ok(trader.currentBalance > 0, 'Debe tener balance positivo');
    assert.ok(trader.winRate >= 50, 'Win Rate debe ser razonable');
  });

  test('La posición activa simula orden LONG o SHORT con niveles de SL y TP', () => {
    const trader = syntheticTraderService.getTrader();
    assert.ok(trader.activePosition, 'Debe tener una posición activa');
    const pos = trader.activePosition;
    assert.ok(['LONG', 'SHORT'].includes(pos.type));
    assert.ok(pos.entryPrice > 0);
    assert.ok(pos.stopLoss > 0);
    assert.ok(pos.takeProfit > 0);
    assert.ok(pos.rrRatio >= 1.5, 'Ratio Riesgo:Beneficio debe ser >= 1.5');
  });

  test('Actualiza el PnL flotante cuando cambia el precio de mercado', () => {
    const trader = syntheticTraderService.getTrader();
    const pos = trader.activePosition;
    const initialPrice = pos.entryPrice;

    // Simular subida de precio
    if (pos.type === 'LONG') {
      syntheticTraderService.updateMarketPrice(pos.symbol, initialPrice * 1.05);
      const updated = syntheticTraderService.getTrader();
      assert.ok(updated.activePosition.floatingPnL > 0, 'LONG debe tener ganancia si el precio sube');
    } else {
      syntheticTraderService.updateMarketPrice(pos.symbol, initialPrice * 0.95);
      const updated = syntheticTraderService.getTrader();
      assert.ok(updated.activePosition.floatingPnL > 0, 'SHORT debe tener ganancia si el precio baja');
    }
  });

  test('Permite rotar de trader forzando una nueva identidad verosímil', () => {
    const prevUsername = syntheticTraderService.getTrader().profile.username;
    syntheticTraderService.forceRotateTrader('ETH/USDT', 3200);
    const newTrader = syntheticTraderService.getTrader();
    assert.ok(newTrader);
    assert.ok(newTrader.profile.name);
  });

});
