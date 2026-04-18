import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "src-tauri", "target", "release");
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

function ensureBuilt() {
  const artifactExists = isMac
    ? fs.existsSync(path.join(releaseDir, "bundle", "macos", "amdv.app"))
    : fs.existsSync(path.join(releaseDir, isWindows ? "amdv.exe" : "amdv"));

  if (artifactExists) {
    return;
  }

  console.log("No release artifact found. Building amdv first...");
  const result = spawnSync("node", [path.join(__dirname, "build.mjs")], {
    cwd: rootDir,
    stdio: "inherit",
    shell: isWindows,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function writeFileExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  if (!isWindows) {
    fs.chmodSync(filePath, 0o755);
  }
}

function installUnixBinary() {
  const sourceBinary = path.join(releaseDir, "amdv");
  const binDir = path.join(os.homedir(), ".local", "bin");
  const targetBinary = path.join(binDir, "amdv");

  fs.mkdirSync(binDir, { recursive: true });
  fs.copyFileSync(sourceBinary, targetBinary);
  fs.chmodSync(targetBinary, 0o755);

  return {
    installedPath: targetBinary,
    pathHint: binDir,
  };
}

function installWindowsBinary() {
  const sourceBinary = path.join(releaseDir, "amdv.exe");
  const appDir = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
    "Programs",
    "amdv"
  );
  const binDir = path.join(os.homedir(), ".local", "bin");
  const targetBinary = path.join(appDir, "amdv.exe");
  const cmdShim = path.join(binDir, "amdv.cmd");
  const psShim = path.join(binDir, "amdv.ps1");

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.copyFileSync(sourceBinary, targetBinary);

  writeFileExecutable(cmdShim, `@echo off\r\n"${targetBinary}" %*\r\n`);
  writeFileExecutable(psShim, `& "${targetBinary}" @args\r\n`);

  return {
    installedPath: targetBinary,
    pathHint: binDir,
  };
}

function installMacApp() {
  const sourceApp = path.join(releaseDir, "bundle", "macos", "amdv.app");
  const appDir = path.join(os.homedir(), "Applications");
  const targetApp = path.join(appDir, "amdv.app");
  const binDir = path.join(os.homedir(), ".local", "bin");
  const shimPath = path.join(binDir, "amdv");
  const appExecutable = path.join(targetApp, "Contents", "MacOS", "amdv");

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.rmSync(targetApp, { recursive: true, force: true });
  fs.cpSync(sourceApp, targetApp, { recursive: true });
  writeFileExecutable(shimPath, `#!/usr/bin/env sh\nexec "${appExecutable}" "$@"\n`);

  return {
    installedPath: targetApp,
    pathHint: binDir,
  };
}

ensureBuilt();

const result = isWindows
  ? installWindowsBinary()
  : isMac
    ? installMacApp()
    : installUnixBinary();

console.log(`Installed amdv to ${result.installedPath}`);
console.log(`If needed, add ${result.pathHint} to your PATH.`);

