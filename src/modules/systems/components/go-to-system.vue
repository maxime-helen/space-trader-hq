<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { systemPath } from '@/shared/lib/paths';
import { normalizeSymbol, toSystemSymbol } from '@/shared/lib/symbols';
import BaseButton from '@/shared/ui/base-button.vue';
import BaseField from '@/shared/ui/base-field.vue';

const router = useRouter();

const input = ref('');
const error = ref('');

const onSubmit = () => {
  const normalized = normalizeSymbol(input.value);
  if (normalized.length === 0) {
    error.value = 'Enter a system or waypoint symbol, like X1-DF55.';
    return;
  }

  const systemSymbol = toSystemSymbol(normalized);
  if (systemSymbol === undefined) {
    error.value = `There's no system ${normalized}. Check the symbol, or browse the list below.`;
    return;
  }

  error.value = '';
  void router.push(systemPath(systemSymbol));
};
</script>

<template>
  <section class="go-to-system">
    <h2 class="go-to-system-title">Go to system</h2>
    <form class="go-to-system-form" @submit.prevent="onSubmit">
      <BaseField
        v-model="input"
        class="go-to-system-field"
        :error="error"
        placeholder="System or waypoint symbol, like X1-DF55"
        autocapitalize="characters"
        spellcheck="false"
      />
      <BaseButton type="submit">Go</BaseButton>
    </form>
  </section>
</template>

<style scoped>
.go-to-system-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
}

.go-to-system-form {
  display: flex;
  align-items: start;
  gap: var(--space-3);
  max-width: 34rem;
}

.go-to-system-field {
  flex: 1;
}
</style>
