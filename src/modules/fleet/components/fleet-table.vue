<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { cargoRatio, fuelRatio } from '@/modules/fleet/domain/ship-metrics';
import type { Ship } from '@/shared/api/types';
import { formatApiValue } from '@/shared/lib/format';
import { shipPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import DataTable, { type DataTableColumn } from '@/shared/ui/data-table.vue';

import ShipCapacityCell from './ship-capacity-cell.vue';
import ShipCooldownCell from './ship-cooldown-cell.vue';
import ShipLocationCell from './ship-location-cell.vue';
import ShipStatusBadge from './ship-status-badge.vue';

type FleetTableProps = {
  ships: readonly Ship[];
  now: number;
  homeSystemSymbol: string | undefined;
};

const { ships, now, homeSystemSymbol } = defineProps<FleetTableProps>();

const COLUMNS: DataTableColumn<Ship>[] = [
  { key: 'symbol', label: 'Ship' },
  { key: 'name', label: 'Name', value: (ship) => ship.registration.name },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'flightMode', label: 'Flight mode', value: (ship) => formatApiValue(ship.nav.flightMode) },
  { key: 'fuel', label: 'Fuel' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'cooldown', label: 'Cooldown' },
];

const rowKey = (ship: Ship): string => ship.symbol;
</script>

<template>
  <DataTable class="fleet-table" :columns="COLUMNS" :rows="ships" :row-key="rowKey">
    <template #cell:symbol="{ row }">
      <RouterLink class="fleet-table-symbol" :to="shipPath(row.symbol)">{{ row.symbol }}</RouterLink>
    </template>

    <template #cell:role="{ row }">
      <BaseBadge>{{ formatApiValue(row.registration.role) }}</BaseBadge>
    </template>

    <template #cell:status="{ row }">
      <ShipStatusBadge :status="row.nav.status" />
    </template>

    <template #cell:location="{ row }">
      <ShipLocationCell :nav="row.nav" :now="now" :home-system-symbol="homeSystemSymbol" />
    </template>

    <template #cell:fuel="{ row }">
      <ShipCapacityCell
        :ratio="fuelRatio(row.fuel)"
        :value="row.fuel.current"
        :max="row.fuel.capacity"
        empty-label="No fuel tank"
      />
    </template>

    <template #cell:cargo="{ row }">
      <ShipCapacityCell
        :ratio="cargoRatio(row.cargo)"
        :value="row.cargo.units"
        :max="row.cargo.capacity"
        empty-label="No cargo hold"
      />
    </template>

    <template #cell:cooldown="{ row }">
      <ShipCooldownCell :cooldown="row.cooldown" :now="now" />
    </template>

    <template #empty>No ships on this page.</template>
  </DataTable>
</template>

<style scoped>
.fleet-table-symbol {
  font-variant-numeric: tabular-nums;
}
</style>
