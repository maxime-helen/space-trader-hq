<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from 'vue-router';

import type { ToastBadgeVariant } from '@/shared/composables/use-toasts';

import BaseBadge from './base-badge.vue';

type BaseToastProps = {
  badge?: string | undefined;
  badgeVariant?: ToastBadgeVariant | undefined;
  subject?: string | undefined;
  message: string;
  actionLabel?: string | undefined;
  actionTo?: RouteLocationRaw | undefined;
};

const {
  badge = '',
  badgeVariant = 'neutral',
  subject = '',
  actionLabel = '',
  actionTo = '',
} = defineProps<BaseToastProps>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <div class="base-toast">
    <BaseBadge v-if="badge !== ''" :variant="badgeVariant">{{ badge }}</BaseBadge>
    <div class="base-toast-body">
      <p class="base-toast-message">
        <strong v-if="subject !== ''">{{ subject }}</strong> {{ message }}
      </p>
      <RouterLink v-if="actionLabel !== ''" class="base-toast-action" :to="actionTo">{{ actionLabel }}</RouterLink>
    </div>
    <button class="base-toast-close" type="button" aria-label="Dismiss" @click="emit('dismiss')">×</button>
  </div>
</template>

<style scoped>
.base-toast {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  width: 100%;
  max-width: 22rem;
  background: var(--color-surface);
  border: var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  font-size: var(--text-md);
  color: var(--color-text);
}

.base-toast-body {
  flex: 1;
  min-width: 0;
}

.base-toast-message {
  margin: 0;
}

.base-toast-message strong {
  font-weight: var(--weight-semibold);
}

.base-toast-action {
  display: inline-block;
  margin-top: var(--space-1);
  color: var(--color-accent);
}

.base-toast-action:hover {
  color: var(--color-accent-hover);
}

.base-toast-close {
  font: inherit;
  background: none;
  border: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--text-lg);
  line-height: 1;
  padding: 0 var(--space-1);
}

.base-toast-close:hover {
  color: var(--color-text);
}
</style>
