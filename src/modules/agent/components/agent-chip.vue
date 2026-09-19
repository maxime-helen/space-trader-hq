<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

import { useAgentQuery } from '@/modules/agent/api/queries';
import { useSessionStore } from '@/modules/auth';

import CreditsAmount from './credits-amount.vue';

const { data: agent } = useAgentQuery();

const session = useSessionStore();

const open = ref(false);
const chip = useTemplateRef<HTMLElement>('chip');

onClickOutside(chip, () => {
  open.value = false;
});

const toggle = () => {
  open.value = !open.value;
};

const onSignOut = () => {
  open.value = false;
  session.signOut();
};
</script>

<template>
  <div ref="chip" class="agent-chip">
    <template v-if="agent">
      <button class="agent-chip-button" type="button" @click="toggle">
        <span class="agent-chip-symbol">{{ agent.symbol }}</span>
        <CreditsAmount class="agent-chip-credits" :credits="agent.credits" />
        <span class="agent-chip-caret" aria-hidden="true">▾</span>
      </button>

      <div v-if="open" class="agent-chip-menu">
        <button class="agent-chip-menu-item" type="button" @click="onSignOut">Sign out</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.agent-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.agent-chip-button {
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: var(--border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.agent-chip-button:hover {
  border-color: var(--color-text-muted);
}

.agent-chip-button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.agent-chip-symbol {
  font-weight: var(--weight-semibold);
}

.agent-chip-credits {
  color: var(--color-text-muted);
}

.agent-chip-caret {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.agent-chip-menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 100%;
  background: var(--color-surface-raised);
  border: var(--border);
  border-radius: var(--radius-control);
  padding: var(--space-1);
  z-index: 1;
}

.agent-chip-menu-item {
  font: inherit;
  display: block;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.agent-chip-menu-item:hover {
  background: var(--color-row-hover);
}
</style>
