<script lang="ts">
export type DataTableColumn<TRow> = {
  key: string;
  label: string;
  numeric?: boolean;
  align?: 'start' | 'end';
  value?: (row: TRow) => string | number;
};
</script>

<script setup lang="ts" generic="TRow extends object">
defineProps<{
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow, index: number) => string | number;
}>();

defineSlots<{
  [key: `cell:${string}`]: (props: { row: TRow; column: DataTableColumn<TRow>; index: number }) => unknown;
  empty?: () => unknown;
}>();

const columnClass = (column: DataTableColumn<TRow>): Record<string, boolean> => ({
  'is-numeric': column.numeric === true,
  'is-end': (column.align ?? (column.numeric === true ? 'end' : 'start')) === 'end',
});

const cellText = (row: TRow, column: DataTableColumn<TRow>): string => {
  if (column.value) return String(column.value(row));
  const raw: unknown = (row as Record<string, unknown>)[column.key];
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'bigint' || typeof raw === 'boolean') return String(raw);
  return '';
};
</script>

<template>
  <div class="data-table">
    <table class="data-table-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" :class="columnClass(column)">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="rowKey(row, index)">
          <td v-for="column in columns" :key="column.key" :class="columnClass(column)">
            <slot :name="`cell:${column.key}`" :row="row" :column="column" :index="index">
              {{ cellText(row, column) }}
            </slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0" class="data-table-empty">
          <td :colspan="columns.length"><slot name="empty" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.data-table {
  overflow-x: auto;
  max-width: 100%;
}

.data-table-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-md);
}

.data-table-table th,
.data-table-table td {
  padding: var(--space-3);
  border-bottom: var(--border);
  text-align: left;
  white-space: nowrap;
}

.data-table-table th {
  color: var(--color-text-muted);
  font-weight: var(--weight-regular);
}

.data-table-table th.is-end,
.data-table-table td.is-end {
  text-align: right;
}

.data-table-table td.is-numeric,
.data-table-table th.is-numeric {
  font-variant-numeric: tabular-nums;
}

.data-table-table tbody tr:hover td {
  background: var(--color-row-hover);
  transition: background var(--duration-fast) var(--ease-out);
}

.data-table-empty td {
  color: var(--color-text-muted);
  text-align: center;
  white-space: normal;
}
</style>
