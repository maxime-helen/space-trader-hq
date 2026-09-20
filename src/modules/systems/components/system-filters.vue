<script setup lang="ts">
import { computed } from 'vue';

import { FILTERABLE_TRAITS } from '@/modules/systems/domain/filters';
import type { WaypointTraitSymbol, WaypointType } from '@/shared/api/types';
import { formatApiValue } from '@/shared/lib/format';

const { availableTypes } = defineProps<{ availableTypes: readonly WaypointType[] }>();

const type = defineModel<WaypointType | ''>('type', { required: true });
const traits = defineModel<WaypointTraitSymbol[]>('traits', { required: true });

const hasFilters = computed(() => type.value !== '' || traits.value.length > 0);

const isSelected = (trait: WaypointTraitSymbol): boolean => traits.value.includes(trait);

const toggleTrait = (trait: WaypointTraitSymbol) => {
  const selected = new Set(traits.value);
  if (selected.has(trait)) selected.delete(trait);
  else selected.add(trait);
  traits.value = FILTERABLE_TRAITS.filter((candidate) => selected.has(candidate));
};

const clear = () => {
  type.value = '';
  traits.value = [];
};
</script>

<template>
  <div class="system-filters">
    <div class="system-filters-group">
      <label class="system-filters-label" for="waypoint-type-filter">Type</label>
      <select id="waypoint-type-filter" v-model="type" class="system-filters-select">
        <option value="">All types</option>
        <option v-for="option in availableTypes" :key="option" :value="option">{{ formatApiValue(option) }}</option>
      </select>
    </div>

    <div class="system-filters-group">
      <span class="system-filters-label">Traits</span>
      <div class="system-filters-traits">
        <label v-for="trait in FILTERABLE_TRAITS" :key="trait" class="system-filters-trait">
          <input type="checkbox" :value="trait" :checked="isSelected(trait)" @change="toggleTrait(trait)" />
          {{ formatApiValue(trait) }}
        </label>
      </div>
    </div>

    <button v-if="hasFilters" type="button" class="system-filters-clear" @click="clear">Clear filters</button>
  </div>
</template>

<style scoped>
.system-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: var(--space-5);
  padding: var(--space-4);
  border: var(--border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.system-filters-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.system-filters-label {
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.system-filters-select {
  font: inherit;
  font-size: var(--text-base);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
  border: var(--border);
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.system-filters-traits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  max-width: 44rem;
}

.system-filters-trait {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
}

.system-filters-clear {
  font: inherit;
  font-size: var(--text-md);
  margin-left: auto;
  align-self: center;
  background: none;
  border: var(--border);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  cursor: pointer;
}
</style>
