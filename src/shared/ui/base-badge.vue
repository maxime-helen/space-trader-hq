<script setup lang="ts">
type BaseBadgeProps = {
  variant?: 'docked' | 'orbit' | 'transit' | 'neutral' | 'danger' | 'positive';
};

const { variant = 'neutral' } = defineProps<BaseBadgeProps>();
</script>

<template>
  <span class="base-badge" :class="variant"><slot /></span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-xs);
  line-height: 1.6;
  padding: 0 var(--space-2);
  border-radius: var(--radius-badge);
  border: var(--border);
  color: var(--color-text);
  white-space: nowrap;
}

.base-badge::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--dot, var(--color-text-muted));
}

.base-badge.neutral::before {
  display: none;
}

.base-badge.docked {
  --dot: var(--status-docked);
}

.base-badge.orbit {
  --dot: var(--status-orbit);
}

.base-badge.transit {
  --dot: var(--status-transit);
}

.base-badge.danger {
  --dot: var(--color-danger);
}

.base-badge.positive {
  --dot: var(--color-positive);
}
</style>
