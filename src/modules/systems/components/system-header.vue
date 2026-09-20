<script setup lang="ts">
import type { System } from '@/shared/api/types';
import { formatApiValue, formatCoordinates, formatNumber } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';

const { system, isHeadquarters } = defineProps<{ system: System; isHeadquarters?: boolean }>();
</script>

<template>
  <header class="system-header">
    <div class="system-header-title">
      <h1 class="system-header-name">{{ system.name ?? system.symbol }}</h1>
      <BaseBadge>{{ formatApiValue(system.type) }}</BaseBadge>
      <BaseBadge v-if="isHeadquarters" variant="positive">Headquarters</BaseBadge>
    </div>

    <dl class="system-header-facts">
      <div>
        <dt>Symbol</dt>
        <dd>{{ system.symbol }}</dd>
      </div>
      <div>
        <dt>Sector</dt>
        <dd>{{ system.sectorSymbol }}</dd>
      </div>
      <div v-if="system.constellation !== undefined">
        <dt>Constellation</dt>
        <dd>{{ system.constellation }}</dd>
      </div>
      <div>
        <dt>Coordinates</dt>
        <dd>{{ formatCoordinates(system.x, system.y) }}</dd>
      </div>
      <div>
        <dt>Waypoints</dt>
        <dd>{{ formatNumber(system.waypoints.length) }}</dd>
      </div>
      <div>
        <dt>Factions</dt>
        <dd>
          <template v-if="system.factions.length === 0">—</template>
          <span v-for="faction in system.factions" :key="faction.symbol" class="system-header-faction">
            {{ formatApiValue(faction.symbol) }}
          </span>
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.system-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.system-header-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.system-header-name {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-display);
}

.system-header-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  margin: 0;
}

.system-header-facts dt {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.system-header-facts dd {
  margin: var(--space-1) 0 0;
  font-size: var(--text-base);
}

.system-header-faction + .system-header-faction::before {
  content: ', ';
}
</style>
