<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LoginNotice from '@/modules/auth/components/login-notice.vue';
import { safeRedirect } from '@/modules/auth/domain/redirect';
import { looksLikeJwt, normalizeToken } from '@/modules/auth/domain/token';
import { seedAgentQuery } from '@/modules/auth/session/agent-seed';
import { useSessionStore } from '@/modules/auth/session/session.store';
import { fetchAgentWithToken } from '@/modules/auth/session/validate-token';
import { isApiError } from '@/shared/api/errors';
import BaseButton from '@/shared/ui/base-button.vue';
import BaseCard from '@/shared/ui/base-card.vue';
import BaseField from '@/shared/ui/base-field.vue';
import StarField from '@/shared/ui/star-field.vue';

const DASHBOARD_URL = 'https://my.spacetraders.io';

const MALFORMED_TOKEN_MESSAGE =
  "That doesn't look like an agent token. Paste the whole token from the SpaceTraders dashboard.";

const UNKNOWN_ERROR_MESSAGE = 'Something went wrong. Check your connection, then try again.';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const queryClient = useQueryClient();

const token = ref('');
const remember = ref(false);
const error = ref('');
const pending = ref(false);

const redirectTarget = computed(() => safeRedirect(route.query.redirect));
const hasExpired = computed(() => route.query.reason === 'expired');

// Without web storage the token lives in memory and a reload ends the session, so there is
// nothing for "Remember on this device" to promise.
const canRemember = computed(() => session.isStorageDurable);

const submit = async (): Promise<void> => {
  if (pending.value) return;
  error.value = '';

  const candidate = normalizeToken(token.value);
  if (!looksLikeJwt(candidate)) {
    error.value = MALFORMED_TOKEN_MESSAGE;
    return;
  }

  pending.value = true;
  try {
    const agent = await fetchAgentWithToken(candidate);
    session.signIn(candidate, { remember: remember.value });
    seedAgentQuery(queryClient, agent);
    await router.replace(redirectTarget.value);
  } catch (cause) {
    error.value = isApiError(cause) ? cause.message : UNKNOWN_ERROR_MESSAGE;
  } finally {
    pending.value = false;
  }
};

const onSubmit = (): void => {
  void submit();
};
</script>

<template>
  <main class="login-page">
    <StarField />

    <BaseCard class="login-card">
      <h1 class="login-title">SpaceTradersHQ</h1>
      <p class="login-lede">Paste your SpaceTraders agent token to open your console.</p>

      <LoginNotice v-if="hasExpired" tone="danger" title="Your session ended" data-testid="expiry-banner">
        Your token stopped working, which usually means the universe was reset. Paste a new agent token to sign in.
      </LoginNotice>

      <LoginNotice v-if="!canRemember" data-testid="storage-notice">
        This browser blocks site storage, so the token is kept for this tab only and a reload signs you out.
      </LoginNotice>

      <form class="login-form" novalidate @submit.prevent="onSubmit">
        <BaseField
          v-model="token"
          variant="textarea"
          label="Agent token"
          :error="error"
          rows="4"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
          data-testid="token-field"
        />

        <label class="login-remember" :class="{ 'is-disabled': !canRemember }">
          <input v-model="remember" type="checkbox" :disabled="!canRemember" data-testid="remember-checkbox" />
          <span>Remember on this device</span>
        </label>

        <BaseButton variant="primary" type="submit" :loading="pending" data-testid="submit-button">
          {{ pending ? 'Signing in…' : 'Sign in' }}
        </BaseButton>
      </form>

      <p class="login-hint">
        No token yet? Create an account and an agent on
        <a :href="DASHBOARD_URL" target="_blank" rel="noreferrer">SpaceTraders</a>, then paste the agent token here.
      </p>
    </BaseCard>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-4);
}

.login-card {
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.login-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.login-lede {
  margin: 0;
  color: var(--color-text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-md);
  color: var(--color-text-muted);
  cursor: pointer;
}

.login-remember.is-disabled {
  cursor: default;
  opacity: 0.6;
}

.login-hint {
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-text-muted);
}

.login-hint a {
  color: var(--color-accent);
}
</style>
