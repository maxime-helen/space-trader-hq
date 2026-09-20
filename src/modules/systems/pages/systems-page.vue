<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useSystemsQuery } from '@/modules/systems/api/queries';
import GoToSystem from '@/modules/systems/components/go-to-system.vue';
import SystemsTable from '@/modules/systems/components/systems-table.vue';
import YourSystems from '@/modules/systems/components/your-systems.vue';
import { clampPage, pageCount, parsePageParam } from '@/shared/lib/pagination';
import BasePagination from '@/shared/ui/base-pagination.vue';
import QueryState from '@/shared/ui/query-state.vue';

const route = useRoute();
const router = useRouter();

const requestedPage = computed(() => parsePageParam(route.query.page));

const { data, isFetching, isError, refetch } = useSystemsQuery(requestedPage);

const systems = computed(() => data.value?.data ?? []);
const meta = computed(() => data.value?.meta);
const totalPages = computed(() => pageCount(meta.value));

const queryWithPage = (page: number) => ({ ...route.query, page: page <= 1 ? undefined : String(page) });

watch([requestedPage, meta], () => {
  const clamped = clampPage(requestedPage.value, meta.value);
  if (clamped !== requestedPage.value) void router.replace({ query: queryWithPage(clamped) });
});

const onPageChange = (page: number) => {
  void router.push({ query: queryWithPage(page) });
};
</script>

<template>
  <div class="systems-page">
    <h1 class="systems-page-title">Systems</h1>

    <YourSystems />
    <GoToSystem />

    <section class="systems-page-universe">
      <h2 class="systems-page-subtitle">Universe</h2>

      <QueryState
        :has-data="data !== undefined"
        :fetching="isFetching"
        :error="isError"
        :empty="systems.length === 0"
        error-title="Couldn't load the systems."
        empty-message="No systems on this page."
        :retry="refetch"
      >
        <SystemsTable :systems="systems" />

        <BasePagination
          v-if="totalPages > 1"
          class="systems-page-pager"
          :page="requestedPage"
          :page-count="totalPages"
          @update:page="onPageChange"
        />
      </QueryState>
    </section>
  </div>
</template>

<style scoped>
.systems-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.systems-page-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-display);
}

.systems-page-subtitle {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.systems-page-pager {
  margin-top: var(--space-4);
}
</style>
