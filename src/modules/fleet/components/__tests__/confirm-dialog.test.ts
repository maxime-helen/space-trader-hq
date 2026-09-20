import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import ConfirmDialog from '@/modules/fleet/components/confirm-dialog.vue';

import { installDialogStandIn } from './dialog-stand-in';

let showModalCalls: HTMLDialogElement[] = [];

beforeAll(() => {
  showModalCalls = installDialogStandIn();
});

afterEach(() => {
  showModalCalls.length = 0;
  document.body.innerHTML = '';
});

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(ConfirmDialog, {
    props: {
      open: true,
      heading: 'Navigate ALICE-1',
      confirmLabel: 'Navigate',
      ...props,
    },
    slots: { default: '<p class="body">Fuel 336 / 400.</p>' },
    attachTo: document.body,
  });

describe('ConfirmDialog', () => {
  it('opens as a modal, with the question, the detail and both buttons', () => {
    const wrapper = mountDialog();

    expect(showModalCalls).toHaveLength(1);
    expect(wrapper.find('.base-dialog-heading').text()).toBe('Navigate ALICE-1');
    expect(wrapper.find('.body').text()).toBe('Fuel 336 / 400.');
    expect(wrapper.find('.confirm-dialog-confirm').text()).toBe('Navigate');
    expect(wrapper.find('.confirm-dialog-cancel').text()).toBe('Cancel');
  });

  it('emits confirm only when Confirm is pressed', async () => {
    const wrapper = mountDialog();

    expect(wrapper.emitted('confirm')).toBeUndefined();
    await wrapper.find('.confirm-dialog-confirm').trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    // Confirming does not close it: the caller closes when its request has settled.
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('closes on Cancel without confirming', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.confirm-dialog-cancel').trigger('click');

    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('closes on Escape without confirming, because it is a native <dialog>', async () => {
    const wrapper = mountDialog();

    await wrapper.find('dialog').trigger('keydown', { key: 'Escape' });

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('dresses Confirm as the danger button when the action is flagged risky', () => {
    expect(mountDialog().find('.confirm-dialog-confirm').classes()).toContain('primary');
    expect(mountDialog({ danger: true }).find('.confirm-dialog-confirm').classes()).toContain('danger');
  });

  it('shows the spinner on Confirm while the request is in flight, and blocks a second press', async () => {
    const wrapper = mountDialog({ confirming: true });

    expect(wrapper.find('.confirm-dialog-confirm .base-button-spinner').exists()).toBe(true);
    expect(wrapper.find('.confirm-dialog-confirm').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.confirm-dialog-cancel').attributes('disabled')).toBeDefined();

    await wrapper.find('.confirm-dialog-confirm').trigger('click');
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('keeps Confirm out of reach until the caller says it is ready', async () => {
    const wrapper = mountDialog({ confirmDisabled: true });

    await wrapper.find('.confirm-dialog-confirm').trigger('click');

    expect(wrapper.find('.confirm-dialog-confirm').attributes('disabled')).toBeDefined();
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });
});
