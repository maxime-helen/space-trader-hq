<script setup lang="ts">
import { computed } from 'vue';

import type { Ship, ShipModule, ShipMount } from '@/shared/api/types';
import BaseCard from '@/shared/ui/base-card.vue';
import BaseMeter from '@/shared/ui/base-meter.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

type ShipModulesTabProps = {
  ship: Ship;
};

const { ship } = defineProps<ShipModulesTabProps>();

type FittedComponent = {
  kind: string;
  name: string;
  description: string;
  condition: number;
  integrity: number;
  quality: number;
  stat?: { label: string; value: number };
};

const optional = (value: number | undefined): string => (value === undefined ? '—' : String(value));

const MODULE_COLUMNS: readonly DataTableColumn<ShipModule>[] = [
  { key: 'name', label: 'Name' },
  { key: 'capacity', label: 'Capacity', numeric: true, value: (row) => optional(row.capacity) },
  { key: 'range', label: 'Range', numeric: true, value: (row) => optional(row.range) },
  { key: 'power', label: 'Power', numeric: true, value: (row) => optional(row.requirements.power) },
  { key: 'crew', label: 'Crew', numeric: true, value: (row) => optional(row.requirements.crew) },
  { key: 'slots', label: 'Slots', numeric: true, value: (row) => optional(row.requirements.slots) },
];

const MOUNT_COLUMNS: readonly DataTableColumn<ShipMount>[] = [
  { key: 'name', label: 'Name' },
  { key: 'strength', label: 'Strength', numeric: true, value: (row) => optional(row.strength) },
  { key: 'power', label: 'Power', numeric: true, value: (row) => optional(row.requirements.power) },
  { key: 'crew', label: 'Crew', numeric: true, value: (row) => optional(row.requirements.crew) },
  { key: 'slots', label: 'Slots', numeric: true, value: (row) => optional(row.requirements.slots) },
];

const fitted = computed<FittedComponent[]>(() => [
  {
    kind: 'Frame',
    name: ship.frame.name,
    description: ship.frame.description,
    condition: ship.frame.condition,
    integrity: ship.frame.integrity,
    quality: ship.frame.quality,
  },
  {
    kind: 'Reactor',
    name: ship.reactor.name,
    description: ship.reactor.description,
    condition: ship.reactor.condition,
    integrity: ship.reactor.integrity,
    quality: ship.reactor.quality,
    stat: { label: 'Power output', value: ship.reactor.powerOutput },
  },
  {
    kind: 'Engine',
    name: ship.engine.name,
    description: ship.engine.description,
    condition: ship.engine.condition,
    integrity: ship.engine.integrity,
    quality: ship.engine.quality,
    stat: { label: 'Speed', value: ship.engine.speed },
  },
]);

const modules = computed(() => ship.modules);

const mounts = computed(() => ship.mounts);
</script>

<template>
  <div class="ship-modules-tab">
    <div class="ship-modules-components">
      <BaseCard v-for="component in fitted" :key="component.kind" class="ship-modules-component">
        <template #title>{{ component.kind }}</template>
        <template #aside>
          <span class="ship-modules-component-name">{{ component.name }}</span>
        </template>

        <BaseMeter class="ship-modules-meter" label="Condition" :value="component.condition" :max="1">
          <template #value="{ percent }">{{ percent }}%</template>
        </BaseMeter>
        <BaseMeter class="ship-modules-meter" label="Integrity" :value="component.integrity" :max="1">
          <template #value="{ percent }">{{ percent }}%</template>
        </BaseMeter>

        <dl class="ship-modules-stats">
          <div class="ship-modules-stat">
            <dt>Quality</dt>
            <dd>{{ component.quality }}</dd>
          </div>
          <div v-if="component.stat !== undefined" class="ship-modules-stat">
            <dt>{{ component.stat.label }}</dt>
            <dd>{{ component.stat.value }}</dd>
          </div>
        </dl>

        <details class="ship-modules-description">
          <summary>Description</summary>
          <p>{{ component.description }}</p>
        </details>
      </BaseCard>
    </div>

    <h2 class="ship-modules-heading">Modules</h2>
    <p v-if="modules.length === 0" class="ship-modules-empty">This ship has no modules.</p>
    <BaseCard v-else flush>
      <DataTable
        :columns="MODULE_COLUMNS"
        :rows="modules"
        :row-key="(row: ShipModule, index) => `${row.symbol}-${index}`"
      />
    </BaseCard>

    <h2 class="ship-modules-heading">Mounts</h2>
    <p v-if="mounts.length === 0" class="ship-modules-empty">This ship has no mounts.</p>
    <BaseCard v-else flush>
      <DataTable
        :columns="MOUNT_COLUMNS"
        :rows="mounts"
        :row-key="(row: ShipMount, index) => `${row.symbol}-${index}`"
      />
    </BaseCard>
  </div>
</template>

<style scoped>
.ship-modules-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ship-modules-components {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  align-items: start;
  gap: var(--space-4);
}

.ship-modules-component-name {
  color: var(--color-text-muted);
  font-size: var(--text-md);
  font-weight: var(--weight-regular);
}

.ship-modules-meter + .ship-modules-meter {
  margin-top: var(--space-3);
}

.ship-modules-stats {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-5);
  margin: var(--space-4) 0 0;
  font-size: var(--text-md);
}

.ship-modules-stat {
  display: contents;
}

.ship-modules-stat dt {
  color: var(--color-text-muted);
}

.ship-modules-stat dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.ship-modules-description {
  margin-top: var(--space-3);
  font-size: var(--text-md);
}

.ship-modules-description summary {
  color: var(--color-text-muted);
  cursor: pointer;
}

.ship-modules-description p {
  margin: var(--space-1) 0 0;
}

.ship-modules-heading {
  margin: var(--space-2) 0 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.ship-modules-empty {
  margin: 0;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-5);
  text-align: center;
  color: var(--color-text-muted);
}
</style>
