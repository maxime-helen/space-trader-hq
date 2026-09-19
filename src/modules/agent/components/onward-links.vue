<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { ONWARD_LINKS } from '@/modules/agent/domain/onward-links';
import BaseCard from '@/shared/ui/base-card.vue';
</script>

<template>
  <nav class="onward-links">
    <RouterLink v-for="link in ONWARD_LINKS" :key="link.to" class="onward-link" :to="link.to">
      <BaseCard>
        <template #title>{{ link.label }}</template>
        <p class="onward-link-description">{{ link.description }}</p>
      </BaseCard>
    </RouterLink>
  </nav>
</template>

<style scoped>
.onward-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}

.onward-link {
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-card);
}

.onward-link :deep(.base-card) {
  height: 100%;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.onward-link:hover :deep(.base-card) {
  border-color: var(--color-accent);
}

.onward-link:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.onward-link-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}
</style>
