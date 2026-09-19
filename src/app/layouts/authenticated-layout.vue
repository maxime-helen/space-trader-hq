<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { AgentChip } from '@/modules/agent';
import { useArrivalNotifications } from '@/modules/notifications';
import { useToasts } from '@/shared/composables/use-toasts';
import BaseToast from '@/shared/ui/base-toast.vue';

import RouteErrorBoundary from './route-error-boundary.vue';

useArrivalNotifications();
const { toasts, dismiss } = useToasts();

type NavItem = {
  label: string;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Agent', path: '/' },
  { label: 'Systems', path: '/systems' },
  { label: 'Fleet', path: '/fleet' },
  { label: 'Markets', path: '/markets' },
];

const route = useRoute();

const isCurrent = (path: string): boolean => (path === '/' ? route.path === '/' : route.path.startsWith(path));

const navItems = computed(() => NAV_ITEMS.map((item) => ({ ...item, isCurrent: isCurrent(item.path) })));
</script>

<template>
  <div class="layout">
    <header class="layout-topbar">
      <span class="layout-brand">SpaceTradersHQ</span>
      <nav class="layout-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="layout-nav-link"
          :class="{ 'is-current': item.isCurrent }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="layout-chip">
        <AgentChip />
      </div>
    </header>

    <main class="layout-content">
      <RouteErrorBoundary>
        <RouterView />
      </RouteErrorBoundary>
    </main>

    <div class="layout-toasts">
      <BaseToast
        v-for="toast in toasts"
        :key="toast.id"
        :badge="toast.badge"
        :badge-variant="toast.badgeVariant"
        :subject="toast.subject"
        :message="toast.message"
        :action-label="toast.action?.label"
        :action-to="toast.action?.to"
        @dismiss="dismiss(toast.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.layout-toasts {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 22rem;
  z-index: 10;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.layout-topbar {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-5);
  border-bottom: var(--border);
  background: var(--color-bg);
}

.layout-brand {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.layout-nav {
  display: flex;
  gap: var(--space-1);
}

.layout-nav-link {
  color: var(--color-text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-control);
}

.layout-nav-link:hover {
  color: var(--color-text);
}

.layout-nav-link.is-current {
  color: var(--color-text);
  background: var(--color-surface-raised);
}

.layout-chip {
  margin-left: auto;
}

.layout-content {
  flex: 1;
}
</style>
