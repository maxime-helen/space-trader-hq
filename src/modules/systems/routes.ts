import type { RouteRecordRaw } from 'vue-router';

export const systemsRoutes: RouteRecordRaw[] = [
  {
    path: '/systems',
    component: () => import('@/modules/systems/pages/systems-page.vue'),
    meta: { title: 'Systems' },
  },
  {
    path: '/systems/:systemSymbol',
    component: () => import('@/modules/systems/pages/system-detail-page.vue'),
    meta: { title: 'System' },
  },
  {
    path: '/systems/:systemSymbol/waypoints/:waypointSymbol',
    component: () => import('@/modules/systems/pages/waypoint-detail-page.vue'),
    meta: { title: 'Waypoint' },
  },
];
