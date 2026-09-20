<script setup lang="ts">
import { computed } from 'vue';

import type { Ship } from '@/shared/api/types';
import { formatApiValue } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/base-card.vue';
import BaseMeter from '@/shared/ui/base-meter.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

type ShipCargoTabProps = {
  ship: Ship;
};

const { ship } = defineProps<ShipCargoTabProps>();

type CargoRow = Ship['cargo']['inventory'][number];

const COLUMNS: readonly DataTableColumn<CargoRow>[] = [
  { key: 'good', label: 'Good', value: (row) => formatApiValue(row.symbol) },
  { key: 'name', label: 'Name' },
  { key: 'units', label: 'Units', numeric: true },
];

const cargo = computed(() => ship.cargo);

const isEmpty = computed(() => cargo.value.inventory.length === 0);
</script>

<template>
  <BaseCard class="ship-cargo-tab">
    <template #title>Cargo</template>

    <BaseMeter label="Cargo" :value="cargo.units" :max="cargo.capacity">
      <template #empty>No cargo hold</template>
    </BaseMeter>

    <p v-if="isEmpty" class="ship-cargo-empty">The hold is empty.</p>
    <div v-else class="ship-cargo-table">
      <DataTable :columns="COLUMNS" :rows="cargo.inventory" :row-key="(row: CargoRow) => row.symbol" />
    </div>
  </BaseCard>
</template>

<style scoped>
.ship-cargo-tab {
  max-width: 40rem;
}

.ship-cargo-empty {
  margin: var(--space-4) 0 0;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-5);
  text-align: center;
  color: var(--color-text-muted);
}

.ship-cargo-table {
  margin-top: var(--space-4);
}
</style>
