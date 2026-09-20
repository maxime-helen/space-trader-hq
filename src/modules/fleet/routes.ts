import type { RouteRecordRaw } from 'vue-router';

export const fleetRoutes: RouteRecordRaw[] = [
  {
    path: '/fleet',
    component: () => import('@/modules/fleet/pages/fleet-page.vue'),
    meta: { title: 'Fleet' },
  },
  {
    path: '/fleet/:shipSymbol',
    component: () => import('@/modules/fleet/pages/ship-detail-page.vue'),
    meta: { title: 'Ship' },
  },
];
