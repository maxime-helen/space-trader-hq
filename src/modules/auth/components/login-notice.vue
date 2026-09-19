<script setup lang="ts">
type LoginNoticeProps = {
  tone?: 'danger' | 'muted';
  title?: string;
};

const { tone = 'muted', title = '' } = defineProps<LoginNoticeProps>();
</script>

<template>
  <p class="login-notice" :class="tone">
    <strong v-if="title.length > 0" class="login-notice-title">{{ title }}</strong>
    <span><slot /></span>
  </p>
</template>

<style scoped>
.login-notice {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border: var(--border);
  border-radius: var(--radius-control);
  background: var(--color-surface-raised);
  color: var(--color-text-muted);
  font-size: var(--text-md);
  line-height: var(--leading-normal);
}

.login-notice.danger {
  border-color: var(--color-danger);
}

.login-notice-title {
  color: var(--color-text);
  font-weight: var(--weight-semibold);
}

.login-notice.danger .login-notice-title {
  color: var(--color-danger);
}
</style>
