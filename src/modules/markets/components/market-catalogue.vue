<script setup lang="ts">
import { computed } from 'vue';

import type { TradeGood } from '@/shared/api/types';

type MarketCatalogueProps = {
  exports: readonly TradeGood[];
  imports: readonly TradeGood[];
  exchange: readonly TradeGood[];
};

const { exports, imports, exchange } = defineProps<MarketCatalogueProps>();

const sections = computed<{ title: string; goods: readonly TradeGood[]; empty: string }[]>(() => [
  { title: 'Exports', goods: exports, empty: 'This market exports nothing.' },
  { title: 'Imports', goods: imports, empty: 'This market imports nothing.' },
  { title: 'Exchange', goods: exchange, empty: 'This market exchanges nothing.' },
]);
</script>

<template>
  <div class="market-catalogue">
    <section v-for="section in sections" :key="section.title" class="market-catalogue-section">
      <h4 class="market-catalogue-title">{{ section.title }}</h4>

      <p v-if="section.goods.length === 0" class="market-catalogue-empty">{{ section.empty }}</p>

      <ul v-else class="market-catalogue-list">
        <li v-for="good in section.goods" :key="good.symbol" class="market-catalogue-good">
          <details>
            <summary>
              <span class="market-catalogue-name">{{ good.name }}</span>
              <span class="market-catalogue-symbol">{{ good.symbol }}</span>
            </summary>
            <p class="market-catalogue-description">{{ good.description }}</p>
          </details>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.market-catalogue {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-4);
}

.market-catalogue-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.market-catalogue-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.market-catalogue-good summary {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  cursor: pointer;
  padding: var(--space-1) 0;
}

.market-catalogue-symbol {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.market-catalogue-description,
.market-catalogue-empty {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
