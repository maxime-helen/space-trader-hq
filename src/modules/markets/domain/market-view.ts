import type { Market, MarketTradeGood, TradeGood } from '@/shared/api/types';

export type LiveMarket = Market & { tradeGoods: MarketTradeGood[] };

export const hasLivePrices = (market: Market): market is LiveMarket => market.tradeGoods !== undefined;

export const catalogueGoods = (market: Market): TradeGood[] => [
  ...market.exports,
  ...market.imports,
  ...market.exchange,
];

export const goodNames = (market: Market): Map<string, string> =>
  new Map(catalogueGoods(market).map((good) => [good.symbol, good.name]));
