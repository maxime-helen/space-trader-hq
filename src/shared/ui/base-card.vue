<script setup lang="ts">
type BaseCardProps = {
  flush?: boolean;
};

const { flush } = defineProps<BaseCardProps>();
</script>

<template>
  <div class="base-card" :class="{ 'is-flush': flush }">
    <h4 v-if="$slots.title" class="base-card-title">
      <slot name="title" />
      <slot name="aside" />
    </h4>
    <slot />
  </div>
</template>

<style scoped>
.base-card {
  background: var(--color-surface);
  border: var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  min-width: 0;
  width: 100%;
}

.base-card.is-flush {
  padding: 0;
}

.base-card-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: baseline;
}
</style>
