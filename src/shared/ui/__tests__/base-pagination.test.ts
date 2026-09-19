import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BasePagination from '@/shared/ui/base-pagination.vue';

const pageLabels = (wrapper: ReturnType<typeof mount>): string[] =>
  wrapper.findAll('.base-pagination-page, .base-pagination-gap').map((node) => node.text());

describe('BasePagination', () => {
  it('numbers every page when they all fit', () => {
    const wrapper = mount(BasePagination, { props: { page: 1, pageCount: 4 } });

    expect(pageLabels(wrapper)).toEqual(['1', '2', '3', '4']);
    expect(wrapper.findAll('.base-pagination-page').every((button) => button.element.tagName === 'BUTTON')).toBe(true);
  });

  it('keeps the first, the last and a window around the current page, with gaps between', () => {
    const wrapper = mount(BasePagination, { props: { page: 1, pageCount: 425 } });

    expect(pageLabels(wrapper)).toEqual(['1', '2', '…', '425']);
  });

  it('widens the window with siblingCount', () => {
    const wrapper = mount(BasePagination, { props: { page: 10, pageCount: 20, siblingCount: 2 } });

    expect(pageLabels(wrapper)).toEqual(['1', '…', '8', '9', '10', '11', '12', '…', '20']);
  });

  it('marks the current page', () => {
    const wrapper = mount(BasePagination, { props: { page: 3, pageCount: 5 } });

    expect(wrapper.find('.base-pagination-page.is-current').text()).toBe('3');
    expect(wrapper.findAll('.base-pagination-page.is-current')).toHaveLength(1);
  });

  it('emits the page asked for and leaves the rendered page alone: the caller owns it', async () => {
    const wrapper = mount(BasePagination, { props: { page: 1, pageCount: 5 } });

    await wrapper.findAll('.base-pagination-page')[1]?.trigger('click');

    expect(wrapper.emitted('update:page')).toEqual([[2]]);
    // No internal page state, and no loading state either: page 1 stays marked until the caller
    // passes the new page back, so the previous page's rows can stay on screen while it loads.
    expect(wrapper.find('.base-pagination-page.is-current').text()).toBe('1');

    await wrapper.setProps({ page: 2 });
    expect(wrapper.find('.base-pagination-page.is-current').text()).toBe('2');
  });

  it('steps with Previous and Next', async () => {
    const wrapper = mount(BasePagination, { props: { page: 3, pageCount: 5 } });
    const steps = wrapper.findAll('.base-pagination-step');

    await steps[0]?.trigger('click');
    await steps[1]?.trigger('click');

    expect(wrapper.emitted('update:page')).toEqual([[2], [4]]);
  });

  it('disables the step it cannot take at either end', () => {
    const first = mount(BasePagination, { props: { page: 1, pageCount: 5 } });
    expect(first.findAll('.base-pagination-step')[0]?.attributes('disabled')).toBeDefined();
    expect(first.findAll('.base-pagination-step')[1]?.attributes('disabled')).toBeUndefined();

    const last = mount(BasePagination, { props: { page: 5, pageCount: 5 } });
    expect(last.findAll('.base-pagination-step')[0]?.attributes('disabled')).toBeUndefined();
    expect(last.findAll('.base-pagination-step')[1]?.attributes('disabled')).toBeDefined();
  });

  it('stays silent on the current page and outside the range', async () => {
    const wrapper = mount(BasePagination, { props: { page: 1, pageCount: 3 } });

    await wrapper.find('.base-pagination-page.is-current').trigger('click');
    await wrapper.findAll('.base-pagination-step')[0]?.trigger('click');

    expect(wrapper.emitted('update:page')).toBeUndefined();
  });

  it('emits nothing while the caller has it disabled', async () => {
    const wrapper = mount(BasePagination, { props: { page: 2, pageCount: 5, disabled: true } });

    await wrapper.findAll('.base-pagination-page')[0]?.trigger('click');

    expect(wrapper.emitted('update:page')).toBeUndefined();
    expect(wrapper.findAll('.base-pagination-page').every((button) => 'disabled' in button.attributes())).toBe(true);
    // Still legible: the numbers stay on screen rather than being swapped for a loading state.
    expect(pageLabels(wrapper)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('takes custom step labels', () => {
    const wrapper = mount(BasePagination, {
      props: { page: 1, pageCount: 2, previousLabel: 'Older', nextLabel: 'Newer' },
    });

    expect(wrapper.findAll('.base-pagination-step').map((step) => step.text())).toEqual(['Older', 'Newer']);
  });

  it('renders only the steps when there are no pages', () => {
    const wrapper = mount(BasePagination, { props: { page: 1, pageCount: 0 } });

    expect(wrapper.findAll('.base-pagination-page')).toHaveLength(0);
    expect(wrapper.findAll('.base-pagination-step')).toHaveLength(2);
    expect(wrapper.findAll('.base-pagination-step').every((step) => 'disabled' in step.attributes())).toBe(true);
  });
});
