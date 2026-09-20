<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { systemPath, SYSTEMS_PATH } from '@/shared/lib/paths';

type WaypointNotFoundProps = {
  systemSymbol: string;
  waypointSymbol: string;
};

const { systemSymbol, waypointSymbol } = defineProps<WaypointNotFoundProps>();
</script>

<template>
  <section class="waypoint-not-found">
    <h1 class="waypoint-not-found-title">Waypoint not found</h1>
    <p class="waypoint-not-found-detail">
      There's no waypoint {{ waypointSymbol }}. Check the symbol, or browse the system below.
    </p>
    <p class="waypoint-not-found-links">
      <RouterLink :to="systemPath(systemSymbol)">{{ systemSymbol }}</RouterLink>
      <RouterLink :to="SYSTEMS_PATH">All systems</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.waypoint-not-found {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.waypoint-not-found-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
}

.waypoint-not-found-detail {
  margin: 0;
  color: var(--color-text-muted);
}

.waypoint-not-found-links {
  display: flex;
  gap: var(--space-4);
  margin: 0;
}

.waypoint-not-found-links a {
  color: var(--color-accent);
}
</style>
