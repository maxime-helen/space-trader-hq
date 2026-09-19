<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import BaseButton from '@/shared/ui/base-button.vue';

const error = ref<Error | null>(null);
const route = useRoute();

onErrorCaptured((caught: unknown) => {
  error.value = caught instanceof Error ? caught : new Error(String(caught));
  return false;
});

watch(
  () => route.path,
  () => {
    error.value = null;
  },
);

const retry = (): void => {
  error.value = null;
};
</script>

<template>
  <section v-if="error" class="route-error">
    <h1 class="route-error-title">This page didn't load</h1>
    <p class="route-error-detail">Something went wrong while rendering it.</p>
    <p class="route-error-message">{{ error.message }}</p>
    <BaseButton variant="primary" @click="retry">Try again</BaseButton>
  </section>
  <slot v-else />
</template>

<style scoped>
.route-error {
  border: var(--border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  padding: var(--space-5);
  max-width: 34rem;
}

.route-error-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.route-error-detail {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
}

.route-error-message {
  margin: 0 0 var(--space-4);
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
