<script setup lang="ts">
import { computed } from 'vue';
import { type RouteLocationRaw, RouterLink } from 'vue-router';

import type { Waypoint } from '@/shared/api/types';
import { formatApiValue, formatCoordinates, formatDate } from '@/shared/lib/format';
import { systemPath, SYSTEMS_PATH, waypointPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import BaseBreadcrumbs from '@/shared/ui/base-breadcrumbs.vue';

type WaypointHeaderProps = {
  waypoint: Waypoint;
};

const { waypoint } = defineProps<WaypointHeaderProps>();

const systemLink = computed(() => systemPath(waypoint.systemSymbol));

const crumbs = computed<{ label: string; to?: RouteLocationRaw }[]>(() => {
  const parent = waypoint.orbits;
  return [
    { label: 'Systems', to: SYSTEMS_PATH },
    { label: waypoint.systemSymbol, to: systemLink.value },
    ...(parent === undefined ? [] : [{ label: parent, to: waypointPath(waypoint.systemSymbol, parent) }]),
    { label: waypoint.symbol },
  ];
});

const isUncharted = computed(() => waypoint.chart === undefined);

const factionLabel = computed(() =>
  waypoint.faction === undefined ? 'Uncontrolled' : formatApiValue(waypoint.faction.symbol),
);

const chartLabel = computed(() => {
  const chart = waypoint.chart;
  if (chart === undefined) return 'Not charted';
  const by = chart.submittedBy === undefined ? '' : ` by ${chart.submittedBy}`;
  const on = chart.submittedOn === undefined ? '' : ` · ${formatDate(chart.submittedOn)}`;
  return `Charted${by}${on}`;
});
</script>

<template>
  <header class="waypoint-header">
    <BaseBreadcrumbs :items="crumbs" />

    <div class="waypoint-header-identity">
      <h1 class="waypoint-header-symbol">{{ waypoint.symbol }}</h1>
      <BaseBadge>{{ formatApiValue(waypoint.type) }}</BaseBadge>
      <BaseBadge v-if="waypoint.isUnderConstruction" variant="transit">Under construction</BaseBadge>
      <BaseBadge v-if="isUncharted" variant="danger">Uncharted</BaseBadge>
    </div>

    <dl class="waypoint-header-facts">
      <div class="waypoint-header-fact">
        <dt>Coordinates</dt>
        <dd>{{ formatCoordinates(waypoint.x, waypoint.y) }}</dd>
      </div>
      <div class="waypoint-header-fact">
        <dt>Faction</dt>
        <dd>{{ factionLabel }}</dd>
      </div>
      <div class="waypoint-header-fact">
        <dt>Chart</dt>
        <dd>{{ chartLabel }}</dd>
      </div>
      <div class="waypoint-header-fact">
        <dt>System</dt>
        <dd>
          <RouterLink :to="systemLink">{{ waypoint.systemSymbol }}</RouterLink>
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.waypoint-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.waypoint-header-identity {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.waypoint-header-symbol {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.waypoint-header-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin: 0;
}

.waypoint-header-fact dt {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.waypoint-header-fact dd {
  margin: var(--space-1) 0 0;
  font-size: var(--text-base);
}
</style>
