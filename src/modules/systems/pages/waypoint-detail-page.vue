<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useShipsQuery } from '@/modules/fleet';
import { MarketPanel } from '@/modules/markets';
import { useWaypointQuery } from '@/modules/systems/api/queries';
import WaypointHeader from '@/modules/systems/components/waypoint-header.vue';
import WaypointLinks from '@/modules/systems/components/waypoint-links.vue';
import WaypointNotFound from '@/modules/systems/components/waypoint-not-found.vue';
import WaypointShipsPresent from '@/modules/systems/components/waypoint-ships-present.vue';
import WaypointShipyardTab from '@/modules/systems/components/waypoint-shipyard-tab.vue';
import WaypointTraits from '@/modules/systems/components/waypoint-traits.vue';
import { hasTrait } from '@/modules/systems/domain/traits';
import { isApiError } from '@/shared/api/errors';
import { formatPageTitle } from '@/shared/lib/format';
import BaseTabs from '@/shared/ui/base-tabs.vue';
import QueryState from '@/shared/ui/query-state.vue';

const TAB_LABELS = { market: 'Market', shipyard: 'Shipyard' } as const;

type WaypointTabId = keyof typeof TAB_LABELS;

const route = useRoute();
const router = useRouter();

const systemSymbol = computed(() => String(route.params.systemSymbol ?? ''));
const waypointSymbol = computed(() => String(route.params.waypointSymbol ?? ''));

const {
  data: waypoint,
  isError: waypointFailed,
  isFetching: waypointFetching,
  error: waypointError,
  refetch: refetchWaypoint,
} = useWaypointQuery(systemSymbol, waypointSymbol);

const { data: ships, isError: shipsFailed, isFetching: shipsFetching, refetch: refetchShips } = useShipsQuery(1);

const notFound = computed(() => isApiError(waypointError.value) && waypointError.value.kind === 'not-found');

const fleet = computed(() => ships.value?.data ?? []);

const shipsHere = computed(() =>
  fleet.value.filter((ship) => ship.nav.waypointSymbol === waypointSymbol.value && ship.nav.status !== 'IN_TRANSIT'),
);

const availableTabs = computed<{ id: WaypointTabId; label: string }[]>(() => {
  const current = waypoint.value;
  if (current === undefined) return [];
  const ids: WaypointTabId[] = [
    ...(hasTrait(current, 'MARKETPLACE') ? (['market'] as const) : []),
    ...(hasTrait(current, 'SHIPYARD') ? (['shipyard'] as const) : []),
  ];
  return ids.map((id) => ({ id, label: TAB_LABELS[id] }));
});

// The tab lives in the URL, so the model reads and writes `?tab=`.
const activeTab = computed<string>({
  get: () => {
    const requested = route.query.tab;
    if (typeof requested === 'string' && availableTabs.value.some((tab) => tab.id === requested)) return requested;
    return availableTabs.value.some((tab) => tab.id === 'market') ? 'market' : '';
  },
  set: (id) => {
    void router.replace({ query: { ...route.query, tab: id } });
  },
});

watchEffect(() => {
  document.title = formatPageTitle(waypointSymbol.value);
});
</script>

<template>
  <div class="waypoint-page">
    <WaypointNotFound v-if="notFound" :system-symbol="systemSymbol" :waypoint-symbol="waypointSymbol" />

    <template v-else>
      <QueryState
        :has-data="waypoint !== undefined"
        :fetching="waypointFetching"
        :error="waypointFailed"
        error-title="Couldn't load this waypoint."
        :retry="refetchWaypoint"
      >
        <WaypointHeader v-if="waypoint !== undefined" :waypoint="waypoint" />
      </QueryState>

      <template v-if="waypoint !== undefined">
        <div class="waypoint-page-body">
          <WaypointTraits
            class="waypoint-page-traits"
            :traits="waypoint.traits"
            :modifiers="waypoint.modifiers ?? []"
          />

          <div class="waypoint-page-aside">
            <WaypointLinks
              :system-symbol="waypoint.systemSymbol"
              :orbits="waypoint.orbits ?? ''"
              :orbitals="waypoint.orbitals"
            />

            <section class="waypoint-page-ships">
              <h2 class="waypoint-page-title">Your ships here</h2>
              <QueryState
                :has-data="ships !== undefined"
                :fetching="shipsFetching"
                :error="shipsFailed"
                error-title="Couldn't load your ships."
                :retry="refetchShips"
              >
                <WaypointShipsPresent :ships="shipsHere" />
              </QueryState>
            </section>
          </div>
        </div>

        <section v-if="availableTabs.length > 0" class="waypoint-page-tabs">
          <BaseTabs v-model="activeTab" :tabs="availableTabs" />

          <div class="waypoint-page-panel">
            <MarketPanel
              v-if="activeTab === 'market'"
              :system-symbol="systemSymbol"
              :waypoint-symbol="waypointSymbol"
            />
            <WaypointShipyardTab
              v-else-if="activeTab === 'shipyard'"
              :system-symbol="systemSymbol"
              :waypoint-symbol="waypointSymbol"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.waypoint-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.waypoint-page-body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.waypoint-page-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.waypoint-page-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.waypoint-page-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
