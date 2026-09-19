import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AgentHeader from '@/modules/agent/components/agent-header.vue';

const AGENT = {
  symbol: 'VOYAGER-7-3',
  credits: 175_000,
  headquarters: 'X1-DF55-20250Z',
  startingFaction: 'COSMIC',
  shipCount: 2,
};

const mountHeader = (props: Partial<typeof AGENT> = {}) =>
  mount(AgentHeader, {
    props: { ...AGENT, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });

const linkTargets = (wrapper: ReturnType<typeof mountHeader>): unknown[] =>
  wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'));

describe('AgentHeader', () => {
  it('shows symbol, credits, headquarters, starting faction and ship count', () => {
    const text = mountHeader().text();

    expect(text).toContain('VOYAGER-7-3');
    expect(text).toContain('175,000 cr');
    expect(text).toContain('X1-DF55-20250Z');
    expect(text).toContain('Cosmic');
    expect(text).toContain('2 ships');
  });

  it('reads the ship count as a singular when the agent has one ship', () => {
    expect(mountHeader({ shipCount: 1 }).text()).toContain('1 ship');
  });

  it('shows negative credits in the danger color with a "Negative balance" badge', () => {
    const wrapper = mountHeader({ credits: -12_400 });

    expect(wrapper.text()).toContain('-12,400 cr');
    expect(wrapper.find('.credits-amount').classes()).toContain('is-negative');
    const badge = wrapper.find('.base-badge');
    expect(badge.text()).toBe('Negative balance');
    expect(badge.classes()).toContain('danger');
  });

  it('shows no badge and no danger color while the balance is positive', () => {
    const wrapper = mountHeader();

    expect(wrapper.find('.base-badge').exists()).toBe(false);
    expect(wrapper.find('.credits-amount').classes()).not.toContain('is-negative');
  });

  it('links the headquarters to its waypoint page and the ship count to the fleet', () => {
    expect(linkTargets(mountHeader())).toEqual(['/systems/X1-DF55/waypoints/X1-DF55-20250Z', '/fleet']);
  });

  it('shows a headquarters that is not a waypoint symbol as plain text', () => {
    const wrapper = mountHeader({ headquarters: 'UNKNOWN' });

    expect(wrapper.text()).toContain('UNKNOWN');
    expect(linkTargets(wrapper)).toEqual(['/fleet']);
  });
});
