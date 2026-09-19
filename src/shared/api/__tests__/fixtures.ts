import type {
  Agent,
  Cooldown,
  Market,
  MarketTradeGood,
  Meta,
  Paginated,
  ServerStatus,
  Ship,
  ShipCargo,
  ShipFuel,
  ShipNav,
  System,
  SystemWaypoint,
  TradeGood,
  Waypoint,
  WaypointTrait,
} from '@/shared/api/types';

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeRecords = (base: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const current = merged[key];
    merged[key] = isPlainObject(current) && isPlainObject(value) ? mergeRecords(current, value) : value;
  }
  return merged;
};

const build = <T extends object>(base: T, overrides: DeepPartial<T>): T =>
  mergeRecords(base as Record<string, unknown>, overrides as Record<string, unknown>) as T;

export const TEST_SYSTEM_SYMBOL = 'X1-AB12';
export const TEST_WAYPOINT_SYMBOL = 'X1-AB12-A1';
export const TEST_SHIP_SYMBOL = 'ALICE-1';

export const buildAgent = (overrides: DeepPartial<Agent> = {}): Agent =>
  build<Agent>(
    {
      accountId: 'acct-1',
      symbol: 'ALICE',
      headquarters: TEST_WAYPOINT_SYMBOL,
      credits: 175_000,
      startingFaction: 'COSMIC',
      shipCount: 2,
    },
    overrides,
  );

export const buildServerStatus = (overrides: DeepPartial<ServerStatus> = {}): ServerStatus =>
  build<ServerStatus>(
    {
      status: 'SpaceTraders is currently online and available to play',
      version: 'v2.3.0',
      resetDate: '2026-09-13',
      description: 'SpaceTraders is a headless API.',
      stats: { accounts: 10, agents: 1200, ships: 4300, systems: 12_000, waypoints: 180_000 },
      leaderboards: {
        mostCredits: [{ agentSymbol: 'ALICE', credits: 175_000 }],
        mostSubmittedCharts: [{ agentSymbol: 'ALICE', chartCount: 3 }],
      },
      serverResets: { next: '2026-09-27T00:00:00.000Z', frequency: 'fortnightly' },
      announcements: [{ title: 'Reset', body: 'The universe resets fortnightly.' }],
      links: [{ name: 'Website', url: 'https://spacetraders.io' }],
    },
    overrides,
  );

export const buildShipNav = (overrides: DeepPartial<ShipNav> = {}): ShipNav =>
  build<ShipNav>(
    {
      systemSymbol: TEST_SYSTEM_SYMBOL,
      waypointSymbol: TEST_WAYPOINT_SYMBOL,
      route: {
        destination: { symbol: TEST_WAYPOINT_SYMBOL, type: 'PLANET', systemSymbol: TEST_SYSTEM_SYMBOL, x: 10, y: 20 },
        origin: { symbol: TEST_WAYPOINT_SYMBOL, type: 'PLANET', systemSymbol: TEST_SYSTEM_SYMBOL, x: 10, y: 20 },
        departureTime: '2026-09-16T12:00:00.000Z',
        arrival: '2026-09-16T12:00:00.000Z',
      },
      status: 'DOCKED',
      flightMode: 'CRUISE',
    },
    overrides,
  );

export const buildShipFuel = (overrides: DeepPartial<ShipFuel> = {}): ShipFuel =>
  build<ShipFuel>(
    { current: 400, capacity: 400, consumed: { amount: 0, timestamp: '2026-09-16T12:00:00.000Z' } },
    overrides,
  );

export const buildShipCargo = (overrides: DeepPartial<ShipCargo> = {}): ShipCargo =>
  build<ShipCargo>({ capacity: 40, units: 0, inventory: [] }, overrides);

export const buildCooldown = (overrides: DeepPartial<Cooldown> = {}): Cooldown =>
  build<Cooldown>({ shipSymbol: TEST_SHIP_SYMBOL, totalSeconds: 0, remainingSeconds: 0 }, overrides);

export const buildShip = (overrides: DeepPartial<Ship> = {}): Ship =>
  build<Ship>(
    {
      symbol: TEST_SHIP_SYMBOL,
      registration: { name: TEST_SHIP_SYMBOL, factionSymbol: 'COSMIC', role: 'COMMAND' },
      nav: buildShipNav(),
      crew: { current: 57, required: 57, capacity: 80, rotation: 'STRICT', morale: 100, wages: 0 },
      frame: {
        symbol: 'FRAME_FRIGATE',
        name: 'Frigate',
        description: 'A medium-sized, multi-purpose spacecraft.',
        condition: 1,
        integrity: 1,
        moduleSlots: 8,
        mountingPoints: 5,
        fuelCapacity: 400,
        requirements: { power: 8, crew: 25 },
        quality: 1,
      },
      reactor: {
        symbol: 'REACTOR_FISSION_I',
        name: 'Fission Reactor I',
        description: 'A basic fission power reactor.',
        condition: 1,
        integrity: 1,
        powerOutput: 31,
        requirements: { crew: 8 },
        quality: 1,
      },
      engine: {
        symbol: 'ENGINE_ION_DRIVE_II',
        name: 'Ion Drive II',
        description: 'An advanced ion drive.',
        condition: 1,
        integrity: 1,
        speed: 30,
        requirements: { power: 6, crew: 8 },
        quality: 1,
      },
      cooldown: buildCooldown(),
      modules: [],
      mounts: [],
      cargo: buildShipCargo(),
      fuel: buildShipFuel(),
    },
    overrides,
  );

export const buildWaypointTrait = (overrides: DeepPartial<WaypointTrait> = {}): WaypointTrait =>
  build<WaypointTrait>(
    { symbol: 'MARKETPLACE', name: 'Marketplace', description: 'A thriving center of commerce.' },
    overrides,
  );

export const buildWaypoint = (overrides: DeepPartial<Waypoint> = {}): Waypoint =>
  build<Waypoint>(
    {
      symbol: TEST_WAYPOINT_SYMBOL,
      type: 'PLANET',
      systemSymbol: TEST_SYSTEM_SYMBOL,
      x: 10,
      y: 20,
      orbitals: [],
      traits: [buildWaypointTrait()],
      modifiers: [],
      isUnderConstruction: false,
    },
    overrides,
  );

export const buildSystemWaypoint = (overrides: DeepPartial<SystemWaypoint> = {}): SystemWaypoint =>
  build<SystemWaypoint>({ symbol: TEST_WAYPOINT_SYMBOL, type: 'PLANET', x: 10, y: 20, orbitals: [] }, overrides);

export const buildSystem = (overrides: DeepPartial<System> = {}): System =>
  build<System>(
    {
      symbol: TEST_SYSTEM_SYMBOL,
      sectorSymbol: 'X1',
      name: 'Alpha Bravo',
      type: 'ORANGE_STAR',
      x: -100,
      y: 250,
      waypoints: [buildSystemWaypoint()],
      factions: [{ symbol: 'COSMIC' }],
    },
    overrides,
  );

export const buildTradeGood = (overrides: DeepPartial<TradeGood> = {}): TradeGood =>
  build<TradeGood>({ symbol: 'FUEL', name: 'Fuel', description: 'High-grade ship fuel.' }, overrides);

export const buildMarketTradeGood = (overrides: DeepPartial<MarketTradeGood> = {}): MarketTradeGood =>
  build<MarketTradeGood>(
    {
      symbol: 'FUEL',
      type: 'EXCHANGE',
      tradeVolume: 100,
      supply: 'ABUNDANT',
      activity: 'STRONG',
      purchasePrice: 92,
      sellPrice: 88,
    },
    overrides,
  );

export const buildMarket = (overrides: DeepPartial<Market> = {}): Market =>
  build<Market>(
    {
      symbol: TEST_WAYPOINT_SYMBOL,
      exports: [buildTradeGood({ symbol: 'MACHINERY', name: 'Machinery' })],
      imports: [buildTradeGood({ symbol: 'FOOD', name: 'Food' })],
      exchange: [buildTradeGood()],
    },
    overrides,
  );

export const buildMeta = (overrides: DeepPartial<Meta> = {}): Meta =>
  build<Meta>({ total: 1, page: 1, limit: 20 }, overrides);

export const buildPage = <T>(items: T[], meta: DeepPartial<Meta> = {}): Paginated<T> => ({
  data: items,
  meta: buildMeta({ total: items.length, ...meta }),
});

export type ErrorBodyOptions = {
  message?: string;
  code?: number;
  data?: Record<string, unknown>;
};

export const buildErrorBody = (options: ErrorBodyOptions = {}): { error: ErrorBodyOptions } => ({
  error: {
    message: options.message ?? 'Something went wrong.',
    ...(options.code === undefined ? {} : { code: options.code }),
    ...(options.data === undefined ? {} : { data: options.data }),
  },
});

export const buildRateLimitBody = (retryAfterSeconds = 1): { error: ErrorBodyOptions } =>
  buildErrorBody({
    message: 'You have reached your API limit.',
    code: 429,
    data: { retryAfter: retryAfterSeconds, limitBurst: 2, limitPerSecond: 2 },
  });
