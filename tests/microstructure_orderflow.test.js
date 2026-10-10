import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { microstructureService } from '../crypto-frontend/src/services/microstructureService.js';
import { orderFlowService } from '../crypto-frontend/src/services/orderFlowService.js';

describe('Motores de Microestructura L2 y Order Flow (CVD)', () => {

  test('microstructureService provee estado inicial con métricas coherentes', () => {
    const state = microstructureService.getState();
    assert.ok(state, 'Debe devolver un estado de microestructura');
    assert.equal(typeof state.bidPercentage, 'number');
    assert.equal(typeof state.askPercentage, 'number');
    assert.equal(state.bidPercentage + state.askPercentage, 100);
    assert.ok(Array.isArray(state.bidWalls));
    assert.ok(Array.isArray(state.askWalls));
    assert.ok(state.recommendation);
  });

  test('orderFlowService provee métricas de CVD y agresión taker coherentes', () => {
    const state = orderFlowService.getState();
    assert.ok(state, 'Debe devolver estado de order flow');
    assert.equal(typeof state.takerBuyRatio, 'number');
    assert.equal(typeof state.takerSellRatio, 'number');
    assert.equal(state.takerBuyRatio + state.takerSellRatio, 100);
    assert.ok(['BULLISH_ABSORPTION', 'BEARISH_ABSORPTION', 'NEUTRAL'].includes(state.absorptionStatus));
    assert.ok(state.absorptionReason);
  });

});
