# Backend Agent Guide — Resume Builder API

> **Status: Placeholder** — This file will be populated once backend development begins.

## 1. Business Context

This backend will serve as the API layer for the Resume Builder frontend. It will handle:

- **Canvas state persistence** — Save and load resume canvas data (items, positions, sizes, content).
- **Image uploads** — Accept image files from the frontend, store them in object storage, and return URLs.
- **PDF export** — Render the canvas layout to a downloadable PDF document.
- **Authentication** — User accounts and session management.
- **Resume templates** — Serve pre-built resume layouts.

---

## 2. Current State

The backend currently consists of a single placeholder file:

```
backend/
└── main.py    # print("Hello World")
```

A Python virtual environment is configured at the project root:

```
.venv/          # Created via: python3 -m venv .venv
```

The backend is started via:

```bash
npm run dev:backend    # Runs: .venv/bin/python backend/main.py
```

---

## 3. Data Contract with Frontend

The frontend's primary data structure that the backend must support:

```typescript
interface CanvasItem {
  id: string;          // nanoid-generated unique ID
  type: 'text' | 'image';
  x: number;           // Position in px from top-left of A4 canvas
  y: number;
  width: number;       // Size in px
  height: number;
  content: string;     // HTML string (text) or base64 data URL / image URL (image)
}
```

The canvas dimensions are fixed at **794 × 1123 px** (A4 at 96 DPI).

Items may have **negative coordinates** or extend beyond the canvas boundary (pasteboard area). These items should be persisted but excluded from PDF export.

---

## 4. Technology Decisions (TBD)

The following decisions should be made and documented here before development begins:

- [ ] **Framework** — FastAPI, Flask, Django, or other
- [ ] **Database** — PostgreSQL, SQLite, or other
- [ ] **ORM** — SQLAlchemy, Tortoise, or other
- [ ] **Image storage** — Local filesystem, S3, Cloudflare R2, or other
- [ ] **PDF generation** — WeasyPrint, Playwright, wkhtmltopdf, or other
- [ ] **Authentication** — JWT, session cookies, OAuth, or other
- [ ] **Deployment** — Docker, bare metal, serverless, or other

---

## 5. Development Setup

```bash
# Activate the virtual environment
source .venv/bin/activate

# Install dependencies (once requirements.txt exists)
pip install -r backend/requirements.txt

# Run the backend
npm run dev:backend
```

---

## 6. Integration Notes

- The frontend currently runs on `localhost:5173` (Vite dev server). CORS configuration will be needed.
- The Vite dev server can proxy API requests — configure `server.proxy` in `frontend/vite.config.ts` to forward `/api/*` to the backend.
- The `CanvasItem.content` field for images will transition from base64 data URLs to server-hosted image URLs once the upload endpoint is built.
