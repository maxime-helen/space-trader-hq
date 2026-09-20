<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { Ship, ShipNavStatus } from '@/shared/api/types';
import { formatApiValue } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';

type WaypointShipsPresentProps = {
  ships: Ship[];
};

const { ships } = defineProps<WaypointShipsPresentProps>();

const BADGE_VARIANT: Record<ShipNavStatus, 'docked' | 'orbit' | 'transit'> = {
  DOCKED: 'docked',
  IN_ORBIT: 'orbit',
  IN_TRANSIT: 'transit',
};
</script>

<template>
  <div class="waypoint-ships">
    <p v-if="ships.length === 0" class="waypoint-ships-empty">None of your ships are here.</p>
    <ul v-else class="waypoint-ships-list">
      <li v-for="ship in ships" :key="ship.symbol" class="waypoint-ships-item">
        <RouterLink class="waypoint-ships-link" :to="`/fleet/${ship.symbol}`">{{ ship.symbol }}</RouterLink>
        <BaseBadge :variant="BADGE_VARIANT[ship.nav.status]">{{ formatApiValue(ship.nav.status) }}</BaseBadge>
        <span class="waypoint-ships-role">{{ formatApiValue(ship.registration.role) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.waypoint-ships-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.waypoint-ships-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.waypoint-ships-link {
  color: var(--color-accent);
}

.waypoint-ships-role {
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.waypoint-ships-empty {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
