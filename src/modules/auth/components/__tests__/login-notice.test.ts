import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LoginNotice from '@/modules/auth/components/login-notice.vue';

describe('LoginNotice', () => {
  it('renders the message it is given', () => {
    const wrapper = mount(LoginNotice, { slots: { default: 'Your token stopped working.' } });

    expect(wrapper.text()).toContain('Your token stopped working.');
  });

  it('shows a title only when one is passed', () => {
    expect(mount(LoginNotice).find('.login-notice-title').exists()).toBe(false);
    expect(
      mount(LoginNotice, { props: { title: 'Your session ended' } })
        .get('.login-notice-title')
        .text(),
    ).toBe('Your session ended');
  });

  it('is muted by default and marked danger for a session that ended', () => {
    expect(mount(LoginNotice).classes()).toContain('muted');
    expect(mount(LoginNotice, { props: { tone: 'danger' } }).classes()).toContain('danger');
  });
});
