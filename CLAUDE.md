# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Postiz (self-hosted/white-labeled builds may brand as "publishr" — see Branding note below) is a social media and chat scheduling tool covering 28+ channels (X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Discord, Slack, Mastodon, Bluesky, Telegram, etc.). Core capabilities: scheduling/calendar, analytics, team collaboration, a media library, and a marketplace for buying/selling posts between team members. There is no functional difference between the hosted and self-hosted versions.

## Commands

This is a PNPM monorepo (`pnpm-workspace.yaml`: `apps/*`, `libraries/*`) with a single root `package.json` for dependencies. Node `>=22.12.0 <23`, pnpm `10.6.1`. **Always use pnpm** — never npm/yarn.

```bash
pnpm install                    # install everything from the root

# Local infra (Postgres, Redis, pgAdmin, RedisInsight, Temporal+Elasticsearch) — dev only
pnpm run dev:docker

# Dev servers (parallel): extension, orchestrator, backend, frontend
pnpm run dev
pnpm run dev-backend             # just backend + frontend
pnpm run dev:frontend            # single app (clears dist first)
pnpm run dev:backend
pnpm run dev:orchestrator
pnpm run dev:stripe              # dev + `stripe listen --forward-to localhost:3000/stripe`

# Prisma (schema at libraries/nestjs-libraries/src/database/prisma/schema.prisma)
pnpm run prisma-generate
pnpm run prisma-db-push          # --accept-data-loss, dev convenience
pnpm run prisma-db-pull
pnpm run prisma-reset            # force-reset — destructive, local only

# Build
pnpm run build                   # frontend + backend + orchestrator
pnpm run build:frontend / build:backend / build:orchestrator / build:extension

# Tests — Jest via NX project discovery (`jest.config.ts` -> getJestProjects()).
# Note: as of writing there are no *.spec.ts/*.test.ts files anywhere in the repo,
# so this currently has nothing to run.
pnpm test

# Lint — ESLint flat config. Root config is eslint.config.mjs; apps/frontend has its
# own eslint.config.mjs override. Run scoped to an app, e.g.:
npx eslint apps/frontend
npx eslint apps/backend
```

Default dev ports: frontend `4200`, backend `3000` (`BACKEND_INTERNAL_URL` in `.env`). Individual app commands can also be run with `pnpm --filter ./apps/<name> run <script>`.

## Architecture

### Apps (`apps/`)
- **`backend`** — NestJS API (`apps/backend/src/api/routes/*.controller.ts` for the authenticated app API, `apps/backend/src/public-api/routes` for the public API).
- **`orchestrator`** — NestJS + Temporal. Contains all post-scheduling workflows (`src/workflows`), activities (`src/activities`), and signals (`src/signals`). This is where scheduled posts actually get executed.
- **`frontend`** — Next.js (App Router). Not Vite — routes live under `apps/frontend/src/app` using route groups: `(app)` for the authenticated product (`(site)` sub-group for billing/onboarding-style full-page screens), `(provider)` for OAuth provider callback pages, `(extension)` for the browser extension's popup UI.
- **`extension`** — Browser extension, built with Vite.
- **`commands`** — NestJS-based CLI/one-off command runner.
- **`sdk`** — `@postiz/node`, the published Node SDK for the public API.

### Shared libraries (`libraries/`)
- **`nestjs-libraries`** — almost all backend/orchestrator business logic lives here, organized by domain (e.g. `database/prisma/<domain>/`, `integrations`, `temporal`, `redis`, `emails`, `chat`, `agent`, `videos`, `openai`, `3rdparties`). `apps/backend` itself is thin — mostly controllers that import from here.
- **`helpers`** — cross-cutting utilities (auth, decorators, config, `custom.fetch` hook, subdomain handling) shared by backend and frontend.
- **`react-shared-libraries`** — shared frontend building blocks: form components, toaster, i18next translation setup (`translation/i18next.ts`, `translation/i18n.config.ts`, `translation/locales/<lang>/translation.json`), Sentry.

### Backend layering — no shortcuts
```
Controller (apps/backend) -> Service -> Repository
```
or, where there's cross-cutting orchestration logic:
```
Controller -> Manager -> Service -> Repository
```
Services/Repositories/Managers live under `libraries/nestjs-libraries/src/database/prisma/<domain>/` (e.g. `posts.service.ts` + `posts.repository.ts`); Managers for things spanning multiple providers live at the feature root (e.g. `integrations/integration.manager.ts`, `videos/video.manager.ts`, `3rdparties/thirdparty.manager.ts`). Controllers should stay thin and just call into libs.

### Social/channel integrations
Each supported channel is a `*.provider.ts` file in `libraries/nestjs-libraries/src/integrations/social/` (e.g. `linkedin.provider.ts`, `mastodon.provider.ts`, `youtube.provider.ts`), wired up through `integration.manager.ts`. Adding a new platform means adding a provider here, not touching the controller layer.

### Frontend conventions
- UI primitives live in `apps/frontend/src/components/ui`; feature components are organized by domain under `apps/frontend/src/components/<domain>` (billing, launches, onboarding, settings, etc.).
- Always fetch through SWR using the `useFetch` hook from `libraries/helpers/src/utils/custom.fetch.tsx` — don't use raw `fetch`.
- **Each SWR call must live in its own hook** and follow `react-hooks/rules-of-hooks` — never suppress with `eslint-disable-next-line`. Valid:
  ```ts
  const useCommunity = () => useSWR(...);
  ```
  Invalid (conditional hook call hidden inside a returned object):
  ```ts
  const useCommunity = () => ({
    communities: () => useSWR<CommunitiesListResponse>('communities', getCommunities),
    providers: () => useSWR<ProvidersListResponse>('providers', getProviders),
  });
  ```
- Tailwind 3 with CSS-variable-based design tokens. Before writing/styling any component, check `apps/frontend/src/app/colors.scss`, `apps/frontend/src/app/global.scss`, and `apps/frontend/tailwind.config.cjs`, and look at existing components for the established look. All `--color-custom*` tokens are **deprecated** — use the `--new-*` tokens instead.
- Never install frontend UI component libraries from npm — write native components.
- All user-facing copy must go through `useT()` (from `@gitroom/react/translation/get.transation.service.client`) with an English default, e.g. `t('some_key', 'Some Text')`, so it can be localized. New keys need adding to every locale under `libraries/react-shared-libraries/src/translation/locales/<lang>/translation.json` — check with a script/grep across locales rather than assuming a key that already has a JS `t()` call actually has translations, since that has historically drifted. Brand names (`publishr`) and technical acronyms (API, OAuth, MCP, CLI) are conventionally left untranslated across locales.

### Branding: Postiz vs. "publishr"
`IS_GENERAL` env var (checked via `isGeneralServerSide()` in `libraries/helpers/src/utils/is.general.server.side.ts`, and `useVariables()`'s `isGeneral` on the frontend) toggles white-label branding: when set, product-facing strings/UI say "publishr" instead of "Postiz"/"Gitroom". Expect to see both names used conditionally throughout the codebase and translation files.

### Data & infra
- Prisma ORM, PostgreSQL by default. Schema: `libraries/nestjs-libraries/src/database/prisma/schema.prisma`.
- Redis + BullMQ for queues/caching.
- Temporal for scheduled/background workflows (via `orchestrator`).
- Resend for transactional email.
- Stripe for billing (webhook route: backend `/stripe`, see `dev:stripe` script).

### Sentry logging
Import as `import * as Sentry from "@sentry/nextjs"`, initialize with `enableLogs: true`, and use `const { logger } = Sentry` for structured logs (`logger.info`, `logger.warn`, `logger.error`, etc., with a context object as the second arg, and `logger.fmt` for template-literal interpolation).

## Working in this repo

- The system is **in production with many users** — changes must not break existing users; a data migration may be required for schema/behavior changes.
- Use conventional commits (`feat:`, `fix:`, `chore:`, ...).
- Keep `.env.example` updated when introducing new environment variables.
- Whenever you generate a PR, PR description, or similar, **always** follow the PR Template (`.github/PULL_REQUEST_TEMPLATE.md`).
