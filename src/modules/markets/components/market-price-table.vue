<script setup lang="ts">
import { computed, ref } from 'vue';

import { goodLabel, orderTradeGoods } from '@/modules/markets/domain/order-trade-goods';
import type { ActivityLevel, MarketTradeGood, SupplyLevel } from '@/shared/api/types';
import { formatApiValue, formatCredits, formatNumber } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

type MarketPriceTableProps = {
  tradeGoods: readonly MarketTradeGood[];
  names: ReadonlyMap<string, string>;
  emptyMessage?: string;
};

const {
  tradeGoods,
  names,
  emptyMessage = 'This market has no goods to price right now.',
} = defineProps<MarketPriceTableProps>();

type TradeType = MarketTradeGood['type'];

type TypeFilter = TradeType | 'ALL';

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'All types' },
  { value: 'EXPORT', label: 'Exports' },
  { value: 'IMPORT', label: 'Imports' },
  { value: 'EXCHANGE', label: 'Exchange' },
];

const SUPPLY_VARIANT = {
  SCARCE: 'danger',
  LIMITED: 'transit',
  MODERATE: 'neutral',
  HIGH: 'orbit',
  ABUNDANT: 'positive',
} as const satisfies Record<SupplyLevel, string>;

const ACTIVITY_VARIANT = {
  RESTRICTED: 'danger',
  WEAK: 'transit',
  GROWING: 'orbit',
  STRONG: 'positive',
} as const satisfies Record<ActivityLevel, string>;

const TYPE_VARIANT = { EXPORT: 'orbit', IMPORT: 'docked', EXCHANGE: 'neutral' } as const satisfies Record<
  TradeType,
  string
>;

const PRICE_COLUMNS: DataTableColumn<MarketTradeGood>[] = [
  { key: 'good', label: 'Good' },
  { key: 'type', label: 'Type' },
  { key: 'supply', label: 'Supply' },
  { key: 'activity', label: 'Activity' },
  { key: 'purchasePrice', label: 'Buy', numeric: true },
  { key: 'sellPrice', label: 'Sell', numeric: true },
  { key: 'tradeVolume', label: 'Volume', numeric: true },
];

const typeFilter = ref<TypeFilter>('ALL');

const filtered = computed(() =>
  typeFilter.value === 'ALL' ? tradeGoods : tradeGoods.filter((good) => good.type === typeFilter.value),
);

const rows = computed(() => orderTradeGoods(filtered.value, names));

const label = (good: MarketTradeGood): string => goodLabel(good, names);
</script>

<template>
  <div class="market-price-table">
    <div class="market-price-table-filter">
      <label>
        <span>Type</span>
        <select v-model="typeFilter" class="market-price-table-select">
          <option v-for="option in TYPE_FILTERS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>

    <DataTable :columns="PRICE_COLUMNS" :rows="rows" :row-key="(row: MarketTradeGood) => row.symbol">
      <template #cell:good="{ row }">
        <span class="market-price-table-good">
          <span class="market-price-table-name">{{ label(row) }}</span>
          <span class="market-price-table-symbol">{{ row.symbol }}</span>
        </span>
      </template>

      <template #cell:type="{ row }">
        <BaseBadge :variant="TYPE_VARIANT[row.type]">{{ formatApiValue(row.type) }}</BaseBadge>
      </template>

      <template #cell:supply="{ row }">
        <BaseBadge :variant="SUPPLY_VARIANT[row.supply]">{{ formatApiValue(row.supply) }}</BaseBadge>
      </template>

      <template #cell:activity="{ row }">
        <BaseBadge v-if="row.activity !== undefined" :variant="ACTIVITY_VARIANT[row.activity]">
          {{ formatApiValue(row.activity) }}
        </BaseBadge>
        <span v-else class="market-price-table-absent">—</span>
      </template>

      <template #cell:purchasePrice="{ row }">{{ formatCredits(row.purchasePrice) }}</template>
      <template #cell:sellPrice="{ row }">{{ formatCredits(row.sellPrice) }}</template>
      <template #cell:tradeVolume="{ row }">{{ formatNumber(row.tradeVolume) }}</template>

      <template v-if="$slots.trade" #cell:trade="{ row }">
        <slot name="trade" :good="row" />
      </template>

      <template #empty>{{ emptyMessage }}</template>
    </DataTable>
  </div>
</template>

<style scoped>
.market-price-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.market-price-table-filter label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.market-price-table-select {
  font: inherit;
  font-size: var(--text-sm);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-control);
  border: var(--border);
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.market-price-table-good {
  display: inline-flex;
  flex-direction: column;
}

.market-price-table-symbol {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.market-price-table-absent {
  color: var(--color-text-muted);
}
</style>
