---
name: using-amdv
description: Use when previewing generated Markdown plans for human review, or when agent needs to show rendered Markdown to user for feedback
---

# using-amdv

Use this skill when an agent has produced a Markdown file that should be rendered for a human to review, especially before the agent continues with a plan or decision that needs confirmation.

## When to use

```bash
amdv <file.md>
amdv -i <file.md>
```

Use `amdv -i <file.md>` when the Markdown needs an explicit accept/reject decision before proceeding. This includes:
- Plans and design documents
- Implementation proposals
- Decision documents
- Any generated `.md` file that requires user validation

Use `amdv <file.md>` when the user only needs to read the rendered Markdown and no decision is required.

## How to use

`amdv -i` must be called synchronously. It blocks until the user clicks Accept or Reject. Do not run it in the background with `&`.

When interactive mode finishes, parse stdout as JSON:

```json
{"accepted": true, "note": "..."}
```

Use `accepted` to decide whether to proceed, and use `note` as optional user feedback.

If `amdv` is not installed, build and install it with:

go to the amdv project folder, and:

```bash
pnpm install:app
```
