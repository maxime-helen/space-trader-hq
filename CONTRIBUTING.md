# Contributing

## Adding a module

A module is a feature folder under `src/modules/`. Copy the shape of an existing one:

```
modules/<name>/
├── index.ts      The public API. Everything else is private.
├── routes.ts     RouteRecordRaw[], lazily loaded, with meta.title
├── api/
│   ├── keys.ts       Query key factory
│   ├── queries.ts    Read
│   └── mutations.ts  Write, and the cache writes that follow
├── components/   Presentational; containers the module exports
├── pages/
└── domain/       Pure functions, no Vue imports
```

Then:

1. **Write `index.ts` first.** It is the only thing other modules can see, and it is what stops the
   rest of the codebase reaching into your internals. Export the routes, the queries other features
   genuinely need, and nothing else.
2. **Register the routes** in `src/app/router.ts`. Only the app shell composes routes; a module
   never imports another module's pages.
3. **Keep the logic in `domain/`.** Pure functions with no Vue imports get fast tests and no
   mocking. Anything that depends on the current time takes `now` as a parameter, so tests never
   depend on the clock.

The dependency rules are enforced by `eslint-plugin-boundaries`:

- `shared/` imports nothing from `modules/` or `app/`
- a module imports from `shared/` and from other modules **only through their `index.ts`**
- only `app/` knows about every module

`pnpm lint` fails on a violation, so the architecture is checked rather than described.

## Commit messages

Conventional Commits, enforced by commitlint on every commit.

```
<type>(<scope>): <subject>
```

**Types**: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`,
`test`.

**Scopes**: `app`, `api`, `ui`, `shared`, `auth`, `agent`, `fleet`, `systems`,
`markets`, `notifications`, `deps`, `tooling`. They match the modules, so a message reads against the
architecture:

```
feat(fleet): show a live ETA for a ship in transit
```

Every commit runs the same six checks CI does: the message, formatting of the staged content, the
lockfile, ESLint, TypeScript and the unit tests. The message is checked first, so a typo fails in
under a second instead of after everything else.

## Branches and pull requests

Branch names are `<type>/<short-description>`, using the commit types:

```
feat/fleet-list
fix/market-refresh
chore/upgrade-vite
```

The pre-push hook checks the name, and CI checks it again as its first step — before installing
dependencies, since the hook can be skipped.

Pull requests are merged with **Rebase and merge**, so every commit lands on `main` individually and
history stays linear. That means:

- rebase onto `main` rather than merging `main` into your branch
- answer review feedback with `git commit --fixup <sha>`, then fold them in before merging:

```bash
git rebase -i --autosquash origin/main
git push --force-with-lease
```

CI fails while a merge commit or a leftover `fixup!` is present, which accurately says the branch is
not ready.

## Regenerating the API types

`src/shared/api/schema.d.ts` is generated and must never be edited by hand. The spec it comes from is
vendored at a pinned commit so the same repository state always produces the same types.

```bash
pnpm api:sync <upstream-sha>   # download and bundle the spec at that commit
pnpm api:generate              # regenerate the types
pnpm typecheck                 # fix what the new types break
```

Commit the spec, the types and the fixes together:

```
chore(api): sync spec to <short-sha>
```

`pnpm api:check` runs in CI and in `pnpm validate`, and fails if the committed types do not match the
committed spec — which catches both a hand edit and a forgotten regeneration.

## Before you push

```bash
pnpm validate
```

It runs everything CI checks plus the build, cheapest first, and stops at the first failure.
