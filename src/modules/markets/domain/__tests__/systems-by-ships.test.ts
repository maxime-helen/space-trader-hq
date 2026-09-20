import { describe, expect, it } from 'vitest';

import { sortSystemsByShips } from '@/modules/markets/domain/systems-by-ships';

const system = (systemSymbol: string, shipCount: number, isHeadquarters = false) => ({
  systemSymbol,
  shipCount,
  isHeadquarters,
});

describe('sortSystemsByShips', () => {
  it('puts a system with ships ahead of headquarters when headquarters is empty', () => {
    const systems = [system('X1-AB12', 0, true), system('X1-KK42', 2)];

    expect(sortSystemsByShips(systems).map((s) => s.systemSymbol)).toEqual(['X1-KK42', 'X1-AB12']);
  });

  it('leaves headquarters first when that is where the fleet is', () => {
    const systems = [system('X1-AB12', 3, true), system('X1-KK42', 1)];

    expect(sortSystemsByShips(systems).map((s) => s.systemSymbol)).toEqual(['X1-AB12', 'X1-KK42']);
  });

  it('reads the busiest system first', () => {
    const systems = [system('X1-AB12', 1, true), system('X1-KK42', 5), system('X1-ZZ99', 2)];

    expect(sortSystemsByShips(systems).map((s) => s.systemSymbol)).toEqual(['X1-KK42', 'X1-ZZ99', 'X1-AB12']);
  });

  it("is stable: the systems module's own ordering survives a tie", () => {
    const systems = [system('X1-AB12', 0, true), system('X1-BB22', 0), system('X1-CC33', 0)];

    expect(sortSystemsByShips(systems).map((s) => s.systemSymbol)).toEqual(['X1-AB12', 'X1-BB22', 'X1-CC33']);
  });

  it("leaves the caller's array alone rather than sorting it in place", () => {
    const systems = [system('X1-AB12', 0, true), system('X1-KK42', 2)];

    sortSystemsByShips(systems);

    expect(systems.map((s) => s.systemSymbol)).toEqual(['X1-AB12', 'X1-KK42']);
  });

  it('handles an agent with no ships anywhere without reordering anything', () => {
    const systems = [system('X1-AB12', 0, true)];

    expect(sortSystemsByShips(systems).map((s) => s.systemSymbol)).toEqual(['X1-AB12']);
  });
});
