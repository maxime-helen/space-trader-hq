<script setup lang="ts">
import type { WaypointNode } from '@/modules/systems/domain/waypoint-tree';

import SystemWaypointTreeNode from './system-waypoint-tree-node.vue';

const {
  nodes,
  systemSymbol,
  shipCounts,
  headquarters = '',
} = defineProps<{
  nodes: readonly WaypointNode[];
  systemSymbol: string;
  shipCounts: ReadonlyMap<string, number>;
  headquarters?: string;
}>();
</script>

<template>
  <ul class="waypoint-tree">
    <SystemWaypointTreeNode
      v-for="node in nodes"
      :key="node.waypoint.symbol"
      :node="node"
      :system-symbol="systemSymbol"
      :ship-counts="shipCounts"
      :headquarters="headquarters"
    />
  </ul>
</template>

<style scoped>
.waypoint-tree {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
