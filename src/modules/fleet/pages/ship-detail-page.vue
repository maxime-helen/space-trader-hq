<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useShipQuery } from '@/modules/fleet/api/queries';
import ShipActions from '@/modules/fleet/components/ship-actions.vue';
import ShipCargoTab from '@/modules/fleet/components/ship-cargo-tab.vue';
import ShipCrewTab from '@/modules/fleet/components/ship-crew-tab.vue';
import ShipModulesTab from '@/modules/fleet/components/ship-modules-tab.vue';
import ShipOverviewTab from '@/modules/fleet/components/ship-overview-tab.vue';
import { navStatusLabel, navStatusVariant } from '@/modules/fleet/domain/ship-metrics';
import { isApiError } from '@/shared/api/errors';
import { formatApiValue, formatPageTitle } from '@/shared/lib/format';
import { FLEET_PATH } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import BaseBreadcrumbs from '@/shared/ui/base-breadcrumbs.vue';
import BaseTabs from '@/shared/ui/base-tabs.vue';
import QueryState from '@/shared/ui/query-state.vue';

type ShipTabId = 'overview' | 'cargo' | 'modules' | 'crew';

const SHIP_TABS: { id: ShipTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'cargo', label: 'Cargo' },
  { id: 'modules', label: 'Modules' },
  { id: 'crew', label: 'Crew' },
];

const DEFAULT_TAB: ShipTabId = 'overview';

const TAB_IDS = new Set<string>(SHIP_TABS.map((tab) => tab.id));

const isShipTabId = (value: unknown): value is ShipTabId => typeof value === 'string' && TAB_IDS.has(value);

const route = useRoute();
const router = useRouter();

const shipSymbol = computed(() => String(route.params.shipSymbol));

const { data: ship, error, isError: failed, isFetching: fetching, refetch } = useShipQuery(shipSymbol);

// The tab lives in the URL, so the model reads and writes `?tab=`.
const activeTab = computed<ShipTabId>({
  get: () => (isShipTabId(route.query.tab) ? route.query.tab : DEFAULT_TAB),
  set: (id) => {
    if (id === activeTab.value) return;
    void router.push({ query: { ...route.query, tab: id } });
  },
});

const notFound = computed(() => isApiError(error.value) && error.value.kind === 'not-found');

watchEffect(() => {
  document.title = formatPageTitle(shipSymbol.value);
});
</script>

<template>
  <div class="ship-detail-page">
    <BaseBreadcrumbs :items="[{ label: 'Fleet', to: FLEET_PATH }, { label: shipSymbol }]" />

    <h1 class="ship-detail-title">{{ shipSymbol }}</h1>

    <div v-if="notFound" class="ship-detail-not-found">
      <strong>There's no ship {{ shipSymbol }} in your fleet.</strong>
      <p>Check the symbol, or go back to your ships.</p>
      <RouterLink class="ship-detail-back" :to="FLEET_PATH">Back to your fleet</RouterLink>
    </div>

    <template v-else>
      <p v-if="ship !== undefined" class="ship-detail-meta">
        <span class="ship-detail-name">{{ ship.registration.name }}</span>
        <BaseBadge>{{ formatApiValue(ship.registration.role) }}</BaseBadge>
        <span class="ship-detail-faction">{{ formatApiValue(ship.registration.factionSymbol) }}</span>
        <BaseBadge :variant="navStatusVariant(ship.nav.status)">{{ navStatusLabel(ship.nav.status) }}</BaseBadge>
      </p>

      <ShipActions v-if="ship !== undefined" :ship="ship" />

      <BaseTabs v-model="activeTab" class="ship-detail-tabs" :tabs="SHIP_TABS" />

      <QueryState
        class="ship-detail-panel"
        :has-data="ship !== undefined"
        :fetching="fetching"
        :error="failed"
        error-title="Couldn't load this ship."
        :retry="refetch"
      >
        <template v-if="ship !== undefined">
          <ShipOverviewTab v-if="activeTab === 'overview'" :ship="ship" />
          <ShipCargoTab v-else-if="activeTab === 'cargo'" :ship="ship" />
          <ShipModulesTab v-else-if="activeTab === 'modules'" :ship="ship" />
          <ShipCrewTab v-else :ship="ship" />
        </template>
      </QueryState>
    </template>
  </div>
</template>

<style scoped>
.ship-detail-page {
  display: flex;
  flex-direction: column;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.ship-detail-title {
  margin: var(--space-2) 0 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.ship-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.ship-detail-name {
  color: var(--color-text);
}

.ship-detail-tabs {
  margin-top: var(--space-5);
}

.ship-detail-panel {
  margin-top: var(--space-4);
}

.ship-detail-not-found {
  margin-top: var(--space-5);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-card);
  padding: var(--space-5);
}

.ship-detail-not-found strong {
  font-weight: var(--weight-semibold);
}

.ship-detail-not-found p {
  margin: var(--space-1) 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.ship-detail-back {
  color: var(--color-accent);
}
</style>
