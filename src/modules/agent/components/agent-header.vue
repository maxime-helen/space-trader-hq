<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { formatApiValue, formatNumber } from '@/shared/lib/format';
import { FLEET_PATH, waypointPathFor } from '@/shared/lib/paths';

import CreditsAmount from './credits-amount.vue';

type AgentHeaderProps = {
  symbol: string;
  credits: number;
  headquarters: string;
  startingFaction: string;
  shipCount: number;
};

const { symbol, credits, headquarters, startingFaction, shipCount } = defineProps<AgentHeaderProps>();

const headquartersLink = computed(() => waypointPathFor(headquarters));

const shipCountLabel = computed(() => `${formatNumber(shipCount)} ${shipCount === 1 ? 'ship' : 'ships'}`);
</script>

<template>
  <header class="agent-header">
    <p class="agent-header-eyebrow">Agent</p>
    <h1 class="agent-header-symbol">{{ symbol }}</h1>

    <CreditsAmount class="agent-header-credits" :credits="credits" badge size="display" />

    <dl class="agent-header-facts">
      <div class="agent-header-fact">
        <dt>Headquarters</dt>
        <dd>
          <RouterLink v-if="headquartersLink !== undefined" :to="headquartersLink">{{ headquarters }}</RouterLink>
          <span v-else>{{ headquarters }}</span>
        </dd>
      </div>
      <div class="agent-header-fact">
        <dt>Starting faction</dt>
        <dd>{{ formatApiValue(startingFaction) }}</dd>
      </div>
      <div class="agent-header-fact">
        <dt>Ships</dt>
        <dd>
          <RouterLink :to="FLEET_PATH">{{ shipCountLabel }}</RouterLink>
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.agent-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.agent-header-eyebrow {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin: 0;
}

.agent-header-symbol {
  margin: 0;
  font-size: var(--text-display);
  font-weight: var(--weight-light);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-display);
  text-shadow: 0 0 2.5rem var(--sky-glow);
}

.agent-header-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-6);
  margin: var(--space-2) 0 0;
}

.agent-header-fact dt {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.agent-header-fact dd {
  margin: 0;
  font-size: var(--text-base);
}

.agent-header-fact a {
  color: var(--color-accent);
  text-decoration: none;
}

.agent-header-fact a:hover {
  text-decoration: underline;
}
</style>
