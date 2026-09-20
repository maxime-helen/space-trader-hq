<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useMarketplacesQuery } from '@/modules/markets/api/queries';
import { shipsAtWaypoint } from '@/modules/markets/domain/ships-at-waypoint';
import type { Ship, Waypoint } from '@/shared/api/types';
import { formatApiValue } from '@/shared/lib/format';
import { marketPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';
import QueryState from '@/shared/ui/query-state.vue';

type MarketplaceGroupProps = {
  systemSymbol: string;
  isHeadquarters: boolean;
  ships: readonly Ship[];
};

const { systemSymbol, ships } = defineProps<MarketplaceGroupProps>();

const { data: marketplaces, isFetching, isError, refetch } = useMarketplacesQuery(() => systemSymbol);

const COLUMNS: DataTableColumn<Waypoint>[] = [
  { key: 'symbol', label: 'Waypoint' },
  { key: 'type', label: 'Type' },
  { key: 'ships', label: 'Your ships' },
  { key: 'market', label: 'Market', align: 'end' },
];

const rows = computed<Waypoint[]>(() => marketplaces.value ?? []);

const shipsPresent = (waypoint: Waypoint): string[] =>
  shipsAtWaypoint(ships, waypoint.symbol).map((ship) => ship.symbol);
</script>

<template>
  <section class="marketplace-group">
    <h3 class="marketplace-group-title">
      <span>{{ systemSymbol }}</span>
      <BaseBadge v-if="isHeadquarters" variant="docked">Headquarters</BaseBadge>
    </h3>

    <QueryState
      :has-data="marketplaces !== undefined"
      :fetching="isFetching"
      :error="isError"
      :empty="rows.length === 0"
      :error-title="`Couldn't load the marketplaces in ${systemSymbol}.`"
      empty-message="No marketplaces in this system."
      :retry="refetch"
    >
      <DataTable :columns="COLUMNS" :rows="rows" :row-key="(row: Waypoint) => row.symbol">
        <template #cell:symbol="{ row }">
          <RouterLink class="marketplace-group-link" :to="marketPath(systemSymbol, row.symbol)">
            {{ row.symbol }}
          </RouterLink>
        </template>

        <template #cell:type="{ row }">{{ formatApiValue(row.type) }}</template>

        <template #cell:ships="{ row }">
          <BaseBadge v-if="shipsPresent(row).length > 0" variant="positive" class="marketplace-group-present">
            Ship present: {{ shipsPresent(row).join(', ') }}
          </BaseBadge>
          <span v-else class="marketplace-group-absent">—</span>
        </template>

        <template #cell:market="{ row }">
          <RouterLink class="marketplace-group-link" :to="marketPath(systemSymbol, row.symbol)">
            Open market
          </RouterLink>
        </template>
      </DataTable>
    </QueryState>
  </section>
</template>

<style scoped>
.marketplace-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.marketplace-group-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.marketplace-group-link {
  color: var(--color-accent);
  text-decoration: none;
}

.marketplace-group-link:hover {
  text-decoration: underline;
}

.marketplace-group-absent {
  color: var(--color-text-muted);
}
</style>
