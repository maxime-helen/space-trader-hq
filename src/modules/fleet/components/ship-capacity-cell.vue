<script setup lang="ts">
import { formatNumber } from '@/shared/lib/format';
import BaseMeter from '@/shared/ui/base-meter.vue';

type ShipCapacityCellProps = {
  ratio: number | null;
  value: number;
  max: number;
  emptyLabel: string;
};

const { ratio, value, max, emptyLabel } = defineProps<ShipCapacityCellProps>();
</script>

<template>
  <span v-if="ratio === null" class="ship-capacity-empty">{{ emptyLabel }}</span>
  <BaseMeter v-else class="ship-capacity" :value="value" :max="max">
    <template #value>{{ formatNumber(value) }} / {{ formatNumber(max) }}</template>
  </BaseMeter>
</template>

<style scoped>
.ship-capacity {
  min-width: 7rem;
}

.ship-capacity-empty {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
