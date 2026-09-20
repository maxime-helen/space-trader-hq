<script setup lang="ts">
import BaseButton from '@/shared/ui/base-button.vue';
import BaseDialog from '@/shared/ui/base-dialog.vue';

type ConfirmDialogProps = {
  heading: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  confirming?: boolean;
  confirmDisabled?: boolean;
};

const { cancelLabel = 'Cancel', danger, confirming, confirmDisabled } = defineProps<ConfirmDialogProps>();

const emit = defineEmits<{ confirm: [] }>();

const open = defineModel<boolean>('open', { default: false });

const onCancel = () => {
  open.value = false;
};

const onConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <BaseDialog v-model:open="open" class="confirm-dialog" :heading="heading">
    <div class="confirm-dialog-body">
      <slot />
    </div>

    <template #actions>
      <BaseButton class="confirm-dialog-cancel" :disabled="confirming" @click="onCancel">{{ cancelLabel }}</BaseButton>
      <BaseButton
        class="confirm-dialog-confirm"
        :variant="danger === true ? 'danger' : 'primary'"
        :loading="confirming"
        :disabled="confirmDisabled"
        @click="onConfirm"
        >{{ confirmLabel }}</BaseButton
      >
    </template>
  </BaseDialog>
</template>

<style scoped>
.confirm-dialog-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-md);
}
</style>
