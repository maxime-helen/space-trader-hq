<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { SYSTEMS_PATH } from '@/shared/lib/paths';

const { symbol } = defineProps<{ symbol: string }>();
</script>

<template>
  <div class="system-not-found">
    <h1 class="system-not-found-title">There's no system {{ symbol }}.</h1>
    <p class="system-not-found-message">Check the symbol, or browse the list.</p>
    <RouterLink class="system-not-found-link" :to="SYSTEMS_PATH">Browse systems</RouterLink>
  </div>
</template>

<style scoped>
.system-not-found {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-6) 0;
}

.system-not-found-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.system-not-found-message {
  margin: 0;
  color: var(--color-text-muted);
}

.system-not-found-link {
  color: var(--color-accent);
}
</style>
