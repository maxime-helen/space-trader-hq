<script setup lang="ts">
import { computed } from 'vue';

import type { ShipStatusCounts } from '@/modules/fleet/domain/fleet-summary';
import { navStatusLabel } from '@/modules/fleet/domain/ship-metrics';
import type { ShipNavStatus } from '@/shared/api/types';
import { formatNumber } from '@/shared/lib/format';

type FleetSummaryProps = {
  totalShips: number;
  // How many of them are on the page the counts were taken from.
  shownShips: number;
  counts: ShipStatusCounts;
};

const { totalShips, shownShips, counts } = defineProps<FleetSummaryProps>();

// The counts come from one page of ships; when the fleet spans several pages, say so rather than
// let "40 ships · 1 docked" read as a fleet-wide breakdown.
const isPartial = computed(() => shownShips < totalShips);

const ORDER: ShipNavStatus[] = ['DOCKED', 'IN_ORBIT', 'IN_TRANSIT'];

const statuses = computed(() =>
  ORDER.map((status) => ({ status, count: counts[status], label: navStatusLabel(status).toLowerCase() })),
);
</script>

<template>
  <div class="fleet-summary">
    <span class="fleet-summary-item">
      <strong>{{ formatNumber(totalShips) }}</strong> {{ totalShips === 1 ? 'ship' : 'ships' }}
    </span>
    <span v-if="isPartial" class="fleet-summary-scope">On this page:</span>
    <span v-for="entry in statuses" :key="entry.status" class="fleet-summary-item">
      <strong>{{ formatNumber(entry.count) }}</strong> {{ entry.label }}
    </span>
  </div>
</template>

<style scoped>
.fleet-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  margin: var(--space-3) 0 var(--space-5);
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.fleet-summary-scope {
  margin-left: var(--space-2);
}

.fleet-summary-item strong {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
  font-variant-numeric: tabular-nums;
}
</style>
