<script setup lang="ts">
import { computed } from 'vue';

import type { Ship } from '@/shared/api/types';
import { formatApiValue, formatCredits } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/base-card.vue';
import BaseMeter from '@/shared/ui/base-meter.vue';

type ShipCrewTabProps = {
  ship: Ship;
};

const { ship } = defineProps<ShipCrewTabProps>();

const MORALE_MAX = 100;

const crew = computed(() => ship.crew);

const wages = computed(() => `${formatCredits(crew.value.wages)} per crew member`);
</script>

<template>
  <BaseCard class="ship-crew-tab">
    <template #title>Crew</template>

    <dl class="ship-crew-rows">
      <div class="ship-crew-row">
        <dt>Current</dt>
        <dd class="ship-crew-number">{{ crew.current }}</dd>
      </div>
      <div class="ship-crew-row">
        <dt>Required</dt>
        <dd class="ship-crew-number">{{ crew.required }}</dd>
      </div>
      <div class="ship-crew-row">
        <dt>Capacity</dt>
        <dd class="ship-crew-number">{{ crew.capacity }}</dd>
      </div>
      <div class="ship-crew-row">
        <dt>Rotation</dt>
        <dd>{{ formatApiValue(crew.rotation) }}</dd>
      </div>
      <div class="ship-crew-row">
        <dt>Wages</dt>
        <dd class="ship-crew-wages ship-crew-number">{{ wages }}</dd>
      </div>
    </dl>

    <BaseMeter class="ship-crew-morale" label="Morale" :value="crew.morale" :max="MORALE_MAX">
      <template #value="{ percent }">{{ percent }}%</template>
    </BaseMeter>
  </BaseCard>
</template>

<style scoped>
.ship-crew-tab {
  max-width: 30rem;
}

.ship-crew-rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-5);
  margin: 0;
}

.ship-crew-row {
  display: contents;
}

.ship-crew-row dt {
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.ship-crew-row dd {
  margin: 0;
  font-size: var(--text-md);
  min-width: 0;
}

.ship-crew-number {
  font-variant-numeric: tabular-nums;
}

.ship-crew-morale {
  margin-top: var(--space-4);
}
</style>
