<script setup lang="ts">
import { computed } from 'vue';

import { formatCredits } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';

type CreditsAmountProps = {
  credits: number;
  badge?: boolean;
  size?: 'inline' | 'display';
};

const { credits, badge, size = 'inline' } = defineProps<CreditsAmountProps>();

const negative = computed(() => credits < 0);
</script>

<template>
  <span class="credits-amount" :class="[size, { 'is-negative': negative }]">
    <span class="credits-amount-value">{{ formatCredits(credits) }}</span>
    <BaseBadge v-if="badge && negative" variant="danger">Negative balance</BaseBadge>
  </span>
</template>

<style scoped>
.credits-amount {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-variant-numeric: tabular-nums;
}

.credits-amount-value {
  white-space: nowrap;
}

.credits-amount.display .credits-amount-value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.credits-amount.is-negative .credits-amount-value {
  color: var(--color-danger);
}
</style>
