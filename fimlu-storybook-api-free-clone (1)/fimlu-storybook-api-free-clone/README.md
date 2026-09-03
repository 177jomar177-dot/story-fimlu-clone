# FIMLU Creator Tool — API-Free Clone

This project is an API-free clone of the supplied FIMLU Storybook React/Vite project.

## What is preserved

- Same React/Vite application structure and main UI flow
- Home dashboard and Storybook Title Generator
- Category and target-age selectors
- Five ranked title results with ratings
- Storybook Creation Brief with all 17 fields
- Per-field regeneration and custom selections
- Story Pages 1–15 workflow
- Learning/Parent Toolkit Pages 16–25 workflow
- Character & Visual Bible workflow
- Five-cover A/B testing suite (V1–V5)
- Single-page prompt production and batch prompt generation
- Page editing and page regeneration
- Copy prompt actions
- Word document export
- IndexedDB saved books
- JSON backup/export and restore/import
- Dark/light mode
- Local cover/page preview images

## What changed

The original Gemini network layer was replaced with `src/localEngine.js`, a deterministic browser-only story/prompt engine.

There are:

- no API keys
- no external AI account requirement
- no `fetch()` calls in application source
- no Gemini endpoint
- no placeholder-image website request
- no backend/server requirement

The top-right API settings control has been converted into a **Local Engine** status panel in the same location.

## Important image-generation note

The supplied original project did not actually generate AI illustrations. Its `Generate Image` function returned a `placehold.co` placeholder URL. This clone replaces that external placeholder with a locally generated SVG preview asset, so the feature remains functional without network access.

Real photorealistic/3D AI image generation cannot be performed fully offline by this small static web app unless an actual local image model is bundled and run on the user's device. The exported cover/page prompts remain available for use in an external image generator if desired.

## Cloudflare Pages deployment

Use the project root as the repository root.

- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 20+ or 22
- Environment variables: **none required**

Cloudflare should install dependencies from `package-lock.json` on its Linux build environment. Do not upload the old Windows `node_modules` folder from the original ZIP.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Data behavior across devices

Saved books use browser IndexedDB, exactly as in the supplied project. This means saved drafts stay on the specific browser/device where they were created. Use **Export Backup** and **Import Backup** to move saved books between devices.

If you later want automatic cross-device synchronization, that requires shared remote storage such as Cloudflare D1/KV/R2 or another backend service. That is separate from the API-free story-generation requirement.
