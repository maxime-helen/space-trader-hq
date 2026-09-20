import type { MarketTradeGood } from '@/shared/api/types';

const TYPE_RANK: Record<MarketTradeGood['type'], number> = { EXPORT: 0, IMPORT: 1, EXCHANGE: 2 };

export const goodLabel = (good: MarketTradeGood, names?: ReadonlyMap<string, string>): string =>
  names?.get(good.symbol) ?? good.symbol;

const compareText = (left: string, right: string): number => left.localeCompare(right, 'en-US');

// Exports, then imports, then exchange; by name within each.
export const orderTradeGoods = (
  goods: readonly MarketTradeGood[],
  names?: ReadonlyMap<string, string>,
): MarketTradeGood[] =>
  [...goods].sort((left, right) => {
    const byType = TYPE_RANK[left.type] - TYPE_RANK[right.type];
    return byType === 0 ? compareText(goodLabel(left, names), goodLabel(right, names)) : byType;
  });
