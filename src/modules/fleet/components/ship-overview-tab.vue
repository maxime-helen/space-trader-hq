<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import {
  cooldownEndsAt,
  cooldownRemaining,
  isArriving,
  navStatusLabel,
  navStatusVariant,
  transitProgress,
} from '@/modules/fleet/domain/ship-metrics';
import type { Ship } from '@/shared/api/types';
import { useClock } from '@/shared/composables/use-clock';
import { formatApiValue, formatClockTime, formatCooldown, formatEta } from '@/shared/lib/format';
import { systemPath, waypointPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import BaseCard from '@/shared/ui/base-card.vue';
import BaseMeter from '@/shared/ui/base-meter.vue';
import BaseSpinner from '@/shared/ui/base-spinner.vue';

type ShipOverviewTabProps = {
  ship: Ship;
};

const { ship } = defineProps<ShipOverviewTabProps>();

const PERCENT = 100;

const now = useClock();

const nav = computed(() => ship.nav);

const route = computed(() => ship.nav.route);

const inTransit = computed(() => ship.nav.status === 'IN_TRANSIT');

const currentSystemPath = computed(() => systemPath(ship.nav.systemSymbol));

const currentWaypointPath = computed(() => waypointPath(ship.nav.systemSymbol, ship.nav.waypointSymbol));

const progress = computed(() => transitProgress(route.value, now.value));

const progressPercent = computed(() => Math.round(progress.value * PERCENT));

const arriving = computed(() => isArriving(ship.nav.status, route.value, now.value));

const etaLabel = computed(() => formatEta(route.value.arrival, now.value));

const cooldownSeconds = computed(() => cooldownRemaining(ship.cooldown, now.value));

const cooldownLabel = computed(() => formatCooldown(cooldownEndsAt(ship.cooldown, now.value), now.value));

const onCooldown = computed(() => cooldownSeconds.value > 0);

const cooldownProgress = computed(() =>
  ship.cooldown.totalSeconds > 0 ? cooldownSeconds.value / ship.cooldown.totalSeconds : 0,
);

const consumed = computed(() => ship.fuel.consumed);
</script>

<template>
  <div class="ship-overview-tab">
    <BaseCard class="ship-overview-nav">
      <template #title>Navigation</template>
      <template #aside>
        <BaseBadge :variant="navStatusVariant(nav.status)">{{ navStatusLabel(nav.status) }}</BaseBadge>
      </template>

      <dl class="ship-overview-rows">
        <div class="ship-overview-row">
          <dt>Waypoint</dt>
          <dd>
            <RouterLink class="ship-overview-link" :to="currentWaypointPath">{{ nav.waypointSymbol }}</RouterLink>
          </dd>
        </div>
        <div class="ship-overview-row">
          <dt>System</dt>
          <dd>
            <RouterLink class="ship-overview-link" :to="currentSystemPath">{{ nav.systemSymbol }}</RouterLink>
          </dd>
        </div>
        <div class="ship-overview-row">
          <dt>Status</dt>
          <dd>{{ navStatusLabel(nav.status) }}</dd>
        </div>
        <div class="ship-overview-row">
          <dt>Flight mode</dt>
          <dd>{{ formatApiValue(nav.flightMode) }}</dd>
        </div>

        <template v-if="inTransit">
          <div class="ship-overview-row">
            <dt>From</dt>
            <dd>
              <RouterLink
                class="ship-overview-link ship-overview-origin"
                :to="waypointPath(route.origin.systemSymbol, route.origin.symbol)"
                >{{ route.origin.symbol }}</RouterLink
              >
            </dd>
          </div>
          <div class="ship-overview-row">
            <dt>To</dt>
            <dd>
              <RouterLink
                class="ship-overview-link ship-overview-destination"
                :to="waypointPath(route.destination.systemSymbol, route.destination.symbol)"
                >{{ route.destination.symbol }}</RouterLink
              >
            </dd>
          </div>
          <div class="ship-overview-row">
            <dt>Departed</dt>
            <dd class="ship-overview-time">{{ formatClockTime(route.departureTime) }}</dd>
          </div>
          <div class="ship-overview-row">
            <dt>Arrives</dt>
            <dd class="ship-overview-time">{{ formatClockTime(route.arrival) }}</dd>
          </div>
        </template>
      </dl>

      <div v-if="inTransit" class="ship-overview-transit">
        <progress class="ship-overview-progress" max="1" :value="progress"></progress>
        <div class="ship-overview-transit-labels">
          <span class="ship-overview-muted">{{ progressPercent }}% of the way</span>
          <span class="ship-overview-eta">
            <BaseSpinner v-if="arriving" class="ship-overview-spinner" />
            {{ etaLabel }}
          </span>
        </div>
      </div>
    </BaseCard>

    <BaseCard class="ship-overview-fuel">
      <template #title>Fuel</template>
      <BaseMeter label="Fuel" :value="ship.fuel.current" :max="ship.fuel.capacity">
        <template #empty>No fuel tank</template>
      </BaseMeter>
      <p v-if="consumed !== undefined" class="ship-overview-consumed">This trip used {{ consumed.amount }}</p>
    </BaseCard>

    <BaseCard class="ship-overview-cooldown">
      <template #title>Cooldown</template>
      <template #aside>
        <span class="ship-overview-cooldown-label">{{ cooldownLabel }}</span>
      </template>
      <progress v-if="onCooldown" class="ship-overview-progress" max="1" :value="cooldownProgress"></progress>
      <p v-else class="ship-overview-muted ship-overview-cooldown-note">No action is cooling down.</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.ship-overview-tab {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  align-items: start;
  gap: var(--space-4);
}

.ship-overview-rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-5);
  margin: 0;
}

.ship-overview-row {
  display: contents;
}

.ship-overview-row dt {
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.ship-overview-row dd {
  margin: 0;
  font-size: var(--text-md);
  min-width: 0;
}

.ship-overview-link {
  color: var(--color-accent);
}

.ship-overview-time {
  font-variant-numeric: tabular-nums;
}

.ship-overview-transit {
  margin-top: var(--space-4);
}

.ship-overview-progress {
  display: block;
  width: 100%;
  height: 0.5rem;
  appearance: none;
  border: var(--border);
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
  overflow: hidden;
}

.ship-overview-progress::-webkit-progress-bar {
  background: var(--color-surface-raised);
  border-radius: inherit;
}

.ship-overview-progress::-webkit-progress-value {
  background: var(--color-accent);
  border-radius: inherit;
}

.ship-overview-progress::-moz-progress-bar {
  background: var(--color-accent);
  border-radius: inherit;
}

.ship-overview-transit-labels {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: var(--text-sm);
}

.ship-overview-muted {
  color: var(--color-text-muted);
}

.ship-overview-eta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-variant-numeric: tabular-nums;
}

.ship-overview-consumed {
  margin: var(--space-2) 0 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.ship-overview-cooldown-label {
  font-size: var(--text-md);
  font-weight: var(--weight-regular);
  font-variant-numeric: tabular-nums;
}

.ship-overview-cooldown-note {
  margin: 0;
  font-size: var(--text-md);
}
</style>
