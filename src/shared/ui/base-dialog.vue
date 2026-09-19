<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

type BaseDialogProps = {
  open: boolean;
  heading?: string;
};

const { open, heading = '' } = defineProps<BaseDialogProps>();

const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const dialog = ref<HTMLDialogElement | null>(null);

const sync = (shouldBeOpen: boolean) => {
  const element = dialog.value;
  if (element === null) return;

  if (shouldBeOpen && !element.open) {
    element.showModal();
  } else if (!shouldBeOpen && element.open) {
    element.close();
  }
};

onMounted(() => {
  sync(open);
});

watch(
  () => open,
  (shouldBeOpen) => {
    sync(shouldBeOpen);
  },
  { flush: 'post' },
);

const onClose = () => {
  emit('update:open', false);
};
</script>

<template>
  <dialog ref="dialog" class="base-dialog" @close="onClose">
    <h2 v-if="heading !== ''" class="base-dialog-heading">{{ heading }}</h2>
    <slot />
    <div v-if="$slots.actions" class="base-dialog-actions">
      <slot name="actions" />
    </div>
  </dialog>
</template>

<style scoped>
.base-dialog {
  background: var(--color-surface);
  border: var(--border);
  border-radius: var(--radius-card);
  padding: var(--space-5);
  width: min(100%, 22rem);
  color: var(--color-text);
  font-size: var(--text-base);
}

.base-dialog::backdrop {
  background: color-mix(in srgb, var(--color-bg) 72%, transparent);
}

.base-dialog-heading {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-display);
}

.base-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
