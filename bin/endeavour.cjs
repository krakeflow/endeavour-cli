#!/usr/bin/env node
"use strict"

const childProcess = require("node:child_process")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { createRequire } = require("node:module")

const requireFromHere = createRequire(__filename)
const args = process.argv.slice(2)
const forwardedSignals =
    process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGHUP"] : ["SIGINT", "SIGTERM", "SIGHUP", "SIGUSR1"]

function run(command, commandArgs) {
    const child = childProcess.spawn(command, commandArgs, { stdio: "inherit" })
    child.on("error", (error) => {
        console.error(error.message)
        process.exit(1)
    })
    const forwarders = {}
    for (const signal of forwardedSignals) {
        forwarders[signal] = () => {
            try {
                child.kill(signal)
            } catch {}
        }
        process.on(signal, forwarders[signal])
    }
    child.on("exit", (code, signal) => {
        for (const forwardedSignal of forwardedSignals) {
            process.removeListener(forwardedSignal, forwarders[forwardedSignal])
        }
        if (signal) return process.kill(process.pid, signal)
        process.exit(typeof code === "number" ? code : 0)
    })
}

const platform = { darwin: "darwin", linux: "linux", win32: "windows" }[os.platform()] || os.platform()
const arch = { x64: "x64", arm64: "arm64" }[os.arch()] || os.arch()
const binaryName = platform === "windows" ? "endeavour.exe" : "endeavour"
const base = `endeavour-cli-${platform}-${arch}`

function supportsAvx2() {
    if (arch !== "x64") return false
    if (platform === "linux") {
        try {
            return /(^|\s)avx2(\s|$)/i.test(fs.readFileSync("/proc/cpuinfo", "utf8"))
        } catch {
            return false
        }
    }
    if (platform === "darwin") {
        try {
            const result = childProcess.spawnSync("sysctl", ["-n", "hw.optional.avx2_0"], {
                encoding: "utf8",
                timeout: 1500,
            })
            return result.status === 0 && (result.stdout || "").trim() === "1"
        } catch {
            return false
        }
    }
    return false
}

function isMusl() {
    if (platform !== "linux") return false
    try {
        if (fs.existsSync("/etc/alpine-release")) return true
        const result = childProcess.spawnSync("ldd", ["--version"], { encoding: "utf8" })
        return `${result.stdout || ""}${result.stderr || ""}`.toLowerCase().includes("musl")
    } catch {
        return false
    }
}

function packageNames() {
    // Preference order matches packages script/build.ts emits. No baseline-musl build yet.
    const baseline = arch === "x64" && !supportsAvx2()
    if (platform === "linux") {
        if (isMusl()) {
            return [`${base}-musl`, base]
        }
        return arch === "x64"
            ? baseline
                ? [`${base}-baseline`, base, `${base}-musl`]
                : [base, `${base}-baseline`, `${base}-musl`]
            : [base, `${base}-musl`]
    }
    return arch === "x64" ? (baseline ? [`${base}-baseline`, base] : [base, `${base}-baseline`]) : [base]
}

function binaryFromPackage(name) {
    try {
        const packageJson = requireFromHere.resolve(`${name}/package.json`)
        return path.join(path.dirname(packageJson), "bin", binaryName)
    } catch {
        return null
    }
}

function binaryFromDist(name) {
    const candidate = path.join(__dirname, "..", "dist", name, "bin", binaryName)
    return fs.existsSync(candidate) ? candidate : null
}

function jsFallback() {
    const candidate = path.join(__dirname, "..", "dist", "endeavour.js")
    return fs.existsSync(candidate) ? candidate : null
}

const envPath = process.env.ENDEAVOUR_BIN_PATH
if (envPath) {
    run(envPath, args)
} else {
    let target = null
    for (const name of packageNames()) {
        target = binaryFromPackage(name) || binaryFromDist(name)
        if (target) break
    }
    if (target) {
        run(target, args)
    } else {
        const js = jsFallback()
        if (!js) {
            console.error(
                "endeavour-cli: no platform binary or dist/endeavour.js found. Run `bun run build:js` or install a platform package.",
            )
            process.exit(1)
        }
        run(process.execPath, [js, ...args])
    }
}
