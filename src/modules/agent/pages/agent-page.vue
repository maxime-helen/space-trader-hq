<script setup lang="ts">
import { watchEffect } from 'vue';

import { useAgentQuery, useServerStatusQuery } from '@/modules/agent/api/queries';
import AgentHeader from '@/modules/agent/components/agent-header.vue';
import OnwardLinks from '@/modules/agent/components/onward-links.vue';
import ServerCard from '@/modules/agent/components/server-card.vue';
import { formatPageTitle } from '@/shared/lib/format';
import QueryState from '@/shared/ui/query-state.vue';
import StarField from '@/shared/ui/star-field.vue';

const { data: agent, isError: agentFailed, isFetching: agentFetching, refetch: refetchAgent } = useAgentQuery();

const {
  data: server,
  isError: serverFailed,
  isFetching: serverFetching,
  refetch: refetchServer,
} = useServerStatusQuery();

watchEffect(() => {
  if (agent.value !== undefined) document.title = formatPageTitle(agent.value.symbol);
});
</script>

<template>
  <div class="agent-page">
    <StarField />

    <div class="agent-page-content">
      <section class="agent-page-identity">
        <QueryState
          :has-data="agent !== undefined"
          :fetching="agentFetching"
          :error="agentFailed"
          error-title="Couldn't load your agent."
          :retry="refetchAgent"
        >
          <AgentHeader
            v-if="agent !== undefined"
            :symbol="agent.symbol"
            :credits="agent.credits"
            :headquarters="agent.headquarters"
            :starting-faction="agent.startingFaction"
            :ship-count="agent.shipCount"
          />
        </QueryState>
      </section>

      <section class="agent-page-server">
        <QueryState
          :has-data="server !== undefined"
          :fetching="serverFetching"
          :error="serverFailed"
          error-title="Couldn't load the server status."
          :retry="refetchServer"
        >
          <ServerCard v-if="server !== undefined" :server="server" />
        </QueryState>
      </section>

      <section class="agent-page-onward">
        <h2 class="agent-page-onward-title">Where to next</h2>
        <OnwardLinks />
      </section>
    </div>
  </div>
</template>

<style scoped>
.agent-page {
  position: relative;
  isolation: isolate;
  /* The sky has to reach the bottom of the viewport, and the shell gives the page no definite
     height to fill, so the top bar's height is rebuilt here from its own tokens: the bar's
     padding, the agent chip's padding and border (its tallest child), one line of base text, and
     the bar's bottom border. */
  --topbar-height: calc(2 * var(--space-3) + 2 * var(--space-2) + var(--text-base) * var(--leading-normal) + 3px);
  min-height: calc(100dvh - var(--topbar-height));
}

.agent-page-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-7) var(--space-5) var(--space-6);
}

.agent-page-identity {
  padding-bottom: var(--space-2);
}

.agent-page-server {
  max-width: 34rem;
}

.agent-page-onward-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}
</style>
