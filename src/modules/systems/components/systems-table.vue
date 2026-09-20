<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { System } from '@/shared/api/types';
import { formatApiValue, formatCoordinates, formatNumber } from '@/shared/lib/format';
import { systemPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

const { systems } = defineProps<{ systems: readonly System[] }>();

const ABSENT = '—';

const COLUMNS: readonly DataTableColumn<System>[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'name', label: 'Name', value: (system) => system.name ?? ABSENT },
  { key: 'type', label: 'Type' },
  { key: 'sector', label: 'Sector', value: (system) => system.sectorSymbol },
  { key: 'constellation', label: 'Constellation', value: (system) => system.constellation ?? ABSENT },
  { key: 'coordinates', label: 'Coordinates', value: (system) => formatCoordinates(system.x, system.y) },
  { key: 'waypoints', label: 'Waypoints', numeric: true, value: (system) => formatNumber(system.waypoints.length) },
  { key: 'factions', label: 'Factions' },
];

const factionsOf = (system: System): string =>
  system.factions.length === 0 ? ABSENT : system.factions.map((faction) => formatApiValue(faction.symbol)).join(', ');
</script>

<template>
  <DataTable :columns="COLUMNS" :rows="systems" :row-key="(system: System) => system.symbol" class="systems-table">
    <template #cell:symbol="{ row }">
      <RouterLink class="systems-table-link" :to="systemPath(row.symbol)">{{ row.symbol }}</RouterLink>
    </template>
    <template #cell:type="{ row }">
      <BaseBadge>{{ formatApiValue(row.type) }}</BaseBadge>
    </template>
    <template #cell:factions="{ row }">{{ factionsOf(row) }}</template>
    <template #empty>No systems on this page.</template>
  </DataTable>
</template>

<style scoped>
.systems-table-link {
  color: var(--color-accent);
  text-decoration: none;
}

.systems-table-link:hover {
  text-decoration: underline;
}
</style>
