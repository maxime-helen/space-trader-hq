<script setup lang="ts">
import type { WaypointModifier, WaypointTrait } from '@/shared/api/types';
import BaseCard from '@/shared/ui/base-card.vue';

type WaypointTraitsProps = {
  traits: WaypointTrait[];
  modifiers?: WaypointModifier[];
};

const { traits, modifiers = [] } = defineProps<WaypointTraitsProps>();
</script>

<template>
  <div class="waypoint-traits">
    <section>
      <h2 class="waypoint-traits-title">Traits</h2>
      <p v-if="traits.length === 0" class="waypoint-traits-empty">This waypoint has no traits.</p>
      <ul v-else class="waypoint-traits-list">
        <li v-for="trait in traits" :key="trait.symbol" class="waypoint-traits-item">
          <BaseCard>
            <template #title>{{ trait.name }}</template>
            <p class="waypoint-traits-description">{{ trait.description }}</p>
          </BaseCard>
        </li>
      </ul>
    </section>

    <section v-if="modifiers.length > 0" class="waypoint-traits-modifiers">
      <h2 class="waypoint-traits-title">Modifiers</h2>
      <ul class="waypoint-traits-list">
        <li v-for="modifier in modifiers" :key="modifier.symbol" class="waypoint-traits-item">
          <BaseCard>
            <template #title>{{ modifier.name }}</template>
            <p class="waypoint-traits-description">{{ modifier.description }}</p>
          </BaseCard>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.waypoint-traits {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.waypoint-traits-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.waypoint-traits-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.waypoint-traits-item {
  display: flex;
}

.waypoint-traits-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.waypoint-traits-empty {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
