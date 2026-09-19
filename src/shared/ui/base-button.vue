<script setup lang="ts">
type BaseButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

const { variant = 'secondary', loading, disabled } = defineProps<BaseButtonProps>();

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <button class="base-button" :class="variant" type="button" :disabled="disabled || loading" @click="onClick">
    <span v-if="loading" class="base-button-spinner"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  font: inherit;
  font-size: var(--text-base);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-control);
  border: var(--border);
  background: var(--color-surface-raised);
  color: var(--color-text);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.base-button:hover {
  border-color: var(--color-text-muted);
}

.base-button:active {
  background: var(--color-line);
}

.base-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.base-button.primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-semibold);
}

.base-button.primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.base-button.primary:active {
  filter: brightness(0.92);
}

.base-button.danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: var(--color-on-accent);
  font-weight: var(--weight-semibold);
}

.base-button.danger:hover {
  border-color: var(--color-text);
}

.base-button.danger:active {
  filter: brightness(0.92);
}

.base-button[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

.base-button-spinner {
  width: 0.9em;
  height: 0.9em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
  opacity: 0.85;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
