import '@/styles/reset.css';
import '@/styles/tokens.css';

import { VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { createQueryClient } from '@/app/providers/query-client';
import { connectAuthToApiClient } from '@/modules/auth';

import App from './app.vue';
import { router } from './router';

const app = createApp(App);
const queryClient = createQueryClient();

app.use(createPinia());
app.use(VueQueryPlugin, { queryClient });
app.use(router);

connectAuthToApiClient({ router, queryClient });

app.mount('#app');
