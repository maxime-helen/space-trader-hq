<script setup lang="ts">
type BaseTabsProps = {
  tabs: { id: string; label: string }[];
};

const { tabs } = defineProps<BaseTabsProps>();

const model = defineModel<string>({ required: true });

const onSelect = (id: string) => {
  model.value = id;
};
</script>

<template>
  <div class="base-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="base-tabs-tab"
      :class="{ 'is-active': tab.id === model }"
      @click="onSelect(tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.base-tabs {
  display: flex;
  gap: var(--space-1);
  border-bottom: var(--border);
  width: 100%;
  overflow-x: auto;
}

.base-tabs-tab {
  font: inherit;
  font-size: var(--text-base);
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: var(--space-2) var(--space-4);
  color: var(--color-text-muted);
  white-space: nowrap;
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    border-bottom-color var(--duration-base) var(--ease-out);
}

.base-tabs-tab:hover {
  color: var(--color-text);
}

.base-tabs-tab.is-active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent);
}

.base-tabs-tab:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
