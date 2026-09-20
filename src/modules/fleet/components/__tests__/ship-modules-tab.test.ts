import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ShipModulesTab from '@/modules/fleet/components/ship-modules-tab.vue';
import { buildShip } from '@/shared/api/__tests__/fixtures';
import type { Ship } from '@/shared/api/types';

const render = (ship: Ship): VueWrapper => mount(ShipModulesTab, { props: { ship } });

const fitted = buildShip({
  frame: { condition: 0.92, integrity: 0.88, quality: 3 },
  reactor: { condition: 0.97, integrity: 0.95, powerOutput: 31 },
  engine: { condition: 0.81, integrity: 0.9, speed: 30 },
});

describe('ShipModulesTab', () => {
  it('shows frame, reactor and engine, each named', () => {
    const cards = render(fitted).findAll('.ship-modules-component');

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.find('.base-card-title').text())).toEqual([
      'FrameFrigate',
      'ReactorFission Reactor I',
      'EngineIon Drive II',
    ]);
  });

  it('shows condition and integrity as meters, in percent', () => {
    const frame = render(fitted).findAll('.ship-modules-component')[0];

    expect(frame?.text()).toContain('92%');
    expect(frame?.text()).toContain('88%');
    expect(frame?.findAll('meter')).toHaveLength(2);
  });

  it('shows quality, and the reactor’s power output and the engine’s speed', () => {
    const cards = render(fitted).findAll('.ship-modules-component');

    expect(cards[0]?.text()).toContain('Quality3');
    expect(cards[1]?.text()).toContain('Power output31');
    expect(cards[2]?.text()).toContain('Speed30');
  });

  it('keeps each description behind a <details>, opened on demand', () => {
    const details = render(fitted).findAll('.ship-modules-component details');

    expect(details).toHaveLength(3);
    expect(details[0]?.attributes('open')).toBeUndefined();
    expect(details[0]?.find('summary').text()).toBe('Description');
    expect(details[0]?.find('p').text()).toBe('A medium-sized, multi-purpose spacecraft.');
  });

  it('lists modules with capacity, range and their requirements', () => {
    const wrapper = render(
      buildShip({
        modules: [
          {
            symbol: 'MODULE_CARGO_HOLD_II',
            name: 'Cargo Hold II',
            description: 'More room.',
            capacity: 40,
            requirements: { power: 2, crew: 3, slots: 1 },
          },
        ],
      }),
    );
    const table = wrapper.findAll('table')[0];

    expect(table?.findAll('thead th').map((cell) => cell.text())).toEqual([
      'Name',
      'Capacity',
      'Range',
      'Power',
      'Crew',
      'Slots',
    ]);
    // `range` is absent on a cargo hold: an em dash, not an empty cell or a NaN.
    expect(table?.findAll('tbody td').map((cell) => cell.text())).toEqual(['Cargo Hold II', '40', '—', '2', '3', '1']);
  });

  it('lists mounts with strength and their requirements', () => {
    const wrapper = render(
      buildShip({
        mounts: [
          {
            symbol: 'MOUNT_MINING_LASER_I',
            name: 'Mining Laser I',
            description: 'Cuts rock.',
            strength: 10,
            requirements: { power: 1, crew: 1 },
          },
        ],
      }),
    );
    const table = wrapper.findAll('table')[0];

    expect(table?.findAll('thead th').map((cell) => cell.text())).toEqual([
      'Name',
      'Strength',
      'Power',
      'Crew',
      'Slots',
    ]);
    expect(table?.findAll('tbody td').map((cell) => cell.text())).toEqual(['Mining Laser I', '10', '1', '1', '—']);
  });

  it('shows empty states rather than empty tables', () => {
    const wrapper = render(buildShip());

    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.findAll('.ship-modules-empty').map((empty) => empty.text())).toEqual([
      'This ship has no modules.',
      'This ship has no mounts.',
    ]);
  });
});
