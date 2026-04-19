# Themes

amdv supports customizable themes via CSS. Theme files are located in `src/themes/`.

## Structure

```
src/themes/
  markdown-base.css   ← Shared structural styles (do not edit per-theme)
  default-light.css   ← Theme tokens + markdown colors
  default-dark.css    ← Theme tokens + markdown colors
  purple.css          ← Theme tokens + markdown colors
  blue.css            ← Theme tokens + markdown colors
  green.css           ← Theme tokens + markdown colors
  red.css             ← Theme tokens + markdown colors (dark variant)
  red-light.css       ← Theme tokens + markdown colors (light variant)
```

## Adding a New Theme

1. **Create the theme CSS file** in `src/themes/` (e.g., `nord.css`):

```css
/* Nord Theme */

[data-theme="nord"] {
  --app-bg-color: #2e3440;
  --app-surface-color: #3b4252;
  --app-input-bg-color: #2e3440;
  --app-border-color: #4c566a;
  --app-text-color: #eceff4;
  --app-muted-text-color: #81a1c1;
}

[data-theme="nord"] .markdown-body {
  color: #eceff4;
  background-color: #2e3440;
}

[data-theme="nord"] .markdown-body h1,
[data-theme="nord"] .markdown-body h2,
[data-theme="nord"] .markdown-body h3,
[data-theme="nord"] .markdown-body h4 {
  color: #eceff4;
  border-bottom-color: #4c566a;
}

[data-theme="nord"] .markdown-body code {
  color: #eceff4;
  background-color: #3b4252;
  border-color: #4c566a;
}

[data-theme="nord"] .markdown-body pre {
  background-color: #3b4252;
  border-color: #4c566a;
}

[data-theme="nord"] .markdown-body pre code {
  background-color: transparent;
  border: none;
}

[data-theme="nord"] .markdown-body blockquote {
  color: #81a1c1;
  border-left-color: #4c566a;
}

[data-theme="nord"] .markdown-body a {
  color: #88c0d0;
}

[data-theme="nord"] .markdown-body th,
[data-theme="nord"] .markdown-body td {
  border-color: #4c566a;
}

[data-theme="nord"] .markdown-body tr:nth-child(even) {
  background-color: #3b4252;
}
```

2. **Register the theme stylesheet** in `src/theme.ts`:

```typescript
import './themes/markdown-base.css';
import './themes/default-light.css';
import './themes/default-dark.css';
import './themes/purple.css';
import './themes/nord.css'; // ← add this line
```

3. **Register the theme metadata** in `src/themes/metadata.json`:

```json
{
  "defaultTheme": "default-light",
  "themes": [
    { "id": "default-light", "label": "Default Light" },
    { "id": "default-dark", "label": "Default Dark" },
    { "id": "purple", "label": "Purple" },
    { "id": "blue", "label": "Blue" },
    { "id": "green", "label": "Green" },
    { "id": "red", "label": "Red" },
    { "id": "red-light", "label": "Red Light" },
    { "id": "nord", "label": "Nord" }
  ]
}
```

4. **Test locally**:

```bash
pnpm tauri dev
amdv --set-theme nord plan.md
```

## Theme CSS Properties

Each theme must define both app-level tokens and markdown colors.

### App-level tokens

These variables drive the outer page chrome, including the body background, centered content gutter area, action bar, and form controls:

| Token | Used for |
|-------|----------|
| `--app-bg-color` | Page background and content gutter |
| `--app-surface-color` | Action bar and hover surfaces |
| `--app-input-bg-color` | Input background |
| `--app-border-color` | Shared control and panel borders |
| `--app-text-color` | Base text and input text |
| `--app-muted-text-color` | Secondary text such as the reject button |

### Markdown colors

| Element | CSS Properties |
|---------|----------------|
| `.markdown-body` | `color`, `background-color` |
| `h1-h4` | `color`, `border-bottom-color` |
| `code` | `color`, `background-color`, `border-color` |
| `pre` | `background-color`, `border-color` |
| `pre code` | `background-color: transparent`, `border: none` |
| `blockquote` | `color`, `border-left-color` |
| `a` | `color` |
| `th, td` | `border-color` |
| `tr:nth-child(even)` | `background-color` |

All non-color structural styling remains shared in `markdown-base.css`, while app shell layout lives in `src/styles.css`.
