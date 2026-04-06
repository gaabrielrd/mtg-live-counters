# AGENTS.md

## Project mission

This repository contains the Magic Life Counter platform.

Core product goals:

- authenticate users with email/password and Google OAuth
- allow authenticated users to create Magic matches
- allow authenticated users to join a match by code or link
- show all players in a grid with life totals
- allow any player in the match to update any other player's life total
- propagate all life total changes in real time to all connected players
- allow public matches with open slots to be listed

Critical correctness requirements:

- authorization must always be enforced
- match state must remain consistent across clients
- backend is the source of truth for life totals
- real-time updates must never bypass persistence/validation

## Repository structure

Expected structure:

- apps/web: React + TypeScript + Tailwind frontend
- apps/api: HTTP API handlers and domain services
- apps/realtime: WebSocket handlers and realtime orchestration
- packages/shared: shared types, schemas, constants, DTOs
- infra: Terraform or CDK infrastructure code
- docs: architecture and operational documentation

If the actual structure differs, preserve existing conventions and update only within the established architecture.

## Technology constraints

- Frontend must use React + TypeScript + Tailwind
- Backend must use TypeScript
- Authentication must use AWS Cognito
- Google login must be implemented through Cognito federation
- Realtime must use AWS API Gateway WebSocket + Lambda
- Persistence must use DynamoDB
- Shared contracts should live in a shared package, not be duplicated
- Do not introduce a new framework without explicit instructions

## Development rules

- Prefer strict typing; avoid `any`
- Prefer small focused functions
- Keep business rules out of UI components
- Keep AWS-specific logic out of presentational components
- Keep validation close to API boundaries
- Reuse shared schemas/types when possible
- Do not hardcode secrets, tokens, or environment-specific URLs
- Do not add dependencies unless necessary

## Domain rules

- Only authenticated users can create matches
- Only authenticated users can join matches
- Default initial life total is 40
- Default max players is 4
- Maximum number of players is 8
- Public matches with open slots may be listed publicly
- Private matches must not appear in public listings
- Any player in a match may update any other player's life total
- Every life update must be validated, persisted, and then broadcast

## Realtime rules

- Backend is always the source of truth
- Never trust client-side local state as final state
- A life update must:
    1. authenticate actor
    2. verify actor belongs to the match
    3. verify target player exists in the match
    4. persist the new value or delta
    5. emit a broadcast event to connected clients
- On reconnect, prefer re-sync from server snapshot
- Handle stale/disconnected websocket connections defensively

## Files and ownership guidance

- UI pages/components belong under `apps/web`
- API routes, handlers, and domain services belong under backend services
- Shared DTOs, event payload types, and schemas belong under `packages/shared`
- Infra resources belong under `infra`
- Do not mix infra code into app runtime code

## Required validation before finishing

After making changes, run the relevant checks for the affected area.

Minimum required checks:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

If the repo is a monorepo, prefer scoped commands when appropriate:

- `pnpm --filter web lint`
- `pnpm --filter web test`
- `pnpm --filter api test`
- `pnpm --filter api build`
- `pnpm --filter realtime test`

If any check fails, fix the issue before considering the task complete.

## Definition of done

A task is done only if:

- the implementation matches the requested behavior
- code is type-safe and follows repository conventions
- lint/typecheck/build pass for affected packages
- relevant tests pass
- authorization is enforced where needed
- no debug-only code is left behind
- no unrelated files are modified
- documentation/contracts are updated when behavior changes

## Pull request guidance

When preparing a PR summary:

- summarize what changed
- explain why the change was necessary
- list affected areas (web/api/realtime/infra)
- list validation commands run
- call out risks, tradeoffs, or follow-up work

## Avoid

- introducing new architectural patterns without need
- duplicating schemas or contracts
- moving files unnecessarily
- making speculative refactors unrelated to the task
- weakening auth or validation to “make tests pass”
