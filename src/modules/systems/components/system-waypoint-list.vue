<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { Waypoint } from '@/shared/api/types';
import { formatApiValue, formatCoordinates } from '@/shared/lib/format';
import { waypointPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

const { waypoints, systemSymbol } = defineProps<{ waypoints: readonly Waypoint[]; systemSymbol: string }>();

const ABSENT = '—';

const COLUMNS: readonly DataTableColumn<Waypoint>[] = [
  { key: 'symbol', label: 'Waypoint' },
  { key: 'type', label: 'Type' },
  { key: 'coordinates', label: 'Coordinates', value: (waypoint) => formatCoordinates(waypoint.x, waypoint.y) },
  {
    key: 'faction',
    label: 'Faction',
    value: (waypoint) => (waypoint.faction === undefined ? ABSENT : formatApiValue(waypoint.faction.symbol)),
  },
  { key: 'traits', label: 'Traits' },
];
</script>

<template>
  <DataTable
    :columns="COLUMNS"
    :rows="waypoints"
    :row-key="(waypoint: Waypoint) => waypoint.symbol"
    class="system-waypoint-list"
  >
    <template #cell:symbol="{ row }">
      <RouterLink class="system-waypoint-list-link" :to="waypointPath(systemSymbol, row.symbol)">
        {{ row.symbol }}
      </RouterLink>
    </template>
    <template #cell:type="{ row }">
      <BaseBadge>{{ formatApiValue(row.type) }}</BaseBadge>
    </template>
    <template #cell:traits="{ row }">
      <span class="system-waypoint-list-traits">
        <BaseBadge v-for="trait in row.traits" :key="trait.symbol">{{ trait.name }}</BaseBadge>
        <template v-if="row.traits.length === 0">{{ ABSENT }}</template>
      </span>
    </template>
    <template #empty>No waypoint in this system has every trait you picked.</template>
  </DataTable>
</template>

<style scoped>
.system-waypoint-list-link {
  color: var(--color-accent);
  text-decoration: none;
}

.system-waypoint-list-link:hover {
  text-decoration: underline;
}

.system-waypoint-list-traits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
