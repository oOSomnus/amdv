import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return false;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  return true;
}

let removed = [];

if (isWindows) {
  const appDir = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
    "Programs",
    "amdv"
  );
  const binDir = path.join(os.homedir(), ".local", "bin");

  if (removeIfExists(appDir)) removed.push(appDir);
  if (removeIfExists(path.join(binDir, "amdv.cmd"))) removed.push(path.join(binDir, "amdv.cmd"));
  if (removeIfExists(path.join(binDir, "amdv.ps1"))) removed.push(path.join(binDir, "amdv.ps1"));
} else if (isMac) {
  const appPath = path.join(os.homedir(), "Applications", "amdv.app");
  const shimPath = path.join(os.homedir(), ".local", "bin", "amdv");

  if (removeIfExists(appPath)) removed.push(appPath);
  if (removeIfExists(shimPath)) removed.push(shimPath);
} else {
  const binaryPath = path.join(os.homedir(), ".local", "bin", "amdv");
  if (removeIfExists(binaryPath)) removed.push(binaryPath);
}

if (removed.length === 0) {
  console.log("No amdv installation was found.");
} else {
  console.log("Removed:");
  for (const item of removed) {
    console.log(`- ${item}`);
  }
}
