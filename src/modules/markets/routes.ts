import type { RouteRecordRaw } from 'vue-router';

export const marketsRoutes: RouteRecordRaw[] = [
  {
    path: '/markets',
    component: () => import('@/modules/markets/pages/markets-page.vue'),
    meta: { title: 'Markets' },
  },
];
