<script setup lang="ts">
import { computed } from 'vue';

import { useShipyardQuery } from '@/modules/systems/api/queries';
import type { ShipyardShip } from '@/shared/api/types';
import { formatApiValue, formatCredits } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';
import QueryState from '@/shared/ui/query-state.vue';

type WaypointShipyardTabProps = {
  systemSymbol: string;
  waypointSymbol: string;
};

const { systemSymbol, waypointSymbol } = defineProps<WaypointShipyardTabProps>();

const system = computed(() => systemSymbol);
const waypoint = computed(() => waypointSymbol);

const { data: shipyard, isError: failed, isFetching: fetching, refetch } = useShipyardQuery(system, waypoint);

const shipsForSale = computed(() => shipyard.value?.ships);

const columns: DataTableColumn<ShipyardShip>[] = [
  { key: 'name', label: 'Ship', value: (ship) => ship.name },
  { key: 'type', label: 'Type' },
  { key: 'supply', label: 'Supply' },
  { key: 'activity', label: 'Activity' },
  { key: 'purchasePrice', label: 'Price', numeric: true, value: (ship) => formatCredits(ship.purchasePrice) },
];
</script>

<template>
  <div class="waypoint-shipyard">
    <QueryState
      :has-data="shipyard !== undefined"
      :fetching="fetching"
      :error="failed"
      error-title="Couldn't load this shipyard."
      :retry="refetch"
    >
      <div v-if="shipyard !== undefined" class="waypoint-shipyard-body">
        <section>
          <h3 class="waypoint-shipyard-title">Ship types sold</h3>
          <ul class="waypoint-shipyard-types">
            <li v-for="shipType in shipyard.shipTypes" :key="shipType.type">
              <BaseBadge>{{ formatApiValue(shipType.type) }}</BaseBadge>
            </li>
          </ul>
          <p class="waypoint-shipyard-fee">
            Modifications fee: <strong>{{ formatCredits(shipyard.modificationsFee) }}</strong> per module slot or mount.
          </p>
        </section>

        <section>
          <h3 class="waypoint-shipyard-title">Available ships</h3>
          <DataTable
            v-if="shipsForSale !== undefined"
            :columns="columns"
            :rows="shipsForSale"
            :row-key="(ship) => ship.type"
          >
            <template #cell:type="{ row }">
              <BaseBadge>{{ formatApiValue(row.type) }}</BaseBadge>
            </template>
            <template #cell:supply="{ row }">
              <BaseBadge>{{ formatApiValue(row.supply) }}</BaseBadge>
            </template>
            <template #cell:activity="{ row }">
              <span>{{ row.activity === undefined ? '—' : formatApiValue(row.activity) }}</span>
            </template>
            <template #empty>This shipyard has nothing on the pad right now.</template>
          </DataTable>

          <p v-else class="waypoint-shipyard-callout">
            Available ships and prices need one of your ships at this waypoint.
          </p>
        </section>
      </div>
    </QueryState>
  </div>
</template>

<style scoped>
.waypoint-shipyard-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.waypoint-shipyard-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.waypoint-shipyard-types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.waypoint-shipyard-fee {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.waypoint-shipyard-callout {
  margin: 0;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  color: var(--color-text-muted);
}
</style>
