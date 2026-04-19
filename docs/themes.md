# Themes

amdv supports customizable themes via CSS. Theme files are located in `src/themes/`.

## Structure

```
src/themes/
  markdown-base.css    ← Shared structural styles (do not edit per-theme)
  github-light.css     ← Theme: colors only
  github-dark.css      ← Theme: colors only
  dracula.css          ← Theme: colors only
```

## Adding a New Theme

1. **Create the theme CSS file** in `src/themes/` (e.g., `monokai.css`):

```css
/* Monokai Theme */

[data-theme="monokai"] .markdown-body {
  color: #f8f8f2;
  background-color: #272822;
}

[data-theme="monokai"] .markdown-body h1,
[data-theme="monokai"] .markdown-body h2,
[data-theme="monokai"] .markdown-body h3,
[data-theme="monokai"] .markdown-body h4 {
  color: #f8f8f2;
  border-bottom-color: #49483e;
}

[data-theme="monokai"] .markdown-body code {
  color: #f8f8f2;
  background-color: #49483e;
  border-color: #75715e;
}

[data-theme="monokai"] .markdown-body pre {
  background-color: #49483e;
  border-color: #75715e;
}

[data-theme="monokai"] .markdown-body pre code {
  background-color: transparent;
  border: none;
}

[data-theme="monokai"] .markdown-body blockquote {
  color: #75715e;
  border-left-color: #75715e;
}

[data-theme="monokai"] .markdown-body a {
  color: #66d9ef;
}

[data-theme="monokai"] .markdown-body th,
[data-theme="monokai"] .markdown-body td {
  border-color: #49483e;
}

[data-theme="monokai"] .markdown-body tr:nth-child(even) {
  background-color: #49483e;
}
```

2. **Register the theme** in `src/theme.ts`:

```typescript
import './themes/markdown-base.css';
import './themes/github-light.css';
import './themes/github-dark.css';
import './themes/dracula.css';
import './themes/monokai.css';  // ← add this line

export const AVAILABLE_THEMES = ['github-light', 'github-dark', 'dracula', 'monokai'];
```

3. **Add the theme name** in `src-tauri/src/lib.rs`:

```rust
const VALID_THEMES: &[&str] = &["github-light", "github-dark", "dracula", "monokai"];
```

4. **Test locally**:

```bash
pnpm tauri dev
amdv --set-theme monokai plan.md
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
