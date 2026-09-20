<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { isArriving, needsSystemLink } from '@/modules/fleet/domain/ship-metrics';
import type { ShipNav } from '@/shared/api/types';
import { formatEta } from '@/shared/lib/format';
import { systemPath, waypointPath } from '@/shared/lib/paths';
import BaseSpinner from '@/shared/ui/base-spinner.vue';

type ShipLocationCellProps = {
  nav: ShipNav;
  now: number;
  homeSystemSymbol: string | undefined;
};

const { nav, now, homeSystemSymbol } = defineProps<ShipLocationCellProps>();

const inTransit = computed(() => nav.status === 'IN_TRANSIT');
const arriving = computed(() => isArriving(nav.status, nav.route, now));

const destination = computed(() => nav.route.destination);
const destinationPath = computed(() => waypointPath(destination.value.systemSymbol, destination.value.symbol));
const eta = computed(() => formatEta(nav.route.arrival, now));

const currentPath = computed(() => waypointPath(nav.systemSymbol, nav.waypointSymbol));
const showSystem = computed(() => needsSystemLink(nav.systemSymbol, homeSystemSymbol));
</script>

<template>
  <div class="ship-location">
    <template v-if="inTransit">
      <span v-if="arriving" class="ship-location-arriving">
        <BaseSpinner class="ship-location-spinner" />
        Arriving
      </span>
      <template v-else>
        <span class="ship-location-destination">
          <span class="ship-location-arrow">→</span>
          <RouterLink :to="destinationPath">{{ destination.symbol }}</RouterLink>
        </span>
        <span class="ship-location-eta">{{ eta }}</span>
      </template>
    </template>

    <template v-else>
      <RouterLink :to="currentPath">{{ nav.waypointSymbol }}</RouterLink>
      <span v-if="showSystem" class="ship-location-system">
        in <RouterLink :to="systemPath(nav.systemSymbol)">{{ nav.systemSymbol }}</RouterLink>
      </span>
    </template>
  </div>
</template>

<style scoped>
.ship-location {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ship-location-destination {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-1);
}

.ship-location-arrow {
  color: var(--color-text-muted);
}

.ship-location-eta,
.ship-location-system {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ship-location-arriving {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
}
</style>
