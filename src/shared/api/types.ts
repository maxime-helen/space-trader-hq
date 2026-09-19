import type { components, operations, paths } from './schema';

export type { components, operations, paths };

type Schemas = components['schemas'];

//  Agent and server
export type Agent = Schemas['Agent'];
export type Faction = Schemas['Faction'];
export type ServerStatus = operations['get-status']['responses'][200]['content']['application/json'];

//  Fleet
export type Ship = Schemas['Ship'];
export type ShipNav = Schemas['ShipNav'];
export type ShipNavRoute = Schemas['ShipNavRoute'];
export type ShipNavStatus = Schemas['ShipNavStatus'];
export type ShipFuel = Schemas['ShipFuel'];
export type ShipCargo = Schemas['ShipCargo'];
export type ShipModule = Schemas['ShipModule'];
export type ShipMount = Schemas['ShipMount'];
export type Cooldown = Schemas['Cooldown'];

//  Geography
export type System = Schemas['System'];
export type SystemSymbol = Schemas['SystemSymbol'];
export type SystemWaypoint = Schemas['SystemWaypoint'];
export type Waypoint = Schemas['Waypoint'];
export type WaypointSymbol = Schemas['WaypointSymbol'];
export type WaypointType = Schemas['WaypointType'];
export type WaypointTrait = Schemas['WaypointTrait'];
export type WaypointTraitSymbol = Schemas['WaypointTraitSymbol'];
export type WaypointOrbital = Schemas['WaypointOrbital'];
export type WaypointModifier = Schemas['WaypointModifier'];
export type Chart = Schemas['Chart'];

export type Market = Schemas['Market'];
export type MarketTradeGood = Schemas['MarketTradeGood'];
export type TradeGood = Schemas['TradeGood'];
export type SupplyLevel = Schemas['SupplyLevel'];
export type ActivityLevel = Schemas['ActivityLevel'];
export type Shipyard = Schemas['Shipyard'];
export type ShipyardShip = Schemas['ShipyardShip'];

export type Meta = Schemas['Meta'];

export type Paginated<T> = { data: T[]; meta: Meta };

export const MAX_PAGE_LIMIT = 20;
