<script setup lang="ts">
import { computed } from 'vue';

type BaseMeterProps = {
  value: number;
  max: number;
  label?: string;
};

const { value, max, label = '' } = defineProps<BaseMeterProps>();

defineSlots<{
  value?: (props: { value: number; max: number; percent: number }) => unknown;
  empty?: () => unknown;
}>();

const hasCapacity = computed(() => max > 0);

const clampedValue = computed(() => Math.min(Math.max(value, 0), Math.max(max, 0)));

const percent = computed(() => (max > 0 ? Math.round((clampedValue.value / max) * 100) : 0));

defineExpose({ percent });
</script>

<template>
  <div class="base-meter">
    <template v-if="hasCapacity">
      <meter class="base-meter-gauge" min="0" :max="max" :value="clampedValue" />
      <span class="base-meter-label">
        <span class="base-meter-caption">{{ label }}</span>
        <span class="base-meter-value">
          <slot name="value" :value="value" :max="max" :percent="percent">{{ value }} / {{ max }}</slot>
        </span>
      </span>
    </template>
    <span v-else class="base-meter-empty"><slot name="empty" /></span>
  </div>
</template>

<style scoped>
.base-meter {
  width: 100%;
  min-width: 0;
}

.base-meter-gauge {
  display: block;
  width: 100%;
  height: 0.5rem;
  appearance: none;
  border: var(--border);
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
  overflow: hidden;
}

.base-meter-gauge::-webkit-meter-bar {
  height: 100%;
  border: 0;
  border-radius: inherit;
  background: var(--color-surface-raised);
}

.base-meter-gauge::-webkit-meter-optimum-value,
.base-meter-gauge::-webkit-meter-suboptimum-value,
.base-meter-gauge::-webkit-meter-even-less-good-value {
  border-radius: inherit;
  background: var(--color-accent);
}

.base-meter-gauge::-moz-meter-bar {
  border-radius: inherit;
  background: var(--color-accent);
}

.base-meter-label {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: var(--text-sm);
}

.base-meter-caption {
  color: var(--color-text-muted);
}

.base-meter-value {
  font-variant-numeric: tabular-nums;
}

.base-meter-empty {
  display: inline-block;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
