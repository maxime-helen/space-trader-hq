<script setup lang="ts">
import { computed } from 'vue';

import { useAgentQuery } from '@/modules/agent';
import { useFleetShips } from '@/modules/fleet';
import MarketplaceGroup from '@/modules/markets/components/marketplace-group.vue';
import { sortSystemsByShips } from '@/modules/markets/domain/systems-by-ships';
import { systemsOfInterest } from '@/modules/systems';
import QueryState from '@/shared/ui/query-state.vue';

const { data: agent, isFetching: agentFetching, isError: agentFailed, refetch: refetchAgent } = useAgentQuery();
const { ships, isFetching: shipsFetching } = useFleetShips();

const systems = computed(() => sortSystemsByShips(systemsOfInterest(agent.value, ships.value)));

const hasData = computed(() => agent.value !== undefined);
const isFetching = computed(() => agentFetching.value || shipsFetching.value);
</script>

<template>
  <div class="markets-page">
    <header class="markets-page-header">
      <h1 class="markets-page-title">Markets</h1>
      <p class="markets-page-intro">Marketplaces in your headquarters system and the systems where your ships are.</p>
    </header>

    <QueryState
      :has-data="hasData"
      :fetching="isFetching"
      :error="agentFailed"
      :empty="systems.length === 0"
      error-title="Couldn't load your agent."
      empty-message="No systems to show yet: your agent has no headquarters and no ships."
      :retry="refetchAgent"
    >
      <div class="markets-page-groups">
        <MarketplaceGroup
          v-for="system in systems"
          :key="system.systemSymbol"
          :system-symbol="system.systemSymbol"
          :is-headquarters="system.isHeadquarters"
          :ships="ships"
        />
      </div>
    </QueryState>
  </div>
</template>

<style scoped>
.markets-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--space-5);
}

.markets-page-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.markets-page-intro {
  margin: 0;
  max-width: 48rem;
  color: var(--color-text-muted);
}

.markets-page-groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
