#!/usr/bin/env bun
/**
 * Cross-compile plain `bun build --compile` binaries for every supported
 * platform package. AOT is a separate, host-only script (`compile:aot`).
 *
 * Shape mirrors opencode's packages/cli/script/build.ts (optionalDependencies
 * per os/cpu/libc) at the smallest size that fits this CLI.
 */
import { $ } from "bun"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import pkg from "../package.json"

type Target = {
    os: "linux" | "darwin" | "win32"
    arch: "x64" | "arm64"
    abi?: "musl"
    avx2?: false
}

const dir = path.resolve(import.meta.dirname, "..")
const outdir = path.join(dir, "dist")
process.chdir(dir)

const allTargets: Target[] = [
    { os: "linux", arch: "x64" },
    { os: "linux", arch: "x64", avx2: false },
    { os: "linux", arch: "arm64" },
    { os: "linux", arch: "x64", abi: "musl" },
    { os: "linux", arch: "arm64", abi: "musl" },
    { os: "darwin", arch: "x64" },
    { os: "darwin", arch: "arm64" },
    { os: "win32", arch: "x64" },
]

const single = process.argv.includes("--single")
const targets = single
    ? allTargets.filter(
          (item) =>
              item.os === process.platform &&
              item.arch === process.arch &&
              item.avx2 !== false &&
              item.abi === undefined,
      )
    : allTargets

if (!targets.length) {
    throw new Error(`No build target matches ${process.platform}/${process.arch}`)
}

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

// JS fallback for the Node launcher when platform packages are not installed.
await $`bunx tsc -p tsconfig.json`
await $`chmod +x dist/endeavour.js`

for (const item of targets) {
    const name = packageName(item)
    const bunTarget = compileTarget(item)
    const binDir = path.join(outdir, name, "bin")
    await mkdir(binDir, { recursive: true })
    const outfile = path.join(binDir, "endeavour")
    console.log(`building ${name} (${bunTarget})`)
    const result = await Bun.build({
        entrypoints: ["./bin/endeavour.ts"],
        compile: {
            target: bunTarget as Bun.Build.CompileTarget,
            outfile,
            autoloadBunfig: false,
            autoloadDotenv: false,
            autoloadTsconfig: true,
            autoloadPackageJson: true,
        },
    })
    if (!result.success) {
        for (const log of result.logs) console.error(log)
        process.exit(1)
    }
    await Bun.write(
        path.join(outdir, name, "package.json"),
        `${JSON.stringify(
            {
                name,
                version: pkg.version,
                description: `endeavour-cli binary for ${name.replace(/^endeavour-cli-/, "")}`,
                license: pkg.license,
                preferUnplugged: true,
                bin: {
                    endeavour: item.os === "win32" ? "./bin/endeavour.exe" : "./bin/endeavour",
                },
                ...platformFields(item),
            },
            null,
            4,
        )}\n`,
    )
}

function packageName(item: Target) {
    return ["endeavour-cli", item.os === "win32" ? "windows" : item.os, item.arch, item.avx2 === false ? "baseline" : undefined, item.abi]
        .filter(Boolean)
        .join("-")
}

function compileTarget(item: Target) {
    return ["bun", item.os === "win32" ? "windows" : item.os, item.arch, item.avx2 === false ? "baseline" : undefined, item.abi]
        .filter(Boolean)
        .join("-")
}

/** npm selects Linux packages by os, cpu, and libc. Omitting libc installs every libc variant. */
function platformFields(item: Target) {
    return {
        os: [item.os],
        cpu: [item.arch],
        ...(item.os === "linux" ? { libc: [item.abi ?? "glibc"] } : {}),
    }
}
