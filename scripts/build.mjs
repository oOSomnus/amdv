import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const platformNames = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
};

const platformLabel = platformNames[process.platform] ?? process.platform;

console.log(`Building amdv for ${platformLabel}...`);
console.log(
  "Tauri bundles installers/packages for the current host platform. " +
    "Run this command on each target OS to produce native artifacts."
);

const result = spawnSync("pnpm", ["tauri", "build", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

