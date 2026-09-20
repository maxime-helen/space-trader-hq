import { describe, expect, expectTypeOf, it } from 'vitest';

import { catalogueGoods, goodNames, hasLivePrices, type LiveMarket } from '@/modules/markets/domain/market-view';
import { buildMarket, buildMarketTradeGood, buildTradeGood } from '@/shared/api/__tests__/fixtures';
import type { MarketTradeGood } from '@/shared/api/types';

describe('hasLivePrices', () => {
  it('is false for a catalogue response, which carries no tradeGoods at all', () => {
    expect(hasLivePrices(buildMarket())).toBe(false);
  });

  it('is true when tradeGoods is present', () => {
    expect(hasLivePrices(buildMarket({ tradeGoods: [buildMarketTradeGood()] }))).toBe(true);
  });

  it('is true for tradeGoods: [] — an empty live market, not a catalogue', () => {
    expect(hasLivePrices(buildMarket({ tradeGoods: [] }))).toBe(true);
  });

  it('narrows the type: tradeGoods is no longer optional in the live branch', () => {
    const market = buildMarket({ tradeGoods: [buildMarketTradeGood()] });

    if (hasLivePrices(market)) {
      // Not `MarketTradeGood[] | undefined`: the live branch needs no guard of its own, which is
      // what stops a template from reaching for prices that were never sent.
      expectTypeOf(market.tradeGoods).toEqualTypeOf<MarketTradeGood[]>();
      expectTypeOf(market).toEqualTypeOf<LiveMarket>();
      expect(market.tradeGoods).toHaveLength(1);
    } else {
      expect.unreachable('a market with tradeGoods must take the live branch');
    }
  });
});

describe('catalogueGoods and goodNames', () => {
  const market = buildMarket({
    exports: [buildTradeGood({ symbol: 'MACHINERY', name: 'Machinery' })],
    imports: [buildTradeGood({ symbol: 'FOOD', name: 'Food' })],
    exchange: [buildTradeGood({ symbol: 'FUEL', name: 'Fuel' })],
  });

  it('reads every good of the market, whatever its role', () => {
    expect(catalogueGoods(market).map((good) => good.symbol)).toEqual(['MACHINERY', 'FOOD', 'FUEL']);
  });

  it('gives the price table its names, since MarketTradeGood only carries a symbol', () => {
    expect(goodNames(market).get('FOOD')).toBe('Food');
    expect(goodNames(market).size).toBe(3);
  });
});
