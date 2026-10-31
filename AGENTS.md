# endeavour-cli agent notes

- Bun is the only dev tool. `mise.toml` pins canary Bun because stable does not ship `bun lint` yet.
  Check the binary on PATH (`which bun`, `bun lint --help`), not the version string; canary and
  stable can both report the same version.
- `lint`, `fmt` and `fmt:check` scripts pass `--no-script` so `bun lint` / `bun fmt` run the real
  tool instead of calling the script again forever. Keep that flag.
- Lint config lives only in `.oxlintrc.json`, format config only in `.oxfmtrc.json` plus
  `.editorconfig`. They also stop Bun from picking up captain's `vite.config.ts`. Do not add
  `[lint]` or `[fmt]` to `bunfig.toml`; those override the files. `bun lint --doctor` and
  `bun fmt --doctor` show which config won.
- Before pushing: `bun run typecheck`, `bun run lint`, `bun run fmt:check`, `bun run smoke`.
- CI workflows still call pnpm; changing them needs Kevin's yes.
