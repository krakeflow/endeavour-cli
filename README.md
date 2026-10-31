# endeavour-cli

Script the Endeavour public docs API without hand-built integrations. Built with Effect v4.

## Install

The CLI is currently distributed from the public GitHub repository. The install runs the Node
launcher, which uses a native Bun binary when a matching platform package is present and otherwise
falls back to the bundled JavaScript.

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

> An npm package with per-platform optional dependencies may be published later once the CLI name
> and API stabilize. Until then, `npx` uses the JavaScript fallback.

## Usage

```sh
endeavour docs list [--json]
endeavour docs read <id>
endeavour openapi [-o FILE]
```

Point at prod instead of dev with `--base-url https://app.kevinkraemer.com`.

## Develop

Requires [Bun](https://bun.com) canary (pinned in `mise.toml`) and Node 26 or later for the
JavaScript fallback path. Stable Bun 1.4.4 has `bun fmt` but not `bun lint`; a `lint` script on
stable recurses forever. Type stripping runs the TypeScript entry directly.

```sh
mise install
bun install
bun run typecheck
bun run lint
bun run fmt:check
bun run smoke
```

`bun run build` cross-compiles plain `bun build --compile` binaries into
`dist/endeavour-cli-<os>-<arch>[-baseline][-musl]/` and also writes the JavaScript fallback at
`dist/endeavour.js`. `bun run build:single` builds only the host platform package.
`bun run build:js` writes only the JavaScript fallback.

`bun run lint` and `bun run fmt` use Bun's built-in linter and formatter
([lint](https://bun.com/docs/lint), [format](https://bun.com/docs/format)).

### Experimental Bun AOT binary

Optional and host-only. The default binary build is plain `--compile`, which cross-compiles on
stable and canary Bun. [Bun AOT](https://bun.com/docs/compiler/aot) is experimental and does not
cross-compile.

```sh
bun run compile:aot   # writes dist/endeavour (gitignored)
./dist/endeavour --help
```

A real AOT binary is about 60 MB and prints `--help` in about 12 ms on linux x64. If you see about
100 MB and about 60 ms, the build emitted a regular compiled binary instead of AOT.
