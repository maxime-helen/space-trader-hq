<script setup lang="ts">
import { computed } from 'vue';

import { useMarketQuery } from '@/modules/markets/api/queries';
import { goodNames, hasLivePrices, type LiveMarket } from '@/modules/markets/domain/market-view';
import QueryState from '@/shared/ui/query-state.vue';

import MarketCatalogue from './market-catalogue.vue';
import MarketPriceTable from './market-price-table.vue';

type MarketPanelProps = {
  systemSymbol: string;
  waypointSymbol: string;
};

const { systemSymbol, waypointSymbol } = defineProps<MarketPanelProps>();

const {
  data: market,
  isFetching,
  isError,
  refetch,
} = useMarketQuery(
  () => systemSymbol,
  () => waypointSymbol,
);

const live = computed<LiveMarket | null>(() => {
  const response = market.value;
  return response !== undefined && hasLivePrices(response) ? response : null;
});

const catalogue = computed(() => {
  const response = market.value;
  if (response === undefined) return null;
  return { exports: response.exports, imports: response.imports, exchange: response.exchange };
});

const names = computed<ReadonlyMap<string, string>>(() =>
  market.value === undefined ? new Map<string, string>() : goodNames(market.value),
);
</script>

<template>
  <section class="market-panel">
    <QueryState
      :has-data="market !== undefined"
      :fetching="isFetching"
      :error="isError"
      error-title="Couldn't load this market."
      :retry="refetch"
    >
      <template v-if="live !== null">
        <h3 class="market-panel-heading">Live prices</h3>
        <MarketPriceTable :trade-goods="live.tradeGoods" :names="names" />
      </template>

      <template v-else-if="catalogue !== null">
        <MarketCatalogue :exports="catalogue.exports" :imports="catalogue.imports" :exchange="catalogue.exchange" />
      </template>
    </QueryState>
  </section>
</template>

<style scoped>
.market-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.market-panel-heading {
  margin: var(--space-4) 0 var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.market-panel-heading:first-child {
  margin-top: 0;
}
</style>
