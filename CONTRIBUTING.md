# Contributing to DisciFi Sentinel

## Development Workflow

1. Branch from `develop` for features, `main` for hotfixes
2. Write tests first (TDD preferred)
3. Run `pnpm lint && pnpm typecheck && pnpm test` before committing
4. Keep PRs focused on a single concern

## Commit Convention

```
<type>: <description>

Types: feat, fix, chore, docs, test, refactor, ci, security
```

## Code Standards

- TypeScript strict mode — no `any` without `// eslint-disable-next-line` justification
- All services export both class and singleton instance
- MongoDB schemas use explicit timestamps with `timestamps: true`
- Redis keys must be namespaced: `discifi:<context>:<key>`
- Environment variables validated via Zod schema at startup

## Adding a New Route

1. Create route file in `apps/backend/src/routes/`
2. Add any needed services in `apps/backend/src/services/`
3. Register in `apps/backend/src/routes/index.ts`
4. Add tests in `apps/backend/tests/integration/`

## Adding a New Anchor Program

1. Create program directory in `programs/` with `anchor new` pattern
2. Add to `Anchor.toml` workspace
3. Create client wrapper in `packages/anchor-sdk/src/`
4. Export from `packages/anchor-sdk/src/index.ts`

## Running Locally

```bash
docker compose up -d          # MongoDB + Redis
pnpm --filter @discifi/backend dev  # Backend with hot reload
anchor test                    # Run all Anchor program tests
```
