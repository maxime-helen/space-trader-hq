<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from 'vue-router';

type BaseBreadcrumbsProps = {
  items: { label: string; to?: RouteLocationRaw }[];
};

const { items } = defineProps<BaseBreadcrumbsProps>();
</script>

<template>
  <nav class="base-breadcrumbs">
    <ol class="base-breadcrumbs-list">
      <li v-for="(item, index) in items" :key="index" class="base-breadcrumbs-item">
        <RouterLink v-if="item.to !== undefined" :to="item.to">{{ item.label }}</RouterLink>
        <span v-else>{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.base-breadcrumbs-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  list-style: none;
  margin: 0;
  padding: 0;
}

.base-breadcrumbs-list a {
  color: var(--color-text-muted);
}

.base-breadcrumbs-item + .base-breadcrumbs-item::before {
  content: '›';
  margin-right: var(--space-2);
}
</style>
