<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <main class="not-found">
    <p class="not-found-brand">SpaceTradersHQ</p>
    <h1 class="not-found-title">Page not found</h1>
    <p class="not-found-detail">There's nothing at this address.</p>
    <RouterLink class="not-found-link" to="/">Go to your agent</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--space-3);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-7) var(--space-5);
  background: var(--color-bg);
  color: var(--color-text);
}

.not-found-brand {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.not-found-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.not-found-detail {
  margin: 0;
  color: var(--color-text-muted);
}

.not-found-link {
  color: var(--color-accent);
}
</style>
