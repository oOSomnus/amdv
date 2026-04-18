# amdv

Markdown viewer built with Tauri + vanilla TypeScript.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm tauri dev
```

## Build

```bash
pnpm build
```

`pnpm build` uses Tauri to build native artifacts for the current host OS:

- Windows: `.exe` plus installer bundles
- macOS: `.app` plus disk image bundles
- Linux: native binary plus distro bundles

To generate installers for every platform, run the same command on each target
platform (or set up OS-specific CI runners).

## Install

```bash
pnpm install:app
```

This will build `amdv` if needed, then install a runnable `amdv` command:

- Windows: installs to `%LOCALAPPDATA%\Programs\amdv` and creates shims in `%USERPROFILE%\.local\bin`
- macOS: installs `~/Applications/amdv.app` and creates `~/.local/bin/amdv`
- Linux: installs `~/.local/bin/amdv`

If `amdv` is not found in your shell, add the reported `bin` directory to `PATH`.

## Uninstall

```bash
pnpm uninstall:app
```

## Usage

```bash
amdv <file.md>
```

## Tech

- Tauri 2 (Rust backend)
- Vanilla TypeScript frontend
- marked for Markdown parsing
- GitHub Markdown CSS
