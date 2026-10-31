# endeavour-cli

Script the Endeavour public docs API without hand-built integrations. Built with Effect v4.

## Install

The CLI is currently distributed directly from the public GitHub repository.

Run without installing:

```sh
npx github:krakeflow/endeavour-cli docs list
```

Or install it globally from GitHub:

```sh
npm install -g github:krakeflow/endeavour-cli
```

Then run:

```sh
endeavour docs list
```

> An npm package may be published later once the CLI name and API stabilize.

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

### Experimental Bun AOT binary

Optional. Node and `npx` stay the supported install path. [Bun AOT](https://bun.com/docs/compiler/aot) is experimental. It needs the canary Bun pinned in `mise.toml`, because stable 1.4.4 has no real AOT compiler.

```sh
mise install   # installs canary Bun (locked in mise.lock)
pnpm compile   # writes dist/endeavour (gitignored)
./dist/endeavour --help
```

`pnpm compile` runs `bun build --compile --aot --trim --outfile dist/endeavour ./bin/endeavour.ts`. Build on each target platform. AOT does not cross-compile. The locked canary revision is `1.4.4-canary.1+da867c60b`. A real AOT binary is about 60 MB and prints `--help` in about 12 ms. If you see about 100 MB and about 60 ms, the build used a stable Bun and emitted JIT instead.

