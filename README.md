# endeavour-cli

Script the Endeavour public docs API without hand-built integrations. Built with Effect v4.

## Install

```sh
npm install -g endeavour-cli
```

Or run without installing:

```sh
npx endeavour-cli docs list
```

## Usage

```sh
endeavour docs list [--json]
endeavour docs read <id>
endeavour openapi [-o FILE]
```

Point at prod instead of dev with `--base-url https://app.kevinkraemer.com`.

## Develop

Requires Node 26 or later. Type stripping runs the TypeScript entry directly, so no build
step is needed for development. Keep new syntax erasable so `node ./bin/endeavour.ts` keeps
working without a compiler.

```sh
pnpm install
pnpm typecheck
pnpm smoke
```

`pnpm build` compiles to `dist` for publishing. `prepublishOnly` runs the build automatically.
