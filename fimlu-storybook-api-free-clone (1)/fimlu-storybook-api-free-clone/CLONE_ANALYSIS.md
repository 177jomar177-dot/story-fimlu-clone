# Clone Analysis and Implementation Plan

## Original project architecture

- React 19 single-page application
- Vite 8 build system
- Tailwind CSS 3
- Lucide React icons
- Browser IndexedDB for saved books/drafts
- Browser localStorage for theme and, originally, Gemini configuration
- No application backend

## Original external dependencies at runtime

1. Google Gemini Generative Language API
   - model-list endpoint
   - `generateContent` endpoint
   - used for titles, brief suggestions, story pages, learning pages, visual bible, cover concepts, page prompts, batch prompts, and regeneration
2. `placehold.co`
   - used only as a fake/mock result for the Generate Image buttons

## API-free replacement architecture

### Local story engine
`src/localEngine.js` replaces the Gemini call surface with local deterministic generation.

It supports:

- five title suggestions per category
- category-aware brief suggestions
- regeneration of individual brief fields
- 15 story pages
- 10 learning/toolkit pages
- visual bible generation
- V1–V5 cover concept generation
- single cover regeneration
- single page prompt generation
- high-speed batch page prompt generation
- page text regeneration

### Local image preview engine
The original remote placeholder was replaced by a generated SVG data URL. This keeps the image buttons working without network requests.

### Existing browser systems preserved

- IndexedDB draft storage
- JSON backup/restore
- Word `.doc` export
- copy-to-clipboard fallback behavior
- dark/light theme
- responsive UI
- production/review/page-prompt state flow

## Verification completed

- `src/localEngine.js` passes Node syntax validation
- `src/App.jsx` passes JSX parsing using Sucrase
- local generation was exercised for all 17 category choices
- five titles returned per tested category
- all 17 brief fields returned
- Pages 1–15 returned
- Pages 16–25 returned
- visual bible returned
- V1–V5 cover concepts returned
- individual page prompt returned
- local SVG preview returned
- source scan found no runtime `fetch()` calls
- source scan found no Gemini endpoint
- source scan found no `placehold.co` endpoint

## Build-environment note

The original ZIP included Windows-only native Node build bindings. A Linux Vite production build could not be completed inside this sandbox because package reinstall access timed out. This is an environment/package issue, not a JSX/source parsing failure.

The final clone intentionally excludes `node_modules` and the stale original `dist` folder. Cloudflare Pages will perform a clean Linux dependency install from the supplied `package-lock.json`, which includes Linux Rolldown/Oxlint optional bindings.

## Future optional expansion

If automatic multi-device draft synchronization is later required, add Cloudflare-native remote persistence while keeping story generation local. That would be a separate feature expansion and is not required for this clone.
