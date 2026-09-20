<script setup lang="ts">
import { computed } from 'vue';

import { navStatusLabel, navStatusVariant } from '@/modules/fleet/domain/ship-metrics';
import type { ShipNavStatus } from '@/shared/api/types';
import BaseBadge from '@/shared/ui/base-badge.vue';

type ShipStatusBadgeProps = {
  status: ShipNavStatus;
};

const { status } = defineProps<ShipStatusBadgeProps>();

const variant = computed(() => navStatusVariant(status));
const label = computed(() => navStatusLabel(status));
</script>

<template>
  <BaseBadge class="ship-status-badge" :variant="variant">{{ label }}</BaseBadge>
</template>
