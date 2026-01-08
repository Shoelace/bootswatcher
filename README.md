
# BootSwatcher

Bootswatch theme switcher Web Component
with
- dark mode
- compact/invisible options
- Vite dev environment
- Offline-ready 

## Features
- ✅ Runtime theme switching among **all Bootswatch v5 themes** plus **default Bootstrap**
- ✅ **Dark mode** toggle via Bootstrap 5.3 `data-bs-theme`
- ✅ Configurable via **element attributes** (paths, defaults, visibility)
- ✅ Persistence via `localStorage` (`bootswatcher:theme` & `bootswatcher:mode`)
- ✅ **Preload script** applies saved theme & mode early to prevent FOUC
- ✅ **Automatic link insertion** if missing (`insert-link` attribute)
- ✅ Local copies of Bootswatch CSS and Bootstrap assets (JS & CSS)
- ✅ TypeScript source → **ESM** & **IIFE** bundles + **types**
- ✅ Node.js build script (`build.js`)
- ✅ Optional `setup-webpack.js` to scaffold a minimal webpack config
- ✅ **Vite** dev environment (`vite.config.ts`) with `pnpm dev`
- ✅ ESLint/Prettier setup for TypeScript & Web Components
- ✅ GitHub Action to build and publish `dist/` (GitHub Pages)

---

## Quick start

```sh
pnpm install
pnpm dev          # Vite dev server at http://localhost:5173
pnpm run build    # Production build (offline dist/)
pnpm dlx serve dist
```

---

## Usage (component)
### simple
```html
<boot-swatcher/>
```

### advanced
```html
<boot-swatcher
  themes-url="./themes/themes.json"
  themes-path="./themes"
  link-id="bootswatch-theme"
  default-theme="bootstrap"
  default-mode="auto"
  show-label
  show-mode-toggle
  compact
  insert-link
></boot-swatcher>
```

### Attributes
- `themes-url`: URL to JSON array of theme names (auto-generated at build). Default: `./themes/themes.json`
- `themes-path`: Directory containing CSS themes. Default: `./themes`
- `link-id`: The `<link>` element id used for active theme. Default: `bootswatch-theme`
- `default-theme`: Fallback if no saved theme. Default: `bootstrap`
- `default-mode`: `light` | `dark` | `auto` (auto respects OS preference). Default: `auto`
- `show-label`: Present to show the "Theme" label
- `show-mode-toggle`: Present to show dark mode toggle
- `compact`: Present to render a smaller UI footprint
- `invisible`: Present to apply theme/mode without rendering controls
- `insert-link`: Present to create the `<link id="...">` if it doesn't exist

### Public Methods
- `setTheme(name: string)`
- `setMode(mode: 'light' | 'dark')`

---

## Windows-friendly build script
- Detects available package manager (`pnpm` → `npm` → `yarn`) and uses the right commands.
- Uses `node build.js` 

---

## License
MIT
