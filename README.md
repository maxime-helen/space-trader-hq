# SpaceTradersHQ

A console for [SpaceTraders](https://spacetraders.io). Sign in with an agent token and browse your
agent, the systems of the universe, your fleet and the markets your ships can reach. The console
notifies you when a ship arrives, and can put a ship in orbit, dock it, or send it to another
waypoint.

## Getting started

Requires **Node 24** and **pnpm 10**.

```bash
pnpm install
pnpm dev
```

Then open the app and paste an agent token.

**Getting a token.** Create an account and an agent on
[spacetraders.io](https://spacetraders.io), then copy the **agent token** from your dashboard. It is
a long JWT. The console validates it against `GET /my/agent` before storing it, and "Remember on this
device" decides whether it survives a reload.

The universe resets periodically. When it does, every token from the previous reset stops working —
the console detects that, explains it, and sends you back to sign in with a new one.

## Scripts

| Script                              | What it does                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server with hot reload                                                        |
| `pnpm build`                        | Production build into `dist/`                                                     |
| `pnpm preview`                      | Serves the production build locally                                               |
| `pnpm typecheck`                    | TypeScript across `.ts` and `.vue`                                                |
| `pnpm lint` / `pnpm lint:fix`       | ESLint; warnings fail                                                             |
| `pnpm format` / `pnpm format:check` | Prettier                                                                          |
| `pnpm test` / `pnpm test:unit`      | Vitest, watching / once                                                           |
| `pnpm test:coverage`                | Tests plus coverage; fails below 80% lines on shared code and module domain logic |
| `pnpm api:sync [sha]`               | Re-downloads and bundles the OpenAPI spec at an upstream commit                   |
| `pnpm api:generate`                 | Regenerates `src/shared/api/schema.d.ts` from the OpenAPI spec                    |
| `pnpm api:check`                    | Fails when the committed types do not match the committed spec                    |
| `pnpm validate`                     | Everything CI checks, plus the build. Run it before pushing                       |

## How the project is structured

```
src/
├── app/          Bootstrap only: routes, guards, layout, providers.
├── shared/       No module knowledge. Imported by everyone.
│   ├── api/      Typed client, rate limiter, errors, generated schema
│   ├── ui/       Shared components: Base*, DataTable, QueryState
│   ├── composables/
│   └── lib/      Formatters, symbol parsing
├── modules/      One folder per feature: auth, agent, fleet, systems, markets, notifications
└── styles/       tokens.css, reset.css
```

Every module has the same shape, so learning one teaches you all of them:

```
modules/fleet/
├── index.ts      anything other modules may use
├── routes.ts
├── api/          keys.ts, queries.ts, mutations.ts (cache writes live here)
├── components/   Presentational, plus containers the module exports
├── pages/
└── domain/       Pure functions, no Vue imports, fast tests
```

**The dependency rules are enforced by lint, not by good intentions.** `shared/` imports nothing from
`modules/` or `app/`. A module imports from `shared/` and from other modules _only through their
`index.ts`. Only `app/` knows about every module. `eslint-plugin-boundaries` fails the build on any
violation, so `pnpm lint` is the architecture's test.

## The data layer

The API allows roughly **2 requests per second**, so the cache is the main app optimization.

- **A rate limiter spaces every request** (`shared/api/rate-limiter.ts`) to two per second with a
  burst of two, and the client retries a 429 after the `Retry-After` the API sends.
- **Mutations write their responses into the cache** instead of refetching. The API returns updated
  state on every write, so a follow-up GET would spend budget for nothing.
- **Stale times match how fast each resource actually changes** (`shared/api/stale-times.ts`).
- **Nothing is prefetched.** A speculative request would spend budget that the request you actually
  made then has to wait for.

### The API types are generated

`openapi/spacetraders.json` is a bundled copy of the upstream spec, pinned to a commit recorded in
`openapi/SOURCE`. `src/shared/api/schema.d.ts` is generated from it and **never edited by hand** —
`pnpm api:check` fails if the two drift apart, in either direction.

To move to a newer API:

```bash
pnpm api:sync <upstream-sha>
pnpm api:generate
pnpm typecheck        # fix whatever the new types break
```

Commit the spec, the types and the fixes together. The diff of `schema.d.ts` in that commit shows
exactly what changed in the API.

## Testing

```bash
pnpm test           # watch
pnpm test:coverage  # once, with the gate
```

Tests live in a `__tests__/` folder next to the code they test, named `*.test.ts`. Lint rejects a
test file anywhere else, because Vitest would silently never run it.

The network is mocked with MSW at the boundary, so component tests run through the real typed
client: middlewares, rate limiter and error handling included.

Two things worth knowing before you write a test here:

- **The rate limiter is real and global.** A request still queued when a test ends is sent during
  the next one: either drain the client in `afterEach`, or import a fresh client per test with
  `vi.resetModules()`, as the API tests do.
- **The rate limiter reads `Date.now()` and sleeps on `setTimeout`.** Under fake timers a request
  waits until the clock is advanced; `fakeClock()` and `settle()` in `test-support.ts` do that and
  record every sleep the limiter asked for.

## Deployment

The app builds to static files and deploys to GitHub Pages from `main` through
`.github/workflows/ci-cd.yml`.

## TODO

- Light theme: the app has a dark theme only.
- Mobile layouts: the app is designed for desktop screens only.
- Accessibility: not addressed yet.
- Internationalization: text, numbers, dates and times are in English (United States) only.
