# BSCS 3A Seminar Workshop – Ticketed Attendance System

A mobile-first web application for managing ticketed attendance at the WMSU College of Computing Studies BSCS 3A Seminar Workshop. Participants self-register, generate a one-time QR ticket, and organizers scan it at the door to mark attendance.

---

## Features

### Participant Side (`/`)
- Self-service registration form (Name, Email, Section, Course)
- Validates against a pre-registered list imported by the admin
- Generates a **one-time QR ticket** on first submission
- Returning participants can retrieve their existing QR by email
- Save QR as PNG image, confetti celebration on first generation

### Admin Dashboard (`/admin`)
Protected by a shared admin password. Includes four tabs:

| Tab | What it does |
|-----|-------------|
| **Overview** | Live stats: total registered, QR generated, attended, attendance rate + recent scans table |
| **Participants** | Searchable, filterable table of all participants with add/delete and status badges |
| **Import CSV** | Drag-and-drop CSV uploader (columns: Name, Email, Section, Course) with preview and bulk import |
| **Verify QR** | Manual QR token entry → look up participant → "Mark as Present" button |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Neon PostgreSQL (serverless) |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| UI | Tailwind CSS + shadcn/ui |
| QR Code | `react-qr-code` |
| CSV Parsing | `papaparse` |
| Validation | Zod |
| Toasts | Sonner |
| Confetti | `canvas-confetti` |
| QR Download | `html-to-image` |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Public QR ticket page
│   ├── actions.ts                   # Public server action (generateTicket)
│   ├── layout.tsx                   # Root layout with Toaster
│   └── admin/
│       ├── actions.ts               # All admin server actions
│       ├── login/page.tsx           # Admin login page
│       └── (dashboard)/
│           ├── layout.tsx           # Dashboard layout (sidebar + bottom nav)
│           ├── page.tsx             # Overview tab
│           ├── participants/page.tsx
│           ├── import/page.tsx
│           └── verify/page.tsx
├── lib/
│   ├── prisma.ts                    # Prisma + Neon adapter singleton
│   └── validations.ts               # Zod schemas
├── middleware.ts                    # Route protection for /admin/*
prisma/
└── schema.prisma                    # Participant data model
```

---

## Data Model

```prisma
model Participant {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  section       String
  course        String
  registeredAt  DateTime  @default(now())
  qrGeneratedAt DateTime?            // when they first generated a QR
  qrToken       String?   @unique    // short token embedded in QR payload
  attendedAt    DateTime?            // when they were marked present
  attendedBy    String?
  notes         String?
}
```

**QR Payload format:** `wmsu-bscs-seminar:{participantId}:{qrToken}`

---

## Setup & Development

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd seminar-event-attendance
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```env
# Neon PostgreSQL — use the pooled connection string from your Neon Console
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require"

# Admin dashboard password
ADMIN_PASSWORD="your-secure-password"
```

> **Tip:** For Neon, use the **pooled** connection string (has `-pooler` in the hostname) for `DATABASE_URL`.

### 3. Push the database schema

```bash
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Admin Usage

1. Go to `/admin/login` and enter the `ADMIN_PASSWORD` from your `.env`
2. Import participants via **Import CSV** (columns: `name, email, section, course`)
3. Share the public URL (`/`) with participants so they can generate their QR tickets
4. At the event, use **Verify QR** to look up tokens and mark attendance

---

## Deployment (Vercel)

1. Push the project to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add environment variables in the Vercel Project Settings:
   - `DATABASE_URL` — Neon pooled connection string
   - `ADMIN_PASSWORD` — your chosen admin password
4. Deploy — Vercel automatically runs `prisma generate` via the build

---

## Known Limitations / Phase 2 Roadmap

- Camera-based QR scanning (`html5-qrcode` / `@zxing/browser`) — placeholder UI is already in place
- Email confirmation after QR generation
- Multi-event support
- Live Google Sheets sync (currently manual CSV import only)
- CSV export UI (server action is written in `admin/actions.ts`, frontend pending)
