// The markets module's public API.
//
// Everything else under `modules/markets/` is private. What leaves the module is:
//
//   - `MarketPanel`, rendered by the systems module inside the waypoint page's Market tab — a
//     market has no route of its own, so this is the one component that renders one;
//   - `marketKeys`, the cache contract the panel and the index share;
//   - the two read queries;
//   - the `/markets` route table, composed by the app shell.
//
// The domain functions stay inside: they are how this module keeps its promises, not part of what
// it promises.

export { marketKeys } from './api/keys';
export { useMarketplacesQuery, useMarketQuery } from './api/queries';
export { default as MarketPanel } from './components/market-panel.vue';
export { marketsRoutes } from './routes';
