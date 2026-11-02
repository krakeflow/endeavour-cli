# endeavour-cli agent notes

- Bun is the only dev tool. `mise.toml` pins canary Bun because stable does not ship `bun lint` yet.
  Check the binary on PATH (`which bun`, `bun lint --help`), not the version string.
- `lint`, `fmt` and `fmt:check` pass `--no-script` so Bun runs the real tool. Keep that flag.
- Lint/format config: `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`, `.editorconfig`. Do not add `[lint]` or
  `[fmt]` to `bunfig.toml`.
- Shared Documentation and CI rules: captain `docs/agents/ci-gate.md` (never `--no-verify`; cloud CI
  on `main` / `workflow_dispatch` only).
- Local gate: `bun run check` (fmt, lint, typecheck, smoke). Lefthook runs it on pre-push.
- After a green push, optional GitHub status: `bun run check:signoff` (needs
  `gh extension install basecamp/gh-signoff`). Do not sign off when the check fails or HEAD is
  unpushed; the script refuses both.
