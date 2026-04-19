# amdv

A Markdown viewer built with Tauri + vanilla TypeScript.

Its primary use case is helping an agent quickly preview a Markdown plan for the
user after the agent finishes writing the plan. The agent can call the `amdv`
CLI with a generated `.md` file and immediately show the rendered result.

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

Example:

```bash
amdv ./plan.md
```

This is useful when an agent has just written a plan in Markdown and wants to
open a fast local preview for the user through the CLI.

### Interactive Review Mode

```bash
amdv -i <file.md>
amdv --interactive <file.md>
```

In interactive mode, an action bar appears with **Accept** and **Reject** buttons
plus an optional note field. This enables human-in-the-loop review of generated
plans before the agent proceeds.

### Themes

```bash
amdv --list-themes        # List available themes
amdv --set-theme <name>   # Set default theme (persisted)
amdv -st <name>           # Shorthand for --set-theme
```

Available themes:

- `github-light` - GitHub Light (default)
- `github-dark` - GitHub Dark
- `dracula` - Dracula

The theme preference is stored in `~/.config/amdv/config.json` and persists across sessions.

See [docs/themes.md](docs/themes.md) for how to add a new theme.

## Skills

This project includes Claude Code skills for the agent workflow:

```bash
# Install skills (from project root)
claude skill add ./skill/using-amdv
```

Available skills:

- `using-amdv` — Use when previewing generated Markdown plans for human review

License: MIT
