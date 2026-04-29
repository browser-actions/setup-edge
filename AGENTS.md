# Agentic Coding Guide

This file provides guidance for AI coding agents working in this repository.

## Repository Purpose

`setup-edge` is a GitHub Action that installs Microsoft Edge on GitHub Actions runners. It supports `stable`, `beta`, `dev`, and `canary` channels on Windows, macOS, and Linux.

## Commands

```bash
pnpm install --frozen-lockfile   # install dependencies
pnpm lint                        # lint with Biome (CI mode, no auto-fix)
pnpm lint:fix                    # lint with auto-fix
pnpm test                        # run all unit tests with Vitest
pnpm test -- --reporter=verbose  # verbose test output
npx vitest run __test__/<file>.test.ts  # run a single test file
pnpm build                       # compile TypeScript → dist/index.js
pnpm package                     # copy action.yml + README.md into dist/
```

## Project Layout

```
src/
  index.ts              # action entry point: reads inputs, selects installer, sets outputs
  platform.ts           # OS/arch detection → Platform struct
  params.ts             # input parsing and validation (edge-version)
  installer.ts          # Installer interface
  installer_linux.ts    # Edge installer for Linux (apt-based)
  installer_mac.ts      # Edge installer for macOS (pkg-based)
  installer_windows.ts  # Edge installer for Windows (msi/winget-based)
  edge_api.ts           # client for the Edge update/release API
  watch.ts              # utilities for polling/watching install state
__test__/
  edge_api.test.ts      # tests for Edge API client
  testdata.json         # JSON fixtures for API responses
action.yml              # action metadata: inputs, outputs, runs.using: node24
biome.json              # linter/formatter config
```

## Architecture

The action detects the current platform and delegates to the appropriate platform-specific installer class. `edge_api.ts` resolves the concrete version number for the requested channel by querying the Microsoft Edge update API.

## Testing

Tests live in `__test__/` and use [Vitest](https://vitest.dev/).

- `testdata.json` provides mock API response fixtures.
- Tests mock network calls; no real HTTP requests are made.

## Conventions

- **TypeScript strict mode** — all types must be explicit; avoid `any`.
- **Linter:** Biome — run `pnpm lint` before committing. `useLiteralKeys` and `noUselessElse` rules are disabled.
- **Formatter:** Biome with space indentation.
- **Conventional Commits** are required for all commits (`feat:`, `fix:`, `chore:`, etc.).
- **Never commit `dist/`** — it is built by CI and deployed to the `latest` branch on release.
- The `action.yml` `main` field points to `index.js` inside `dist/`, not the TypeScript source.
