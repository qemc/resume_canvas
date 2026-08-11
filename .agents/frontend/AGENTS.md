# Frontend Agent Guide — Resume Builder Canvas Editor

## 1. Business Context & Product Vision

### What is this product?
This is a **Figma-like drag-and-drop resume builder**. Users compose a resume by placing, resizing, and editing text blocks and image blocks on a fixed A4-sized canvas (794 × 1123 px at 96 DPI). The editor runs entirely in-browser as a single-page application (SPA) with no server-side rendering.

### Core user workflow
1. User opens the app and sees an empty A4 paper sheet centered on a gray pasteboard.
2. User clicks **"Add Text"** or **"Add Image"** in the toolbar — a new block appears on the canvas.
3. User **drags** blocks to position them. Alignment guide lines (blue magnet snapping) help align blocks to the canvas edges, centers, and other blocks.
4. User **resizes** blocks by dragging corner/edge handles.
5. User **double-clicks** a text block to enter rich-text editing mode (bold, italic, underline, font size, color, alignment).
6. User **double-clicks** an image block to upload a local image file.
7. User can place items **outside the white A4 page** onto the surrounding pasteboard area (scratch space — items here would not appear on the exported resume).
8. User can **multi-select** items via Shift+Click or rubber-band marquee selection.
9. Keyboard shortcuts: `Cmd+Z` (undo), `Cmd+Shift+Z` (redo), `Cmd+C/V` (copy/paste), `Cmd+A` (select all), `Delete/Backspace` (remove selected).

### Business rules & constraints
- The canvas is **always A4-sized** (794 × 1123 px). This is not configurable by the user.
- Items **can** be positioned outside the A4 page boundaries (pasteboard). When an item is off-page, it shows an amber "Off-page pasteboard" badge.
- Undo/redo tracks only `canvasItems` state (positions, sizes, content). Transient UI state like selection, zoom, and active editor are excluded from history.
- Images are stored as base64 data URLs in `CanvasItem.content`. There is currently no backend upload flow.
- There is no authentication, persistence, or export feature yet. The canvas state lives entirely in browser memory (Zustand store).

---

## 2. Monorepo Structure

```
resume_or/                          # Root monorepo
├── package.json                    # npm workspaces config + dev scripts
├── .gitignore
├── .venv/                          # Python virtual environment (root-level)
├── .agents/                        # AI agent documentation (you are here)
│   ├── frontend/
│   │   └── AGENTS.md              # This file
│   └── backend/
│       └── AGENTS.md              # Backend agent guide (placeholder)
├── frontend/                       # Vite + React + TypeScript SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│   ├── index.html                 # SPA entry point
│   └── src/
│       ├── main.tsx               # React createRoot
│       ├── App.tsx                # Renders <ResumeEditor />
│       ├── index.css              # Tailwind CSS v4 import + TipTap styles
│       ├── vite-env.d.ts          # Vite ambient type declarations
│       ├── components/
│       │   ├── ResumeEditor.tsx   # Root layout: Toolbar + Canvas
│       │   ├── Toolbar.tsx        # Top bar: brand, zoom, add buttons, text formatting
│       │   ├── Canvas.tsx         # A4 paper sheet + pasteboard + keyboard shortcuts + marquee
│       │   ├── CanvasItem.tsx     # Draggable/resizable wrapper (react-rnd) with snapping
│       │   ├── SelectionMarquee.tsx  # Blue dashed rubber-band rectangle
│       │   ├── TextFormattingToolbar.tsx  # Bold/Italic/Underline/FontSize/Color/Align
│       │   └── nodes/
│       │       ├── TextNode.tsx   # TipTap rich-text editor per text block
│       │       └── ImageNode.tsx  # Image upload via FileReader + data URL
│       ├── store/
│       │   └── useCanvasStore.ts  # Zustand store + Zundo undo/redo
│       └── lib/
│           ├── alignment.ts       # Alignment snapping geometry calculations
│           └── constants.ts       # Canvas dimensions & default item sizes
└── backend/
    └── main.py                    # Python hello world placeholder
```

---

## 3. Tech Stack & Dependencies

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Build tool | Vite | 8.x | Dev server, HMR, production bundling |
| UI framework | React | 19.x | Component rendering |
| Language | TypeScript | 6.x | Type safety (`strict: true`) |
| Styling | Tailwind CSS | 4.x (Vite plugin) | Utility-first CSS |
| State management | Zustand | 5.x | Global store (single store pattern) |
| Undo/Redo | Zundo | 2.x | Temporal middleware for Zustand |
| Rich text | TipTap | 3.x | ContentEditable editor (ProseMirror wrapper) |
| Drag & resize | react-rnd | 10.x | Draggable + resizable `<Rnd>` component |
| ID generation | nanoid | 6.x | Unique item IDs |

### Path alias
`@/` is mapped to `frontend/src/` via both `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`paths`).

### Dev commands (run from project root)
```bash
npm run dev:frontend      # Start Vite dev server
npm run dev:backend       # Run backend with .venv Python
npm run build:frontend    # tsc type-check + Vite production build
```

---

## 4. Architecture & Data Flow

### Component hierarchy
```
App
└── ResumeEditor
    ├── Toolbar                     # Sticky top bar
    │   └── TextFormattingToolbar   # Contextual (shown when text block selected)
    └── Canvas                      # Scrollable pasteboard container
        ├── CanvasItem[]            # react-rnd wrappers (memo'd)
        │   ├── TextNode            # TipTap editor instance
        │   └── ImageNode           # Image display + file input
        ├── AlignmentGuides[]       # Blue snap lines (rendered from store)
        └── SelectionMarquee        # Rubber-band selection rectangle
```

### State management (single Zustand store)

**`useCanvasStore`** is the single source of truth. Every component reads from it via selectors.

**State shape:**
```typescript
{
  canvasItems: CanvasItem[]        // All items on the canvas
  selectedItemIds: string[]        // Currently selected item IDs
  clipboard: CanvasItem[]          // Items copied for paste
  editingItemId: string | null     // Item in text-editing mode
  activeGuides: AlignmentGuide[]   // Visible alignment snap lines
  activeEditor: Editor | null      // TipTap editor instance (for toolbar)
  zoom: number                     // Canvas zoom factor (0.25–2.0)
}
```

**Key actions:**
| Action | What it does |
|---|---|
| `addItem(type)` | Creates a new text or image block at the center of the canvas |
| `updateItemCoords(id, x, y)` | Moves a single item |
| `updateMultiplePositions(positions)` | Batch-moves multiple items (used during multi-select drag) |
| `updateItemSize(id, w, h)` | Resizes an item |
| `updateItemContent(id, content)` | Updates text HTML or image data URL |
| `deleteItem(id)` / `deleteSelected()` | Removes item(s) |
| `selectItem(id, multi?)` | Selects/deselects items (supports Shift+Click toggle) |
| `copy()` / `paste()` | Clipboard operations (offset pasted items by +20px) |
| `setEditingItem(id)` | Enters text editing mode |
| `setActiveGuides(guides)` / `clearActiveGuides()` | Controls alignment snap line display |
| `setZoom(zoom)` | Sets zoom level (clamped 0.25–2.0) |

**Undo/redo:** Powered by `zundo` temporal middleware. Only `canvasItems` is tracked in undo history (`partialize`). Temporal state is paused during active drags and resumed on drop.

### Drag & snap architecture

This is the most complex subsystem. Understanding it is critical for modifications.

**Drag lifecycle:**

1. **`onDragStart`** — Pauses undo history, stores initial positions of all selected items in a `useRef` Map.
2. **`onDrag`** — Calculates alignment guides from the raw mouse position but does **NOT** update item positions in the store. This prevents React re-render feedback loops (wiggling). Only guide lines are updated for visual display.
3. **`onDragStop`** — Resumes undo history, computes final snapped position from the drop coordinates, and batch-commits all selected items to their final positions in a single atomic store update.

**Why this architecture matters:** If you update positions during `onDrag`, React re-renders `<Rnd>` with new `position` props, which conflicts with the library's internal drag state and causes oscillation. The current design avoids this by deferring position commits to `onDragStop`.

### Alignment snapping (`lib/alignment.ts`)

The `calculateAlignmentSnapping()` function is a pure function. It takes raw coordinates + all items and returns snapped coordinates + guide line descriptors.

**How it works:**
- A unified `snapAxis()` helper handles both X and Y axes identically.
- For each axis, it checks 3 canvas targets (start, center, end) and 5 per-item targets (left/top, center, right/bottom, and two edge-to-edge) against a pixel threshold (default: 6px).
- Selected items are excluded from snap targets (they don't snap to themselves).
- Returns the closest snap position + visual guide metadata.

### Rich text editing (TipTap)

Each `TextNode` creates its own `useEditor()` instance with these extensions:
- **StarterKit** — paragraphs, headings, bold, italic, lists
- **TextStyle + custom FontSize** — `setFontSize(size)` command
- **Color** — `setColor(hex)` command
- **Underline** — toggle underline
- **TextAlign** — left/center/right alignment

The custom `FontSize` extension is defined inline in `TextNode.tsx`. It uses `addGlobalAttributes` to attach `fontSize` to the `textStyle` mark.

When a text block is selected, the `Toolbar` renders `TextFormattingToolbar` which calls commands on the `activeEditor` instance stored in Zustand.

---

## 5. Conventions & Patterns

### Code style
- **TypeScript strict mode** is enabled. All code must compile under `strict: true`.
- **Tailwind CSS v4** — styles are utility-first via class names. No separate CSS modules. Custom CSS is only in `index.css` for TipTap overrides.
- **No `'use client'` directives** — this is a Vite SPA, not Next.js.
- **React.memo** is used on `CanvasItem` to prevent re-rendering all items when one changes.
- **Individual Zustand selectors** — each component subscribes to specific state slices (`useCanvasStore((s) => s.canvasItems)`) to minimize re-renders.

### Helper patterns
- **`updateItems(items, id, patch)`** — DRY helper in the store for immutable single-item updates.
- **`snapAxis()`** — DRY helper in alignment.ts to avoid duplicating X/Y snapping logic.

### Naming conventions
- Components: PascalCase, one component per file, file name matches component name.
- Store: `useCanvasStore.ts` — single store file.
- Lib utilities: camelCase function exports.
- Constants: SCREAMING_SNAKE_CASE.

### Important gotchas for agents
1. **Do NOT update Zustand state during `onDrag` callbacks** — this causes re-render oscillation (wiggling). Only update guide lines during drag; commit positions in `onDragStop`.
2. **TipTap `immediatelyRender: false`** — required to avoid SSR hydration warnings and ensure React 19 compatibility.
3. **`pointerEvents` management** — `CanvasItem` sets `pointerEvents: 'none'` on the content wrapper and `pointerEvents: 'auto'` on the delete button. When editing text, the content wrapper gets `pointerEvents: 'auto'` to allow cursor clicks.
4. **Zoom is handled via CSS `transform: scale()`** on the canvas div, not by scaling coordinates. The `<Rnd>` component receives the `scale` prop to compensate.
5. **Images are base64** — `ImageNode` reads files via `FileReader.readAsDataURL()`. Large images can bloat the store.

---

## 6. Testing & Verification

### Build verification
```bash
npm run build:frontend    # Must exit 0 with no TypeScript errors
```

### Manual verification checklist
- [ ] Add text block → appears centered on canvas
- [ ] Add image block → shows placeholder, double-click opens file picker
- [ ] Drag block → alignment guides appear, snaps on release
- [ ] Resize block → alignment guides appear during resize
- [ ] Multi-select via marquee → all intersecting items selected
- [ ] Shift+Click → toggles item in selection
- [ ] Double-click text → enters editing mode, toolbar shows formatting
- [ ] Cmd+Z / Cmd+Shift+Z → undo/redo works
- [ ] Cmd+C / Cmd+V → copy/paste offsets items
- [ ] Drag item outside page → "Off-page pasteboard" badge shows
- [ ] Zoom in/out → canvas scales, drag coordinates stay accurate
- [ ] Delete/Backspace → removes selected items

---

## 7. Future Integration Points

The frontend is designed to eventually connect to a **Python backend** (FastAPI or similar). Key integration surfaces:

| Feature | Current state | Future backend integration |
|---|---|---|
| Canvas state | In-memory Zustand store | Save/load via REST API |
| Images | Base64 data URLs in store | Upload to object storage, store URL |
| Export (PDF) | Not implemented | Server-side PDF generation from canvas data |
| Authentication | None | JWT/session auth |
| Templates | None | Load pre-built resume templates from backend |

The `CanvasItem` interface (`{ id, type, x, y, width, height, content }`) is the primary data contract that the backend will need to serialize/deserialize.
