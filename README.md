# Frameforge

A polished, responsive creator-asset workspace based on the supplied AI Creator Asset Pipeline research. It turns a raw video script into a reviewable YouTube publishing kit with titles, descriptions, chapters, thumbnail directions, and deterministic validation.

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173`.

The demo is intentionally dependency-free and works offline after the font request. Generation is simulated locally so the full interaction can be explored without API keys.

## Interactive capabilities

- Parses Markdown headings and script timestamps into chapter candidates
- Accepts SRT/VTT files by picker or drag-and-drop and surfaces timing confidence
- Generates script-aware title, description, tag, chapter, and thumbnail directions
- Keeps the generated description editable with a live 5,000-byte counter
- Auto-saves source fields locally and restores unfinished drafts
- Exports the reviewed publishing kit as a text file
- Includes responsive layouts, keyboard focus states, status announcements, and an Escape-closeable validation dialog
