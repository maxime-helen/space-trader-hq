<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAgentQuery } from '@/modules/agent';
import { useFleetShips } from '@/modules/fleet';
import type { WaypointFilters } from '@/modules/systems/api/keys';
import { useSystemQuery, useWaypointsQuery } from '@/modules/systems/api/queries';
import SystemFilters from '@/modules/systems/components/system-filters.vue';
import SystemHeader from '@/modules/systems/components/system-header.vue';
import SystemNotFound from '@/modules/systems/components/system-not-found.vue';
import SystemWaypointList from '@/modules/systems/components/system-waypoint-list.vue';
import SystemWaypointTree from '@/modules/systems/components/system-waypoint-tree.vue';
import { formatTraitsParam, parseTraitsParam, parseTypeParam, WAYPOINT_TYPES } from '@/modules/systems/domain/filters';
import { shipsByWaypoint } from '@/modules/systems/domain/systems-of-interest';
import { buildWaypointTree, filterTreeByType } from '@/modules/systems/domain/waypoint-tree';
import { isApiError } from '@/shared/api/errors';
import type { WaypointTraitSymbol, WaypointType } from '@/shared/api/types';
import { formatPageTitle } from '@/shared/lib/format';
import { clampPage, pageCount, parsePageParam } from '@/shared/lib/pagination';
import { SYSTEMS_PATH } from '@/shared/lib/paths';
import { normalizeSymbol, toSystemSymbol } from '@/shared/lib/symbols';
import BaseBreadcrumbs from '@/shared/ui/base-breadcrumbs.vue';
import BasePagination from '@/shared/ui/base-pagination.vue';
import QueryState from '@/shared/ui/query-state.vue';

const route = useRoute();
const router = useRouter();

const routeSymbol = computed(() => String(route.params.systemSymbol ?? ''));
const systemSymbol = computed(() => normalizeSymbol(routeSymbol.value));

watchEffect(() => {
  if (routeSymbol.value.length > 0 && routeSymbol.value !== systemSymbol.value) {
    void router.replace({ params: { ...route.params, systemSymbol: systemSymbol.value }, query: route.query });
  }
});

const typeFilter = computed<WaypointType | ''>({
  get: () => parseTypeParam(route.query.type),
  set: (value) => {
    void router.push({ query: { ...route.query, type: value === '' ? undefined : value, page: undefined } });
  },
});

const traitFilter = computed<WaypointTraitSymbol[]>({
  get: () => parseTraitsParam(route.query.traits),
  set: (value) => {
    void router.push({ query: { ...route.query, traits: formatTraitsParam(value), page: undefined } });
  },
});

const isTraitMode = computed(() => traitFilter.value.length > 0);

const requestedPage = computed(() => parsePageParam(route.query.page));

const {
  data: system,
  isFetching: systemFetching,
  isError: systemFailed,
  error: systemError,
  refetch: refetchSystem,
} = useSystemQuery(systemSymbol);

const waypointFilters = computed<WaypointFilters>(() => ({
  page: requestedPage.value,
  ...(typeFilter.value === '' ? {} : { type: typeFilter.value }),
  traits: traitFilter.value,
}));

const {
  data: filtered,
  isFetching: filteredFetching,
  isError: filteredFailed,
  refetch: refetchFiltered,
} = useWaypointsQuery(systemSymbol, waypointFilters, { enabled: isTraitMode });

const embedded = computed(() => system.value?.waypoints ?? []);
const availableTypes = computed(() => WAYPOINT_TYPES.filter((type) => embedded.value.some((w) => w.type === type)));
const tree = computed(() => filterTreeByType(buildWaypointTree(embedded.value), typeFilter.value));

const filteredWaypoints = computed(() => filtered.value?.data ?? []);
const filteredPages = computed(() => pageCount(filtered.value?.meta));

const { data: agent } = useAgentQuery();
const { ships } = useFleetShips();
const shipCounts = computed(() => shipsByWaypoint(ships.value));
const headquarters = computed(() => agent.value?.headquarters ?? '');
const isHeadquartersSystem = computed(
  () => headquarters.value.length > 0 && toSystemSymbol(headquarters.value) === systemSymbol.value,
);

const notFound = computed(() => isApiError(systemError.value) && systemError.value.kind === 'not-found');

const crumbs = computed(() => [{ label: 'Systems', to: SYSTEMS_PATH }, { label: systemSymbol.value }]);

const waypointPanel = computed(() =>
  isTraitMode.value
    ? {
        hasData: filtered.value !== undefined,
        fetching: filteredFetching.value,
        error: filteredFailed.value,
        empty: filteredWaypoints.value.length === 0,
        errorTitle: "Couldn't load the filtered waypoints.",
        emptyMessage: 'No waypoint in this system has every trait you picked.',
      }
    : {
        hasData: system.value !== undefined,
        fetching: systemFetching.value,
        error: systemFailed.value,
        empty: tree.value.length === 0,
        errorTitle: "Couldn't load this system.",
        emptyMessage:
          embedded.value.length === 0 ? 'This system has no waypoints.' : 'No waypoint of that type in this system.',
      },
);

const queryWithPage = (page: number) => ({ ...route.query, page: page <= 1 ? undefined : String(page) });

watch([requestedPage, filtered], () => {
  if (!isTraitMode.value) return;
  const clamped = clampPage(requestedPage.value, filtered.value?.meta);
  if (clamped !== requestedPage.value) void router.replace({ query: queryWithPage(clamped) });
});

watchEffect(() => {
  if (system.value !== undefined) document.title = formatPageTitle(system.value.symbol);
});

const onPageChange = (page: number) => {
  void router.push({ query: queryWithPage(page) });
};

const retry = () => (isTraitMode.value ? refetchFiltered() : refetchSystem());
</script>

<template>
  <div class="system-page">
    <SystemNotFound v-if="notFound" :symbol="systemSymbol" />

    <template v-else>
      <BaseBreadcrumbs :items="crumbs" />

      <QueryState
        :has-data="system !== undefined"
        :fetching="systemFetching"
        :error="systemFailed"
        error-title="Couldn't load this system."
        :retry="refetchSystem"
      >
        <SystemHeader v-if="system !== undefined" :system="system" :is-headquarters="isHeadquartersSystem" />
      </QueryState>

      <section class="system-page-waypoints">
        <h2 class="system-page-subtitle">Waypoints</h2>

        <SystemFilters v-model:type="typeFilter" v-model:traits="traitFilter" :available-types="availableTypes" />

        <QueryState v-bind="waypointPanel" :retry="retry">
          <template v-if="isTraitMode">
            <SystemWaypointList :waypoints="filteredWaypoints" :system-symbol="systemSymbol" />
            <BasePagination
              v-if="filteredPages > 1"
              class="system-page-pager"
              :page="requestedPage"
              :page-count="filteredPages"
              @update:page="onPageChange"
            />
          </template>

          <SystemWaypointTree
            v-else
            :nodes="tree"
            :system-symbol="systemSymbol"
            :ship-counts="shipCounts"
            :headquarters="headquarters"
          />
        </QueryState>
      </section>
    </template>
  </div>
</template>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.system-page-subtitle {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.system-page-waypoints {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.system-page-pager {
  margin-top: var(--space-4);
}
</style>
