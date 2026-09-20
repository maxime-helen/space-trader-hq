import { describe, expect, it } from 'vitest';

import * as marketsModule from '@/modules/markets';
import { marketKeys, marketsRoutes } from '@/modules/markets';

describe('the markets module index', () => {
  it('exports the panel, the cache keys, the two queries and the route table', () => {
    expect(Object.keys(marketsModule).sort()).toEqual([
      'MarketPanel',
      'marketKeys',
      'marketsRoutes',
      'useMarketQuery',
      'useMarketplacesQuery',
    ]);
  });

  it('keeps the domain functions private', () => {
    expect(marketsModule).not.toHaveProperty('hasLivePrices');
    expect(marketsModule).not.toHaveProperty('orderTradeGoods');
  });
});

describe('marketsRoutes', () => {
  it('owns `/markets` and nothing else: a market has no route of its own', () => {
    expect(marketsRoutes).toHaveLength(1);
    expect(marketsRoutes[0]?.path).toBe('/markets');
  });

  it('loads the page lazily and names the page half of the tab title', () => {
    const route = marketsRoutes[0];

    expect(typeof route?.component).toBe('function');
    expect(route?.meta?.title).toBe('Markets');
  });
});

describe('marketKeys', () => {
  it('names one key per system list and one per market', () => {
    expect(marketKeys.marketplaces('X1-DF55')).toEqual(['markets', 'marketplaces', 'X1-DF55']);
    expect(marketKeys.detail('X1-DF55', 'X1-DF55-A2')).toEqual(['markets', 'detail', 'X1-DF55', 'X1-DF55-A2']);
  });

  it('keeps every entry under one prefix, which is what the goods lookup reads', () => {
    expect(marketKeys.marketplaces('X1-DF55').slice(0, 1)).toEqual(marketKeys.all());
    expect(marketKeys.detail('X1-DF55', 'X1-DF55-A2').slice(0, 1)).toEqual(marketKeys.all());
  });
});
