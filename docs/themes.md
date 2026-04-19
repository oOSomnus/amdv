# Themes

amdv supports customizable themes via CSS. Theme files are located in `src/themes/`.

## Structure

```
src/themes/
  markdown-base.css    ← Shared structural styles (do not edit per-theme)
  default-light.css   ← Theme: colors only
  default-dark.css    ← Theme: colors only
  purple.css          ← Theme: colors only
  blue.css            ← Theme: colors only
  green.css           ← Theme: colors only
  red.css             ← Theme: colors only (dark variant)
  red-light.css       ← Theme: colors only (light variant)
```

## Adding a New Theme

1. **Create the theme CSS file** in `src/themes/` (e.g., `nord.css`):

```css
/* Nord Theme */

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

2. **Register the theme** in `src/theme.ts`:

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

Each theme must define colors for these elements:

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

All other styling (layout, spacing, typography, overflow) is shared in `markdown-base.css`.
