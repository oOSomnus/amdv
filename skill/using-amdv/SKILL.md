---
name: using-amdv
description: Use when previewing generated Markdown plans for human review, or when agent needs to show rendered Markdown to user for feedback
---

# amdv

Markdown viewer desktop app built with Tauri 2.x. **Use proactively when agent finishes writing a Markdown plan and needs human review before proceeding.**

## Usage

```bash
amdv <file.md>           # Basic preview
amdv -i <file.md>        # Interactive review mode
amdv --interactive <file.md>
```

**When to use `-i`:** Agent generated a plan/decision and needs user to Accept/Reject before proceeding. Interactive mode shows Accept/Reject buttons with optional note field.

**When to skip `-i`:** User just wants to read the file without making a decision.

**If amdv not installed:** Provide `pnpm install:app` to build and install `~/.local/bin/amdv`.

## Interactive Review Mode

When `-i` or `--interactive` is passed:
- Action bar appears with **Accept** and **Reject** buttons
- Optional note field for comments
- Close confirmation dialog on window close
- Auto-reloads every 1.5s (picks up file changes during editing)

## Data Flow

1. CLI receives `amdv <file.md>` argument
2. Rust (`src-tauri/src/lib.rs::setup()`) captures path and passes to frontend via `window.__MD_FILE__`
3. Frontend (`src/main.ts`) calls `invoke('read_markdown_file')` to read file
4. `marked.parse()` renders HTML, displayed with GitHub Markdown CSS

## Key Files

| Path | Purpose |
|------|---------|
| `src-tauri/src/lib.rs` | Rust entry: `read_markdown_file` command + `is_interactive_mode()` |
| `src/main.ts` | Frontend: Tauri IPC, `marked.parse()`, auto-refresh, action bar |

## Build Commands

```bash
pnpm dev          # Dev server (port 1420)
pnpm tauri dev    # Run Tauri dev
pnpm build        # Build web + Tauri app
pnpm build:web    # Frontend only → dist/
pnpm install:app  # Build and install ~/.local/bin/amdv
```
