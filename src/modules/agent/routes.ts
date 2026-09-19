import type { RouteRecordRaw } from 'vue-router';

export const agentRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/modules/agent/pages/agent-page.vue'),
    meta: { title: 'Agent' },
  },
];
