# Luma Space

Luma Space is the public-facing React Router app for work published from a Luma workspace. Visitors can browse published projects, work items, cycles, and intake forms without signing in to the main workspace app.

It runs on port 3002 via `pnpm dev` and shares types, services, i18n, editor, and UI packages from `packages/*`. It talks to the same Django API used by `apps/web`; see the [root README](../../README.md) for setup and the technology stack.
