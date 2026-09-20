type Ranked = { shipCount: number };

export const sortSystemsByShips = <T extends Ranked>(systems: readonly T[]): T[] =>
  [...systems].sort((left, right) => right.shipCount - left.shipCount);
