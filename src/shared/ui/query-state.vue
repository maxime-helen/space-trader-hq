<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from './base-button.vue';
import BaseSpinner from './base-spinner.vue';

type QueryStateProps = {
  hasData: boolean;
  fetching?: boolean;
  error?: boolean;
  empty?: boolean;
  errorTitle: string;
  errorMessage?: string;
  emptyMessage?: string;
  retry: () => unknown;
};

const {
  hasData,
  fetching,
  error,
  empty,
  errorTitle,
  errorMessage = "The SpaceTraders API didn't respond. Check your connection, then try again.",
  emptyMessage = 'There is nothing to show here.',
  retry,
} = defineProps<QueryStateProps>();

const showError = computed(() => error && !hasData);

const showFirstLoad = computed(() => !hasData && !error);

const showSpinner = computed(() => fetching && hasData);

const onRetry = () => {
  void retry();
};
</script>

<template>
  <div class="query-state">
    <div v-if="showError" class="query-state-error">
      <strong>{{ errorTitle }}</strong>
      <p>{{ errorMessage }}</p>
      <BaseButton @click="onRetry">Try again</BaseButton>
    </div>

    <div v-else-if="showFirstLoad" class="query-state-meta">
      <BaseSpinner />
    </div>

    <template v-else>
      <div v-if="showSpinner" class="query-state-meta">
        <BaseSpinner />
      </div>

      <div v-if="empty" class="query-state-empty">
        <slot name="empty">{{ emptyMessage }}</slot>
      </div>
      <slot v-else />
    </template>
  </div>
</template>

<style scoped>
.query-state {
  width: 100%;
  min-width: 0;
}

.query-state-meta {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-2);
  color: var(--color-text-muted);
}

.query-state-empty {
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-5);
  text-align: center;
  color: var(--color-text-muted);
  width: 100%;
}

.query-state-error {
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  width: 100%;
}

.query-state-error strong {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
}

.query-state-error p {
  margin: var(--space-1) 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-md);
}
</style>
