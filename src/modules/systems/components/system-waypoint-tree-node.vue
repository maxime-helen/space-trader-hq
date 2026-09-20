<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { WaypointNode } from '@/modules/systems/domain/waypoint-tree';
import { formatApiValue, formatCoordinates, formatNumber } from '@/shared/lib/format';
import { waypointPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';

// The node renders itself for each orbital. A component may import itself; spelling it out keeps
// the template's components all declared.
import SystemWaypointTreeNode from './system-waypoint-tree-node.vue';

const {
  node,
  systemSymbol,
  shipCounts,
  headquarters = '',
} = defineProps<{
  node: WaypointNode;
  systemSymbol: string;
  shipCounts: ReadonlyMap<string, number>;
  headquarters?: string;
}>();

const shipsHere = (symbol: string): number => shipCounts.get(symbol) ?? 0;
</script>

<template>
  <li class="waypoint-node">
    <details v-if="node.orbitals.length > 0" class="waypoint-node-details" open>
      <summary class="waypoint-node-row">
        <RouterLink class="waypoint-node-symbol" :to="waypointPath(systemSymbol, node.waypoint.symbol)">
          {{ node.waypoint.symbol }}
        </RouterLink>
        <BaseBadge>{{ formatApiValue(node.waypoint.type) }}</BaseBadge>
        <span class="waypoint-node-coordinates">{{ formatCoordinates(node.waypoint.x, node.waypoint.y) }}</span>
        <BaseBadge v-if="shipsHere(node.waypoint.symbol) > 0" variant="orbit">
          {{ formatNumber(shipsHere(node.waypoint.symbol)) }} here
        </BaseBadge>
        <BaseBadge v-if="node.waypoint.symbol === headquarters" variant="positive">HQ</BaseBadge>
        <span class="waypoint-node-count">{{ formatNumber(node.orbitals.length) }} in orbit</span>
      </summary>

      <ul class="waypoint-node-orbitals">
        <SystemWaypointTreeNode
          v-for="orbital in node.orbitals"
          :key="orbital.waypoint.symbol"
          :node="orbital"
          :system-symbol="systemSymbol"
          :ship-counts="shipCounts"
          :headquarters="headquarters"
        />
      </ul>
    </details>

    <div v-else class="waypoint-node-row is-leaf">
      <RouterLink class="waypoint-node-symbol" :to="waypointPath(systemSymbol, node.waypoint.symbol)">
        {{ node.waypoint.symbol }}
      </RouterLink>
      <BaseBadge>{{ formatApiValue(node.waypoint.type) }}</BaseBadge>
      <span class="waypoint-node-coordinates">{{ formatCoordinates(node.waypoint.x, node.waypoint.y) }}</span>
      <BaseBadge v-if="shipsHere(node.waypoint.symbol) > 0" variant="orbit">
        {{ formatNumber(shipsHere(node.waypoint.symbol)) }} here
      </BaseBadge>
      <BaseBadge v-if="node.waypoint.symbol === headquarters" variant="positive">HQ</BaseBadge>
    </div>
  </li>
</template>

<style scoped>
.waypoint-node {
  list-style: none;
}

.waypoint-node-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
}

.waypoint-node-row:hover {
  background: var(--color-row-hover);
}

.waypoint-node-row.is-leaf {
  padding-left: var(--space-5);
}

.waypoint-node-symbol {
  color: var(--color-accent);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

.waypoint-node-symbol:hover {
  text-decoration: underline;
}

.waypoint-node-coordinates,
.waypoint-node-count {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.waypoint-node-orbitals {
  margin: 0;
  padding: 0 0 0 var(--space-5);
  border-left: var(--border);
  margin-left: var(--space-4);
}
</style>
