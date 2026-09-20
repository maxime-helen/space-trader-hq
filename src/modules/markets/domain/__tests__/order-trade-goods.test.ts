import { describe, expect, it } from 'vitest';

import { goodLabel, orderTradeGoods } from '@/modules/markets/domain/order-trade-goods';
import { buildMarketTradeGood } from '@/shared/api/__tests__/fixtures';
import type { MarketTradeGood } from '@/shared/api/types';

const aluminum: MarketTradeGood = {
  symbol: 'ALUMINUM',
  type: 'EXPORT',
  supply: 'ABUNDANT',
  purchasePrice: 104,
  sellPrice: 97,
  tradeVolume: 40,
};

const electronics = buildMarketTradeGood({
  symbol: 'ELECTRONICS',
  type: 'EXPORT',
  supply: 'LIMITED',
  activity: 'WEAK',
  purchasePrice: 210,
  sellPrice: 190,
  tradeVolume: 10,
});

const ironOre = buildMarketTradeGood({
  symbol: 'IRON_ORE',
  type: 'IMPORT',
  supply: 'SCARCE',
  activity: 'GROWING',
  purchasePrice: 61,
  sellPrice: 58,
  tradeVolume: 60,
});

const fuel = buildMarketTradeGood({
  symbol: 'FUEL',
  type: 'EXCHANGE',
  supply: 'MODERATE',
  activity: 'STRONG',
  purchasePrice: 72,
  sellPrice: 68,
  tradeVolume: 180,
});

const goods = [fuel, ironOre, aluminum, electronics];

const names = new Map([
  ['ALUMINUM', 'Aluminum'],
  ['ELECTRONICS', 'Electronics'],
  ['IRON_ORE', 'Iron ore'],
  ['FUEL', 'Fuel'],
]);

const symbolsOf = (ordered: { symbol: string }[]): string[] => ordered.map((good) => good.symbol);

describe('orderTradeGoods', () => {
  it('orders exports, then imports, then exchange, by name within each', () => {
    expect(symbolsOf(orderTradeGoods(goods, names))).toEqual(['ALUMINUM', 'ELECTRONICS', 'IRON_ORE', 'FUEL']);
  });

  it('falls back to the symbol when the catalogue named nothing', () => {
    expect(symbolsOf(orderTradeGoods(goods))).toEqual(['ALUMINUM', 'ELECTRONICS', 'IRON_ORE', 'FUEL']);
  });

  it('breaks ties by name, so equal rows never shuffle', () => {
    expect(symbolsOf(orderTradeGoods([...goods].reverse(), names))).toEqual(symbolsOf(orderTradeGoods(goods, names)));
  });

  it('returns a copy, leaving the cached response in the order the API sent it', () => {
    const original = [...goods];
    const ordered = orderTradeGoods(goods, names);

    expect(goods).toEqual(original);
    expect(ordered).not.toBe(goods);
  });
});

describe('goodLabel', () => {
  it('prefers the catalogue name and falls back to the symbol', () => {
    expect(goodLabel(ironOre, names)).toBe('Iron ore');
    expect(goodLabel(ironOre)).toBe('IRON_ORE');
    expect(goodLabel(ironOre, new Map())).toBe('IRON_ORE');
  });
});
