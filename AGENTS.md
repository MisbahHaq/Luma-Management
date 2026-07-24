# Luma-Management — Agent Notes

## Project Structure

- `Luma/` — .NET backend (Luma.Server) with React client at `Luma/luma.client/`
- `Luma-Demo/` — Standalone React/TypeScript demo frontend (Vite + React Router + Tailwind CSS v4)

## Drafting Table UI Scheme (Luma-Demo)

The `Luma-Demo` project uses the "Drafting Table" aesthetic:

### Color Palette
- Background: `#F6F4EC` (ivory grid paper)
- Primary text: `#1C2B3A` (navy ink)
- Muted text: `#7A7869` (warm gray)
- Accent (overdue/alerts/CTAs only): `#C1541F` (safety orange)
- Card surfaces: `#FFFFFF` (white)
- Borders: `#C9C5B2` (0.5px hairlines)

### Design Tokens (`Luma-Demo/src/index.css` `@theme`)
- `--color-bg`: `#F6F4EC`
- `--color-surface-1`: `#FFFFFF`
- `--color-surface-2`: `#F0EDE4`
- `--color-surface-3`: `#E2DFCF`
- `--color-text-primary`: `#1C2B3A`
- `--color-text-secondary`: `#4A493E`
- `--color-text-muted`: `#7A7869`
- `--color-border-subtle`: `#C9C5B2`
- `--color-accent`: `#C1541F`
- `--radius`: `4px`
- `--font-sans`: `'Inter', 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif`
- `--font-mono`: `'IBM Plex Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', monospace`

### Key Design Rules
- Grid paper background (`16px` squares, `0.5px` lines via CSS `background-image`)
- Left-border accent stripes on cards/rows (navy normal, orange urgent)
- Monospace task IDs (`font-mono`, `tracking-wide`, small size)
- No shadows on cards/modals — borders only
- `font-weight: 500` max (no `font-semibold` or `font-bold` in UI)
- `border-radius: 4px` throughout

## Build

```bash
cd Luma-Demo
npm run build   # tsc -b && vite build
```