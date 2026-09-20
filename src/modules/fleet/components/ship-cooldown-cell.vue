<script setup lang="ts">
import { computed } from 'vue';

import { cooldownEndsAt } from '@/modules/fleet/domain/ship-metrics';
import type { Cooldown } from '@/shared/api/types';
import { formatCooldown } from '@/shared/lib/format';

type ShipCooldownCellProps = {
  cooldown: Cooldown | null | undefined;
  now: number;
};

const { cooldown, now } = defineProps<ShipCooldownCellProps>();

const endsAt = computed(() => cooldownEndsAt(cooldown, now));
const label = computed(() => formatCooldown(endsAt.value, now));
</script>

<template>
  <span class="ship-cooldown" :class="{ 'is-ready': endsAt === null }">{{ label }}</span>
</template>

<style scoped>
.ship-cooldown {
  font-variant-numeric: tabular-nums;
}

.ship-cooldown.is-ready {
  color: var(--color-text-muted);
}
</style>
