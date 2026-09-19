<script setup lang="ts">
import { computed } from 'vue';

import { isServerOnline, resetCountdown, resetFrequencyLabel } from '@/modules/agent/domain/server-status';
import type { ServerStatus } from '@/shared/api/types';
import { useClock } from '@/shared/composables/use-clock';
import { formatDate } from '@/shared/lib/format';
import BaseBadge from '@/shared/ui/base-badge.vue';
import BaseCard from '@/shared/ui/base-card.vue';

type ServerCardProps = {
  server: ServerStatus;
};

const { server } = defineProps<ServerCardProps>();

const now = useClock();

const online = computed(() => isServerOnline(server.status));

const countdown = computed(() => resetCountdown(server.serverResets.next, now.value));

const frequency = computed(() => resetFrequencyLabel(server.serverResets.frequency));
</script>

<template>
  <BaseCard class="server-card">
    <template #title>Server</template>
    <template #aside>
      <BaseBadge :variant="online ? 'positive' : 'danger'">{{ online ? 'Online' : 'Unavailable' }}</BaseBadge>
    </template>

    <dl class="server-card-rows">
      <div class="server-card-row">
        <dt>Status</dt>
        <dd>{{ server.status }}</dd>
      </div>
      <div class="server-card-row">
        <dt>API version</dt>
        <dd class="server-card-value">{{ server.version }}</dd>
      </div>
      <div class="server-card-row">
        <dt>Last reset</dt>
        <dd class="server-card-value">{{ formatDate(server.resetDate) }}</dd>
      </div>
      <div class="server-card-row">
        <dt>Next reset</dt>
        <dd>
          <span class="server-card-countdown" :class="{ 'is-reached': countdown.reached }">{{ countdown.label }}</span>
          <span class="server-card-frequency">{{ frequency }}</span>
        </dd>
      </div>
    </dl>
  </BaseCard>
</template>

<style scoped>
.server-card-rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-5);
  margin: 0;
}

.server-card-row {
  display: contents;
}

.server-card-row dt {
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.server-card-row dd {
  margin: 0;
  font-size: var(--text-md);
  min-width: 0;
}

.server-card-value {
  font-variant-numeric: tabular-nums;
}

.server-card-countdown {
  font-variant-numeric: tabular-nums;
}

.server-card-countdown.is-reached {
  color: var(--color-accent);
}

.server-card-frequency {
  color: var(--color-text-muted);
  margin-left: var(--space-2);
}
</style>
