<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { useAgentQuery } from '@/modules/agent';
import { useFleetShips } from '@/modules/fleet';
import { systemsOfInterest } from '@/modules/systems/domain/systems-of-interest';
import { formatNumber } from '@/shared/lib/format';
import { systemPath } from '@/shared/lib/paths';
import BaseBadge from '@/shared/ui/base-badge.vue';
import BaseCard from '@/shared/ui/base-card.vue';
import QueryState from '@/shared/ui/query-state.vue';

const { data: agent, isFetching: agentFetching, isError: agentFailed, refetch: refetchAgent } = useAgentQuery();
const { ships, isFetching: shipsFetching } = useFleetShips();

const systems = computed(() => systemsOfInterest(agent.value, ships.value));

const hasData = computed(() => agent.value !== undefined);
const isFetching = computed(() => agentFetching.value || shipsFetching.value);

const shipCountLabel = (count: number): string => `${formatNumber(count)} ${count === 1 ? 'ship' : 'ships'}`;
</script>

<template>
  <section class="your-systems">
    <h2 class="your-systems-title">Your systems</h2>

    <QueryState
      :has-data="hasData"
      :fetching="isFetching"
      :error="agentFailed"
      :empty="systems.length === 0"
      error-title="Couldn't load your systems."
      empty-message="No headquarters and no ships yet, so there is nothing to shortcut to."
      :retry="refetchAgent"
    >
      <ul class="your-systems-list">
        <li v-for="system in systems" :key="system.systemSymbol">
          <RouterLink class="your-systems-link" :to="systemPath(system.systemSymbol)">
            <BaseCard>
              <template #title>{{ system.systemSymbol }}</template>
              <p class="your-systems-badges">
                <BaseBadge v-if="system.isHeadquarters" variant="positive">Headquarters</BaseBadge>
                <BaseBadge v-if="system.shipCount > 0" variant="orbit">{{
                  shipCountLabel(system.shipCount)
                }}</BaseBadge>
              </p>
            </BaseCard>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </section>
</template>

<style scoped>
.your-systems-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.your-systems-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--space-4);
  list-style: none;
  margin: 0;
  padding: 0;
}

.your-systems-link {
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-card);
}

.your-systems-link :deep(.base-card) {
  height: 100%;
  transition: border-color var(--duration-fast) var(--ease-out);
}

.your-systems-link:hover :deep(.base-card) {
  border-color: var(--color-accent);
}

.your-systems-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
}
</style>
