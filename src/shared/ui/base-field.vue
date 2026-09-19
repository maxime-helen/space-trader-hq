<script setup lang="ts">
import { computed } from 'vue';

type BaseFieldProps = {
  variant?: 'input' | 'textarea';
  label?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
};

defineOptions({ inheritAttrs: false });

const { variant = 'input', label = '', error = '', invalid, disabled } = defineProps<BaseFieldProps>();

const model = defineModel<string>({ default: '' });

const isInvalid = computed(() => invalid || error.length > 0);
</script>

<template>
  <label class="base-field">
    <span v-if="label.length > 0" class="base-field-label">{{ label }}</span>
    <textarea
      v-if="variant === 'textarea'"
      v-model="model"
      class="base-field-control"
      :class="{ 'is-invalid': isInvalid }"
      :disabled="disabled"
      v-bind="$attrs"
    ></textarea>
    <input
      v-else
      v-model="model"
      class="base-field-control"
      :class="{ 'is-invalid': isInvalid }"
      :disabled="disabled"
      v-bind="$attrs"
    />
    <span v-if="error.length > 0" class="base-field-error">{{ error }}</span>
  </label>
</template>

<style scoped>
.base-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

.base-field-label {
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.base-field-control {
  font: inherit;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-control);
  border: var(--border);
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.base-field-control::placeholder {
  color: var(--color-text-muted);
}

.base-field-control:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.base-field-control.is-invalid {
  border-color: var(--color-danger);
}

.base-field-control[disabled] {
  opacity: 0.45;
}

.base-field-error {
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
