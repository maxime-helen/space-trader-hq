<script setup lang="ts">
import { computed, ref } from 'vue';

import { useDockShip, useNavigateShip, useOrbitShip } from '@/modules/fleet/api/mutations';
import { canDock, canNavigate, canOrbit } from '@/modules/fleet/domain/ship-actions';
import type { Ship } from '@/shared/api/types';
import { formatNumber } from '@/shared/lib/format';
import { parseWaypointSymbol } from '@/shared/lib/symbols';
import BaseButton from '@/shared/ui/base-button.vue';
import BaseField from '@/shared/ui/base-field.vue';

import ConfirmDialog from './confirm-dialog.vue';

type ShipActionsProps = {
  ship: Ship;
};

const { ship } = defineProps<ShipActionsProps>();

const shipSymbol = computed(() => ship.symbol);

const orbit = useOrbitShip(shipSymbol);
const dock = useDockShip(shipSymbol);
const navigate = useNavigateShip(shipSymbol);

const orbitOffered = computed(() => canOrbit(ship.nav.status));
const dockOffered = computed(() => canDock(ship.nav.status));
const navigateOffered = computed(() => canNavigate(ship.nav.status));

const inTransit = computed(() => ship.nav.status === 'IN_TRANSIT');

const clearOutcome = () => {
  orbit.reset();
  dock.reset();
  navigate.reset();
};

const failureMessage = computed(() => (orbit.error.value ?? dock.error.value ?? navigate.error.value)?.message ?? '');

const onOrbit = () => {
  clearOutcome();
  orbit.mutate();
};

const onDock = () => {
  clearOutcome();
  dock.mutate();
};

const confirmOpen = ref(false);
const destination = ref('');

const onNavigateClick = () => {
  clearOutcome();
  destination.value = '';
  confirmOpen.value = true;
};

const parsedDestination = computed(() => parseWaypointSymbol(destination.value));

const destinationInSystem = computed(() => parsedDestination.value?.system === ship.nav.systemSymbol);

const destinationHint = computed(() => {
  if (destination.value.trim().length === 0) return '';
  if (parsedDestination.value === undefined) return 'A destination looks like X1-AB12-A1.';
  return destinationInSystem.value ? '' : `Navigation stays inside ${ship.nav.systemSymbol}.`;
});

const destinationReady = computed(() => parsedDestination.value !== undefined && destinationInSystem.value);

const fuelTank = computed(() => `${formatNumber(ship.fuel.current)} / ${formatNumber(ship.fuel.capacity)}`);

const tankEmpty = computed(() => ship.fuel.capacity > 0 && ship.fuel.current === 0);

const fuelNote = computed(() => {
  if (ship.fuel.capacity === 0) return 'This ship has no fuel tank, so a trip costs it no fuel.';
  if (tankEmpty.value) return `The tank is empty (${fuelTank.value}). This trip needs fuel.`;
  return `Fuel ${fuelTank.value}.`;
});

const onNavigateConfirm = () => {
  const target = parsedDestination.value;
  if (target === undefined || !destinationInSystem.value) return;
  navigate.mutate({ waypointSymbol: target.waypoint }, { onSettled: () => (confirmOpen.value = false) });
};
</script>

<template>
  <section class="ship-actions">
    <div class="ship-actions-bar">
      <BaseButton v-if="orbitOffered" class="ship-actions-orbit" :loading="orbit.isPending.value" @click="onOrbit">
        Orbit
      </BaseButton>

      <BaseButton v-if="dockOffered" class="ship-actions-dock" :loading="dock.isPending.value" @click="onDock">
        Dock
      </BaseButton>

      <BaseButton
        v-if="navigateOffered"
        class="ship-actions-navigate"
        variant="primary"
        :loading="navigate.isPending.value"
        @click="onNavigateClick"
      >
        Navigate
      </BaseButton>

      <p v-if="inTransit" class="ship-actions-none">This ship is in transit. Its actions come back when it arrives.</p>
    </div>

    <p v-if="failureMessage !== ''" class="ship-actions-error" role="status">{{ failureMessage }}</p>

    <ConfirmDialog
      v-model:open="confirmOpen"
      class="ship-actions-confirm"
      :heading="`Navigate ${ship.symbol}`"
      confirm-label="Navigate"
      :danger="tankEmpty"
      :confirming="navigate.isPending.value"
      :confirm-disabled="!destinationReady"
      @confirm="onNavigateConfirm"
    >
      <BaseField
        v-model="destination"
        class="ship-actions-destination"
        label="Destination waypoint"
        :placeholder="`${ship.nav.systemSymbol}-…`"
        :error="destinationHint"
      />
      <p class="ship-actions-fuel">{{ fuelNote }}</p>
    </ConfirmDialog>
  </section>
</template>

<style scoped>
.ship-actions {
  margin-top: var(--space-4);
}

.ship-actions-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.ship-actions-none,
.ship-actions-error {
  margin: var(--space-2) 0 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.ship-actions-none {
  margin: 0;
}

.ship-actions-error {
  color: var(--color-danger);
}

.ship-actions-fuel {
  margin: 0;
}
</style>
