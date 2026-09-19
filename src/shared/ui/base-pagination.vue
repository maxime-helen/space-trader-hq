<script lang="ts">
type PaginationItem = { kind: 'page'; key: string; page: number } | { kind: 'gap'; key: string };
</script>

<script setup lang="ts">
import { computed } from 'vue';

type BasePaginationProps = {
  page: number;
  pageCount: number;
  siblingCount?: number;
  previousLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
};

const {
  page,
  pageCount,
  siblingCount = 1,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  disabled,
} = defineProps<BasePaginationProps>();

const emit = defineEmits<{ 'update:page': [page: number] }>();

const lastPage = computed(() => Math.max(Math.trunc(pageCount), 0));

const items = computed<PaginationItem[]>(() => {
  const last = lastPage.value;
  const from = Math.max(1, page - siblingCount);
  const to = Math.min(last, page + siblingCount);
  const result: PaginationItem[] = [];
  let previous = 0;

  for (let candidate = 1; candidate <= last; candidate++) {
    if (candidate !== 1 && candidate !== last && (candidate < from || candidate > to)) continue;
    if (candidate - previous === 2) {
      const skipped = candidate - 1;
      result.push({ kind: 'page', key: `page-${String(skipped)}`, page: skipped });
    } else if (candidate - previous > 2) {
      result.push({ kind: 'gap', key: `gap-${String(candidate)}` });
    }
    result.push({ kind: 'page', key: `page-${String(candidate)}`, page: candidate });
    previous = candidate;
  }

  return result;
});

const isFirst = computed(() => page <= 1);
const isLast = computed(() => page >= lastPage.value);

const goTo = (target: number): void => {
  if (disabled || target === page || target < 1 || target > lastPage.value) return;
  emit('update:page', target);
};
</script>

<template>
  <nav class="base-pagination">
    <button type="button" class="base-pagination-step" :disabled="disabled || isFirst" @click="goTo(page - 1)">
      {{ previousLabel }}
    </button>
    <template v-for="item in items" :key="item.key">
      <span v-if="item.kind === 'gap'" class="base-pagination-gap">…</span>
      <button
        v-else
        type="button"
        class="base-pagination-page"
        :class="{ 'is-current': item.page === page }"
        :data-page="item.page"
        :disabled="disabled"
        @click="goTo(item.page)"
      >
        {{ item.page }}
      </button>
    </template>
    <button type="button" class="base-pagination-step" :disabled="disabled || isLast" @click="goTo(page + 1)">
      {{ nextLabel }}
    </button>
  </nav>
</template>

<style scoped>
.base-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-md);
}

.base-pagination-step,
.base-pagination-page,
.base-pagination-gap {
  min-width: 2rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  text-align: center;
}

.base-pagination-step,
.base-pagination-page {
  background: none;
  font: inherit;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.base-pagination-page {
  font-variant-numeric: tabular-nums;
}

.base-pagination-step:hover:not(:disabled),
.base-pagination-page:hover:not(:disabled) {
  border-color: var(--color-line);
}

.base-pagination-page.is-current {
  border-color: var(--color-line);
  background: var(--color-surface-raised);
  font-weight: var(--weight-semibold);
}

.base-pagination-step:disabled,
.base-pagination-page:disabled {
  color: var(--color-text-muted);
  opacity: 0.5;
  cursor: default;
}

.base-pagination-gap {
  color: var(--color-text-muted);
}
</style>
