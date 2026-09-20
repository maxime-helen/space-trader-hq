<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { WaypointOrbital } from '@/shared/api/types';
import { waypointPath } from '@/shared/lib/paths';

type WaypointLinksProps = {
  systemSymbol: string;
  orbits?: string;
  orbitals: WaypointOrbital[];
};

const { systemSymbol, orbits = '', orbitals } = defineProps<WaypointLinksProps>();

const linkTo = (symbol: string): string => waypointPath(systemSymbol, symbol);

const hasNeighbours = computed(() => orbits !== '' || orbitals.length > 0);
</script>

<template>
  <section class="waypoint-links">
    <h2 class="waypoint-links-title">Orbit</h2>

    <p v-if="!hasNeighbours" class="waypoint-links-empty">Nothing orbits this waypoint.</p>

    <template v-else>
      <p v-if="orbits !== ''" class="waypoint-links-parent">
        Orbits
        <RouterLink class="waypoint-links-link" :to="linkTo(orbits)">{{ orbits }}</RouterLink>
      </p>

      <template v-if="orbitals.length > 0">
        <h3 class="waypoint-links-subtitle">Orbitals</h3>
        <ul class="waypoint-links-list">
          <li v-for="orbital in orbitals" :key="orbital.symbol">
            <RouterLink class="waypoint-links-link" :to="linkTo(orbital.symbol)">
              {{ orbital.symbol }}
            </RouterLink>
          </li>
        </ul>
      </template>
    </template>
  </section>
</template>

<style scoped>
.waypoint-links-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.waypoint-links-subtitle {
  margin: var(--space-4) 0 var(--space-2);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.waypoint-links-parent {
  margin: 0;
  color: var(--color-text-muted);
}

.waypoint-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.waypoint-links-link {
  color: var(--color-accent);
}

.waypoint-links-empty {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
