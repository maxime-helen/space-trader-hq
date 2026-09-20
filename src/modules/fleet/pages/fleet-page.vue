<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAgentQuery } from '@/modules/agent';
import { useShipsQuery } from '@/modules/fleet/api/queries';
import FleetSummary from '@/modules/fleet/components/fleet-summary.vue';
import FleetTable from '@/modules/fleet/components/fleet-table.vue';
import { countByStatus } from '@/modules/fleet/domain/fleet-summary';
import { useClock } from '@/shared/composables/use-clock';
import { FIRST_PAGE, pageCount, parsePageParam } from '@/shared/lib/pagination';
import { toSystemSymbol } from '@/shared/lib/symbols';
import BasePagination from '@/shared/ui/base-pagination.vue';
import QueryState from '@/shared/ui/query-state.vue';

const EMPTY_FLEET =
  'You have no ships. New agents start with two, so the server may have just been reset: sign in again with a new agent token.';

const route = useRoute();
const router = useRouter();

const page = computed(() => parsePageParam(route.query.page));

const { data: ships, isError: shipsFailed, isFetching: shipsFetching, refetch: refetchShips } = useShipsQuery(page);

const { data: agent } = useAgentQuery();

const now = useClock();

const rows = computed(() => ships.value?.data ?? []);
const counts = computed(() => countByStatus(rows.value));

const hasNoShips = computed(() => ships.value !== undefined && ships.value.meta.total === 0);

const totalShips = computed(() => agent.value?.shipCount ?? ships.value?.meta.total ?? rows.value.length);

const homeSystemSymbol = computed(() =>
  agent.value === undefined ? undefined : toSystemSymbol(agent.value.headquarters),
);

const pages = computed(() => {
  const meta = ships.value?.meta;
  return pageCount(meta);
});

const goToPage = (next: number): void => {
  void router.push({ query: { ...route.query, page: next === FIRST_PAGE ? undefined : String(next) } });
};
</script>

<template>
  <div class="fleet-page">
    <h1 class="fleet-page-title">Fleet</h1>

    <QueryState
      :has-data="ships !== undefined"
      :fetching="shipsFetching"
      :error="shipsFailed"
      :empty="hasNoShips"
      error-title="Couldn't load your ships."
      :empty-message="EMPTY_FLEET"
      :retry="refetchShips"
    >
      <FleetSummary :total-ships="totalShips" :shown-ships="rows.length" :counts="counts" />
      <FleetTable :ships="rows" :now="now" :home-system-symbol="homeSystemSymbol" />
      <BasePagination
        v-if="pages > 1"
        class="fleet-page-pager"
        :page="page"
        :page-count="pages"
        @update:page="goToPage"
      />
    </QueryState>
  </div>
</template>

<style scoped>
.fleet-page {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.fleet-page-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
}

.fleet-page-pager {
  margin-top: var(--space-4);
}
</style>
