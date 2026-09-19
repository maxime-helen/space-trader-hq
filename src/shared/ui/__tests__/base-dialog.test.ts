import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import BaseDialog from '@/shared/ui/base-dialog.vue';

const showModalCalls: HTMLDialogElement[] = [];
const escapeHandlers = new WeakMap<HTMLDialogElement, (event: KeyboardEvent) => void>();

beforeAll(() => {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      if (this.open) throw new Error('showModal() on an already open dialog');
      showModalCalls.push(this);
      this.open = true;

      const onKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        this.dispatchEvent(new Event('cancel'));
        this.close();
      };
      escapeHandlers.set(this, onKeydown);
      this.addEventListener('keydown', onKeydown);
    },
    close(this: HTMLDialogElement) {
      if (!this.open) return;
      this.open = false;

      const onKeydown = escapeHandlers.get(this);
      if (onKeydown) this.removeEventListener('keydown', onKeydown);
      this.dispatchEvent(new Event('close'));
    },
  });
});

beforeEach(() => {
  showModalCalls.length = 0;
});

afterEach(() => {
  document.body.innerHTML = '';
});

const mountDialog = (open: boolean) =>
  mount(BaseDialog, {
    props: { open, heading: 'Navigate to X1-DF55-B7?' },
    slots: { default: 'The trip uses 64 fuel.', actions: '<button type="button">Navigate</button>' },
    attachTo: document.body,
  });

describe('BaseDialog', () => {
  it('renders a native <dialog> with its heading, body and actions', () => {
    const wrapper = mountDialog(false);

    expect(wrapper.element.tagName).toBe('DIALOG');
    expect(wrapper.find('.base-dialog-heading').text()).toBe('Navigate to X1-DF55-B7?');
    expect(wrapper.text()).toContain('The trip uses 64 fuel.');
    expect(wrapper.find('.base-dialog-actions button').text()).toBe('Navigate');
  });

  it('stays closed, and renders no actions area, when it has no actions', () => {
    const wrapper = mount(BaseDialog, { props: { open: false }, slots: { default: 'Body' } });

    expect(showModalCalls).toHaveLength(0);
    expect((wrapper.element as HTMLDialogElement).open).toBe(false);
    expect(wrapper.find('.base-dialog-actions').exists()).toBe(false);
    expect(wrapper.find('.base-dialog-heading').exists()).toBe(false);
  });

  it('opens with showModal(), which is what brings the backdrop and Escape', async () => {
    const wrapper = mountDialog(false);

    await wrapper.setProps({ open: true });

    expect(showModalCalls).toEqual([wrapper.element]);
    expect((wrapper.element as HTMLDialogElement).open).toBe(true);
  });

  it('opens with showModal() when it is mounted already open', () => {
    const wrapper = mountDialog(true);

    expect(showModalCalls).toEqual([wrapper.element]);
    expect((wrapper.element as HTMLDialogElement).open).toBe(true);
  });

  it('closes on Escape and reports it through update:open', async () => {
    const wrapper = mountDialog(true);

    await wrapper.trigger('keydown', { key: 'Escape' });

    expect((wrapper.element as HTMLDialogElement).open).toBe(false);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('ignores other keys', async () => {
    const wrapper = mountDialog(true);

    await wrapper.trigger('keydown', { key: 'Enter' });

    expect((wrapper.element as HTMLDialogElement).open).toBe(true);
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('closes when the page turns it off', async () => {
    const wrapper = mountDialog(true);

    await wrapper.setProps({ open: false });

    expect((wrapper.element as HTMLDialogElement).open).toBe(false);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('does not reopen a dialog that is already showing', async () => {
    const wrapper = mountDialog(true);
    const spy = vi.spyOn(wrapper.element as HTMLDialogElement, 'showModal');

    await wrapper.setProps({ open: true });

    expect(spy).not.toHaveBeenCalled();
  });
});
