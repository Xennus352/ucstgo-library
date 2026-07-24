# UCSTGO Digital Library — System Overview

## 1. Project Info

| Key | Value |
|-----|-------|
| Name | `library-ucstgo` |
| Version | 0.1.0 (private) |
| Framework | Next.js 16.2.9 (App Router) + React 19.2.4 |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7.8.0 |
| Auth | Better-Auth 1.6.16 (email/password + admin plugin) |
| Styling | Tailwind CSS v4 + shadcn/ui + class-variance-authority |
| Package Manager | pnpm |
| Runtime | Custom Node.js HTTP server (server.js) with Socket.IO |
| AI | Groq SDK (Llama-based chat/summarization) |
| Charts | Recharts |
| Animation | framer-motion, GSAP, DotLottie |
| Real-time | socket.io + socket.io-client |

---

## 2. Directory Structure

```
ucstgo-library/
├── .env                                  # Environment variables
├── .dockerignore                         # Docker build exclusions
├── Dockerfile                            # Multi-stage production build
├── docker-compose.yml                    # Container orchestration
├── next.config.ts                        # Next.js configuration
├── server.js                             # Custom HTTP server (Socket.IO)
├── proxy.ts                              # Next.js 16 Middleware (route guard)
├── tsconfig.json                         # TypeScript config
├── package.json
│
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # Root layout (fonts, providers)
│   ├── page.tsx                          # / → redirects to /student/dashboard
│   ├── not-found.tsx                     # Custom 404
│   ├── error.tsx                         # Custom 500
│   ├── globals.css                       # Global styles + Tailwind
│   ├── icon.png                          # PWA icon
│   │
│   ├── actions/                          # Server Actions
│   │   ├── analytics.ts
│   │   ├── banUserAction.ts
│   │   ├── bookStatus.ts
│   │   ├── borrow.ts                     # Emits borrow:created via socket
│   │   ├── chart-stats.ts
│   │   ├── circulation.ts
│   │   ├── get-borrows.ts
│   │   ├── get-brand.ts                  # Read dynamic brand config
│   │   ├── issueWarningAction.ts
│   │   ├── library.ts
│   │   ├── libraryStats.ts
│   │   ├── profile.ts
│   │   ├── return.ts                     # Emits borrow:returned via socket
│   │   ├── section-stats.ts
│   │   ├── semesters.ts
│   │   ├── settings.ts
│   │   ├── update-brand.ts               # Write dynamic brand config
│   │   └── ai/
│   │       ├── recommendBooks.ts
│   │       └── summarizeBook.ts
│   │
│   ├── api/                              # API Routes (RESTful endpoints)
│   │   ├── admin/
│   │   │   ├── brand/route.ts            # Brand config + logo/favicon upload
│   │   │   ├── librarians/               # CRUD + bulk import/delete
│   │   │   ├── students/                 # CRUD + bulk import/delete
│   │   │   └── teachers/                 # CRUD + bulk import/delete
│   │   ├── ai/chat/route.ts              # AI chat completions
│   │   ├── auth/[...auth]/route.ts       # Better-Auth handler
│   │   ├── books/
│   │   │   ├── route.ts                  # GET (list) + POST (create w/ uploads)
│   │   │   ├── [id]/route.ts             # GET + PATCH (update) + DELETE
│   │   │   ├── categories/route.ts       # GET categories
│   │   │   ├── import/route.ts           # POST bulk import (ZIP+XLSX)
│   │   │   └── lecturer/route.ts         # GET + POST (lecturer-specific)
│   │   ├── cron/check-due-dates/route.ts # Scheduled overdue check
│   │   ├── files/[...path]/route.ts      # Serve uploaded files securely
│   │   ├── me/route.ts                   # Current user profile
│   │   ├── notifications/                # CRUD + announcements
│   │   └── reservations/                 # CRUD + cancel/fulfill
│   │
│   ├── admin/                            # Admin role pages
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── books/                        # Catalog management
│   │   ├── librarians/page.tsx
│   │   ├── students/page.tsx
│   │   ├── teachers/page.tsx
│   │   └── sys-config/page.tsx           # Brand, settings, semesters
│   │
│   ├── librarian/                        # Librarian role pages
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── books/
│   │   ├── librarians/page.tsx
│   │   ├── students/page.tsx
│   │   └── teachers/page.tsx
│   │
│   ├── lecturer/                         # Lecturer role pages
│   │   ├── layout.tsx
│   │   ├── books/page.tsx
│   │   ├── ebooks/page.tsx
│   │   ├── home/page.tsx
│   │   ├── manage-ebooks/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── student/dashboard/page.tsx       # Student portal (4 tabs + infinite scroll)
│   │
│   ├── portal/page.tsx                   # Login page
│   ├── 403/page.tsx                      # Forbidden
│   └── blocked/page.tsx                  # Banned user page
│
├── components/                           # React components
│   ├── ui/                               # shadcn/ui primitives (~33 files)
│   ├── admin/                            # Admin-specific components
│   ├── librarian/                        # Librarian-specific
│   ├── lecturer/                         # Lecturer-specific
│   ├── students/                         # Student portal components
│   ├── books/                            # Book CRUD components
│   ├── reservations/                     # Reservation UI
│   ├── reader/                           # Ebook reader (PDF.js)
│   ├── ai/                               # AI chat/summarize widgets
│   ├── animations/                       # Lottie JSON animations, splash screen
│   │   ├── Loading.tsx                   # DotLottie global loading (library.json)
│   │   ├── TextToSvg.tsx                 # DotLottie text-to-svg animation
│   │   ├── InfinityLoading.json          # Lottie infinite scroll indicator
│   │   ├── library.json
│   │   └── (other .json animation files)
│   ├── app-sidebar.tsx                   # Shared sidebar
│   ├── brand-config-provider.tsx         # Dynamic brand React context
│   ├── data-table.tsx                    # Generic table (tanstack/react-table)
│   ├── EbookReader.tsx                   # Ebook reader container
│   ├── LoginDialog.tsx
│   ├── StatusBadge.tsx                   # CVA-based status indicator
│   ├── RoleBadge.tsx                     # CVA-based role indicator
│   ├── MetricCard.tsx                    # CVA-based dashboard stat card
│   └── ... (other shared components)
│
├── config/
│   └── brand.ts                          # Brand config (name, logo, favicon, title)
│
├── constants/
│   ├── sampleData.ts                     # Sample import file paths
│   ├── overview.md                       # ← THIS FILE
│   └── SeniorDesign.md                   # Senior engineer refactoring spec
│
├── features/                             # Feature-based architecture scaffold
│   ├── README.md                         # Migration status and layout guide
│   ├── catalog/hooks/
│   │   └── use-book-catalog.ts           # SWR hooks: useBookSearch, useBookInfinite, useBook
│   ├── circulation/hooks/
│   │   └── use-circulation.ts            # SWR hooks: useReservations, useNotifications
│   ├── user-management/hooks/
│   │   └── use-user-management.ts        # SWR + mutate hooks for user CRUD
│   ├── auth/
│   ├── ebooks/
│   ├── notifications/
│   ├── analytics/
│   ├── ai-assistant/
│   └── branding/
│
├── hooks/                                # Custom React hooks
│   ├── use-books.ts                      # SWR: book search
│   ├── useBooksInfinite.ts               # SWR infinite: paginated books (socket-synced)
│   ├── use-categories.ts                 # SWR: categories
│   ├── use-current-user.ts               # SWR: /api/me
│   ├── use-media-query.ts                # Responsive breakpoint
│   ├── use-mobile.ts                     # Mobile detection (768px)
│   ├── use-socket.ts                     # useSocketEvent hook (singleton Socket.IO client)
│   └── usePushNotifications.ts           # Web push subscription
│
├── lib/                                # Shared utilities (production-grade)
│   ├── auth.ts                           # Better-Auth server config
│   ├── auth-client.ts                    # Better-Auth client
│   ├── prisma.ts                         # Prisma client singleton (Pg adapter)
│   ├── utils.ts                          # cn(), getUploadPath()
│   ├── upload.ts                         # File validation + upload helpers
│   ├── fetcher.ts                        # SWR fetch wrapper
│   ├── get-current-user.ts               # Server-side user getter
│   ├── role-routes.ts                    # Role → default route mapping
│   ├── socket.ts                         # Socket.IO setIO()/getIO() (server-side)
│   ├── ebookCache.ts                     # IndexedDB offline cache
│   ├── sendPush.ts                       # Web push sender
│   ├── webpush.ts                        # VAPID config
│   ├── errors.ts                         # AppError class + ErrorCodes + toNextResponse()
│   ├── design-tokens.ts                  # CVA primitives: statusBadge, roleBadge, metricCard, actionButton
│   ├── services/                         # Data Access Layer (DAL)
│   │   ├── auth.service.ts               # getSession, requireSession, requireRole, getDbUserRole
│   │   ├── book.service.ts               # listBooks, getBookById, createBook, updateBook, deleteBook (+ socket emits)
│   │   ├── borrow.service.ts             # borrowBook, returnBook, createReservation, fulfillReservation (+ socket emits)
│   │   └── user.service.ts               # listUsers, createUser, updateUser, deleteUser, banUser (+ socket emits)
│   ├── ai/groq.ts                        # Groq SDK client
│   ├── ai/knowledge.ts                   # Knowledge base loader
│   └── validations/auth.ts               # Zod login schema
│
├── types/                                # TypeScript type definitions
│   ├── AuthTypes.ts
│   ├── BookType.ts
│   ├── EbookType.ts
│   ├── LibraryType.ts
│   ├── NavItemType.ts
│   ├── Role.ts                           # Enums: Role, CopyStatus, etc.
│   └── UserType.ts
│
├── utils/
│   └── dataAdapter.ts                    # API → UI data transform
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   ├── seed.ts                           # Seed data
│   └── migrations/                       # Migration files
│
├── public/
│   ├── images/                           # Brand logos, avatars, hero images
│   ├── sampleExcelFormat/                # Import templates
│   └── sw.js                             # Service worker
│
└── libraryRules/
    └── rules.ts                          # Library rules (Burmese)
```

---

## 3. Architecture Overview

### Request Flow

```
Browser → Next.js Proxy (proxy.ts) → Route Handler / Server Action → Prisma → PostgreSQL
                                   ↕                              ↕
                              Socket.IO (real-time)       Socket.IO emits (DAL)
```

### Real-Time Event Flow

```
Server (DAL)                          Server (Socket.IO)          Client (Browser)
    │                                      │                          │
    ├─ book.service.ts ──emit("catalog:*")─┤                          │
    ├─ borrow.service.ts ─emit("reservation:*", "borrow:*")─┤         │
    ├─ user.service.ts ──emit("user:changed", "user:banned")─┤        │
    │                                      │                          │
    │                                      │──socket.emit(event, data)─┤
    │                                      │                          ├─ useSocketEvent()
    │                                      │                          ├─ useCatalogSync()
    │                                      │                          ├─ useCirculationSync()
    │                                      │                          ├─ useUserSync()
    │                                      │                          └─ useBooksInfinite (mutate)
```

### Authentication Flow

```
Better-Auth (email/password)
  → POST /api/auth/sign-in/email
  → Creates session (7-day expiry)
  → Session cookie sent with all subsequent requests
  → proxy.ts checks session on protected routes
  → Individual API routes verify via auth.api.getSession()
```

### File Upload Flow

```
Client (FormData with File)
  → POST /api/books (or PATCH, etc.)
  → validateContentLength() checks content-length header (413 if exceeded)
  → req.formData() parses multipart body
  → validateFileSize() checks each file (413 if exceeded)
  → Buffer.from(await file.arrayBuffer())
  → writeFile to ../ucstgo-library-storage/books/{type}/{year}/{month}/
  → Store relative path in database
  → Serve via /api/files/{path}
```

### Role-Based Access

| Role | Routes | Responsibilities |
|------|--------|-----------------|
| ADMIN | `/admin/*` | Full system control, brand config, user management, books |
| LIBRARIAN | `/librarian/*` | Book management, user management, circulation, reservations |
| LECTURER | `/lecturer/*` | Own book management, ebooks with LECTURER_ONLY access |
| STUDENT | `/student/*` | Browse, borrow, reserve, read ebooks, profile |

---

## 4. Database Schema (Prisma)

### Core Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | id, name, email, role (enum), studentId, banned | All user accounts |
| **Book** | id, isbn (unique), title, coverImage, categoryId, authorId | Catalog entries |
| **Author** | id, name (unique) | Book authors |
| **Category** | id, name (unique) | Book categories |
| **BookCopy** | id, barcode (unique), status (enum), bookId | Physical inventory tracking |
| **BorrowRecord** | id, borrowDate, dueDate, status, userId, copyId | Circulation history |
| **Reservation** | id, reservedAt, expiresAt, status (enum), userId, bookId | Hold queue |
| **Ebook** | id, filePath, format, accessType, semesterId, bookId | Digital books |
| **Semester** | id, name, slug | Academic period mapping |
| **ReadingHistory** | userId, ebookId, lastPage, progress | Reading progress |
| **Bookmark** | userId, ebookId, pageNumber, note | User bookmarks |
| **Notification** | id, title, message, userId, senderId | Notifications |
| **SystemSetting** | key (PK), value | System configuration |

### Enums

```
Role: ADMIN | LIBRARIAN | STUDENT | LECTURER
CopyStatus: AVAILABLE | BORROWED | LOST | DAMAGED
BorrowStatus: BORROWED | RETURNED | OVERDUE
ReservationStatus: ACTIVE | FULFILLED | CANCELLED | EXPIRED
EbookFormat: PDF | EPUB | DOCX
EbookAccessType: OPEN | STUDENT_ONLY | LECTURER_ONLY | ADMIN_ONLY
```

---

## 5. API Routes

### Books

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/books` | Paginated listing with search, category, status, type, semester filters |
| POST | `/api/books` | Create book (form-data with cover + ebook file uploads) |
| GET | `/api/books/[id]` | Single book details with availability |
| PATCH | `/api/books/[id]` | Update book (with ownership guard for lecturers) |
| DELETE | `/api/books/[id]` | Delete book + remove files + cascade copies |
| GET | `/api/books/categories` | List all categories |
| POST | `/api/books/import` | Bulk import from ZIP (XLSX + cover/ebook files in archive) |
| GET | `/api/books/lecturer` | Current lecturer's books |
| POST | `/api/books/lecturer` | Create book as lecturer (auto-sets LECTURER_ONLY access) |

### Admin

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/admin/librarians` | List/create librarians |
| PATCH/DELETE | `/api/admin/librarians/[id]` | Update/delete librarian |
| POST | `/api/admin/librarians/bulk` | Bulk import librarians (XLSX) |
| DELETE | `/api/admin/librarians/bulk-delete` | Bulk delete librarians |
| GET/POST | `/api/admin/students` | List/create students |
| PATCH/DELETE | `/api/admin/students/[id]` | Update/delete student |
| POST | `/api/admin/students/bulk` | Bulk import students |
| DELETE | `/api/admin/students/bulk-delete` | Bulk delete students |
| GET/POST | `/api/admin/teachers` | List/create teachers |
| PATCH/DELETE | `/api/admin/teachers/[id]` | Update/delete teacher |
| POST | `/api/admin/teachers/bulk` | Bulk import teachers |
| DELETE | `/api/admin/teachers/bulk-delete` | Bulk delete teachers |
| POST | `/api/admin/brand` | Update brand config + logo/favicon uploads |

### Other

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/chat` | AI chat with intent detection (knowledge/recommendation/summary/search) |
| GET | `/api/me` | Current authenticated user profile |
| GET | `/api/files/[...path]` | Serve protected uploaded files |
| GET | `/api/notifications` | User's notifications (last 4) |
| POST | `/api/notifications/announcement` | Create global announcement |
| GET | `/api/notifications/announcement` | Announcement history |
| POST | `/api/notifications/read` | Mark all as read |
| GET | `/api/reservations` | Paginated reservations |
| POST | `/api/reservations/create` | Create reservation (dynamic expiration) |
| POST | `/api/reservations/[id]/cancel` | Cancel reservation |
| POST | `/api/reservations/[id]/fullfill` | Fulfill reservation (staff → borrow record) |
| GET | `/api/cron/check-due-dates` | CRON: mark overdue, send 2-day alerts (secured) |

---

## 6. Real-Time Socket.IO System

### Server-Side (`server.js`)
- Custom Node.js HTTP server wrapping Next.js request handler
- Socket.IO server attached to HTTP server via engine.io (ordered listener intercept)
- `global.io = io` exposed for DAL access
- Events: `join` (user room), `disconnect`

### DAL Socket Emits (`lib/socket.ts`)
- `setIO(io)` / `getIO()` — singleton accessor for the Socket.IO server instance

| Service | Events Emitted |
|---------|---------------|
| `book.service.ts` | `catalog:created`, `catalog:updated`, `catalog:deleted` |
| `borrow.service.ts` | `reservation:created`, `reservation:status`, `borrow:created` |
| `app/actions/borrow.ts` | `borrow:created` |
| `app/actions/return.ts` | `borrow:returned` |
| `user.service.ts` | `user:changed`, `user:banned` |

### Client-Side (`hooks/use-socket.ts`)
- Singleton Socket.IO client connection (`io()` with WebSocket-only transport)
- `useSocketEvent(event, callback)` — ref-based callback hook with connection logging
- Automatically connects on mount, disconnects on unmount

### SWR Sync Hooks
| Hook | File | Listens To |
|------|------|------------|
| `useBooksInfinite` | `hooks/useBooksInfinite.ts` | `catalog:*` events → `mutate()` |
| `useCatalogSync` | `features/catalog/hooks/use-book-catalog.ts` | `catalog:*` events → `mutate()` |
| `useCirculationSync` | `features/circulation/hooks/use-circulation.ts` | `reservation:*`, `borrow:*` → `mutate()` |
| `useUserSync` | `features/user-management/hooks/use-user-management.ts` | `user:changed`, `user:banned` → `mutate()` |

---

## 7. Key Components

### Brand Configuration System
- `config/brand.ts`: Source-of-truth file (rewritten at runtime)
- `app/actions/get-brand.ts`: Server action to read config dynamically
- `app/actions/update-brand.ts`: Server action to write config + files
- `components/brand-config-provider.tsx`: React context + `useBrandConfig()` hook
- `components/admin/updateBrand.tsx`: Admin UI form with dropzone uploads
- `app/api/admin/brand/route.ts`: API route for brand updates (bypasses server-action body limits)

### Book Management
- `components/books/create/create-book-form.tsx`: Create form (cover + ebook upload)
- `components/books/EditBookForm.tsx`: Edit form with image/file preview
- `components/books/BookTable.tsx`: Data table with search, pagination, filters
- `components/books/BookZipImport.tsx`: ZIP + XLSX bulk import UI
- `components/books/BorrowButton.tsx`: Reserve/borrow workflow
- `components/lecturer/BookManagementModal.tsx`: Lecturer CRUD modal

### Student Portal
- `components/students/tabs/HomeTab.tsx`: Dashboard with recommendations
- `components/students/tabs/EbooksTab.tsx`: Ebook browsing + reading
- `components/students/tabs/PhysicalTab.tsx`: Physical book browsing
- `components/students/tabs/ProfileTab.tsx`: Borrowing history, fines, bookmarks
- `components/students/layout/TopNav.tsx`: Top navigation bar
- `components/students/layout/BottomNav.tsx`: Mobile bottom navigation
- `app/student/dashboard/page.tsx`: 4-tab portal with InfiniteScroll Lottie animation

### Ebook Reader
- `components/EbookReader.tsx`: PDF.js-based reader with pagination
- `components/reader/EbookReaderContainer.tsx`: Full reader layout
- `components/reader/PdfCanvasView.tsx`: Canvas-based PDF rendering
- `lib/ebookCache.ts`: IndexedDB offline caching

### AI Assistant
- `components/ai/AiFloatingWidget.tsx`: Draggable floating chat button
- `components/ai/aiChat.tsx`: Chat interface with context-aware responses
- `components/ai/aiBookSummarizer.tsx`: AI-powered book summarization
- `components/ai/aiRecommendationsSection.tsx`: Personalized recommendations
- `lib/ai/groq.ts`: Groq SDK configuration
- `app/api/ai/chat/route.ts`: Server endpoint with intent detection

### Animations (Lottie)
- `components/animations/Loading.tsx`: Full-screen DotLottie loading (library.json)
- `components/animations/TextToSvg.tsx`: DotLottie text-to-SVG animation
- `components/animations/InfinityLoading.json`: Infinite scroll Lottie (used in student dashboard)
- Player: `@dotlottie/react-player`

### Proxy (Middleware)
- `proxy.ts`: Next.js 16 middleware that enforces authentication + role-based routing
- Runs on all `/admin/*`, `/student/*`, `/librarian/*`, `/lecturer/*` routes
- Skips server-action POSTs (returns early to avoid timeout)
- Allows public access to `/student` and `/student/dashboard`
- Redirects unauthenticated users to `/`
- Enforces role-route matching (e.g., STUDENT can't access `/admin`)

---

## 8. File Upload System

### Limits (configured in `lib/upload.ts`)

| File Type | Max Size |
|-----------|----------|
| Cover images | 10 MB |
| Ebook files (PDF) | 100 MB |
| ZIP imports | 200 MB |
| Server actions (brand) | 50 MB |

### Storage Layout

```
../ucstgo-library-storage/
  └── books/
      ├── covers/
      │   └── {year}/
      │       └── {month}/
      │           └── {uuid}-{sanitized-name}.{ext}
      └── ebooks/
          └── {year}/
              └── {month}/
                  └── {uuid}-{sanitized-name}.pdf
```

### Validation Flow

1. **Content-Length check** (before formData parse): Rejects if total body exceeds combined limit
2. **File size check** (after formData parse): Rejects individual files exceeding per-type limits
3. **Storage**: Files saved to `../ucstgo-library-storage/` (outside project directory)
4. **Serving**: Files served through `/api/files/[...path]` route (not directly from `/public`)

---

## 9. Key Configurations

### `next.config.ts`

```typescript
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.google.com" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};
```

### `server.js`

Custom Node.js HTTP server wrapping Next.js request handler with Socket.IO for real-time push notifications.
- Port: 3000 (configurable via `PORT` env)
- Socket.IO CORS: origin `*`
- Socket events: `join` (user room), `disconnect`
- `global.io = io` exposed for DAL socket emits

### Environment Variables

```
DATABASE_URL            → PostgreSQL connection (Supabase)
BETTER_AUTH_SECRET      → Session signing secret
BETTER_AUTH_URL         → Auth callback URL
GROQ_API_KEY            → Groq AI SDK key
NEXT_PUBLIC_VAPID_PUBLIC_KEY → Web push public key
VAPID_PRIVATE_KEY       → Web push private key
CRON_SECRET             → CRON endpoint security
PORT                    → Server port (default 3000)
NEXT_PUBLIC_SITE_URL    → Public site URL
```

---

## 10. Dependencies (Key Packages)

| Purpose | Packages |
|---------|----------|
| Framework | next, react, react-dom |
| Database | @prisma/client, @prisma/adapter-pg, pg |
| Auth | better-auth, @better-auth/prisma-adapter |
| UI | tailwindcss, @radix-ui/*, lucide-react, framer-motion, gsap, vaul |
| Tables | @tanstack/react-table, @tanstack/react-virtual |
| Forms | react-hook-form, @hookform/resolvers, zod |
| Charts | recharts |
| PDF | react-pdf, pdfjs-dist, jspdf, jspdf-autotable |
| AI | groq-sdk |
| Realtime | socket.io, socket.io-client |
| Push | web-push |
| File | xlsx, unzipper, mime-types, @aws-sdk/client-s3 |
| Animation | @dotlottie/react-player |
| Utilities | date-fns, clsx, tailwind-merge, swr, sonner |

---

## 11. Docker Deployment

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (alpine, pnpm, non-root nextjs user) |
| `.dockerignore` | Excludes node_modules, .next, .git, .env, etc. |
| `docker-compose.yml` | Container service with restart, env_file, healthcheck |

### Dockerfile Stages

1. **`deps`** — Install production dependencies with pnpm (frozen lockfile)
2. **`builder`** — Full install + prisma generate + next build
3. **`runner`** — Minimal runtime with node:22-alpine, non-root `nextjs` user, copies only built artifacts + prod deps

### Deployment Commands

```bash
# Build and start
docker compose up -d --build

# Run database migrations
docker exec ucstgo-library npx prisma migrate deploy

# View logs
docker logs -f ucstgo-library
```

---

## 12. Production Refactoring Architecture

### 12.1 Service Layer (DAL)

All database and auth logic is isolated in `lib/services/` — a clean Data Access Layer. Route handlers and server actions call these services instead of touching Prisma or Better-Auth directly.

| Service | File | Responsibility |
|---------|------|----------------|
| `AuthService` | `lib/services/auth.service.ts` | Session, role verification, role hierarchy, route guard helpers |
| `BookService` | `lib/services/book.service.ts` | Book CRUD, search/pagination, author/category management, barcode generation (+ socket emits) |
| `BorrowService` | `lib/services/borrow.service.ts` | Borrow/return, reservations, overdue checks (+ socket emits) |
| `UserService` | `lib/services/user.service.ts` | User CRUD per role, bulk creation, ban/unban (+ socket emits) |

**Pattern:**

```typescript
// lib/services/book.service.ts
export async function listBooks(params: BookQueryParams) { ... }
export async function getBookById(id: string) { ... }
export async function createBook(input: BookCreateInput) { ... }
export async function updateBook(id: string, input: BookUpdateInput, userId: string) { ... }
export async function deleteBook(id: string) { ... }
```

### 12.2 Error Handling System

`lib/errors.ts` provides a typed error system:

```typescript
class AppError extends Error {
  constructor(message, code, status, details?)
}
const ErrorCodes = { UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, CONFLICT, ... }
function toNextResponse(error): NextResponse  // Centralized error → JSON response
```

### 12.3 Design Token System

**CSS Variables** in `app/globals.css`:

```css
--brand-primary: 221 83% 53%;
--brand-secondary: 217 91% 60%;
--status-available: 160 84% 39%;
--status-borrowed: 38 92% 50%;
--status-overdue: 0 84% 60%;
--status-lost: 0 84% 60%;
--status-damaged: 27 96% 55%;
--glass-bg: 255 255 255 / 0.6;
--glass-border: 255 255 255 / 0.2;
```

**CVA Primitives** in `lib/design-tokens.ts`:

| Primitive | Variants | Purpose |
|-----------|----------|---------|
| `statusBadge` | AVAILABLE, BORROWED, OVERDUE, LOST, DAMAGED, ACTIVE, ... | Book/copy status indicator |
| `roleBadge` | ADMIN, LIBRARIAN, STUDENT, LECTURER | User role indicator |
| `metricCard` | default, glass, outline | Dashboard stat cards |
| `actionButton` | primary, secondary, ghost, danger + sm/md/lg/icon | Unified button system |
| `pageContainer` | — | Max-width centered wrapper |
| `sectionHeader` | — | Flex row header with gap |
| `emptyState` | — | Dashed-border placeholder |

### 12.4 Feature-Based Directory Scaffold

```
features/
├── catalog/            # Books, authors, categories
│   ├── hooks/
│   │   └── use-book-catalog.ts     # SWR hooks for search, list, detail, categories (+ socket sync)
│   ├── components/     # Presentation UI (migrate from components/books/)
│   ├── services/       # Feature-specific server actions
│   └── types/
├── circulation/        # Borrows, returns, reservations
│   ├── hooks/
│   │   └── use-circulation.ts      # SWR hooks for reservations, notifications (+ socket sync)
│   └── components/
├── ebooks/             # Reader, uploads, reading history
│   └── hooks/
├── auth/               # Login, sessions, role management
├── user-management/    # Admin CRUD for users
│   └── hooks/
│       └── use-user-management.ts  # SWR hooks + mutations for user CRUD (+ socket sync)
├── notifications/
├── analytics/
├── ai-assistant/
└── branding/
```

Each feature contains `components/`, `hooks/`, `services/`, and `types/` directories. The `hooks/` in `features/` are **feature-specific** (SWR queries for that domain), while `lib/services/` are **shared** (Prisma DAL).

### 12.5 Migration Status

| Layer | Status | Files Affected |
|-------|--------|----------------|
| `lib/errors.ts` | ✅ Complete | Core error handling, all routes migrated |
| `lib/services/auth.service.ts` | ✅ Complete | Used by proxy.ts + 14 route files |
| `lib/services/book.service.ts` | ✅ Complete | `/api/books` (GET, POST), `/api/books/[id]` (GET, PATCH, DELETE), `/api/books/lecturer` (GET, POST) |
| `lib/services/borrow.service.ts` | ✅ Complete | `/api/reservations` (GET), `/api/reservations/create`, `/api/reservations/[id]/cancel`, `/api/reservations/[id]/fullfill`, `/api/cron/check-due-dates` |
| `lib/services/user.service.ts` | ✅ Complete | Used by `/api/admin/students`, `/api/admin/teachers`, `/api/admin/librarians` (12 route files) |
| `lib/design-tokens.ts` | ✅ Complete | CVA primitives for badges, cards, buttons, layout |
| `features/*/hooks/` | ✅ Adopted in pages | `use-book-catalog.ts` (augmented with pagination + socket sync), `use-circulation.ts` (+ socket sync), `use-user-management.ts` (+ socket sync) |
| Proxy (`proxy.ts`) | ✅ Refactored | Uses `AuthService` |
| Remaining routes | ✅ Refactored | `/api/notifications`, `/api/notifications/announcement`, `/api/notifications/read`, `/api/me` |
| Route handlers | ✅ All refactored | All 33 API route files use service layer + `toNextResponse()` |
| CVA wrapper components | ✅ Created | `StatusBadge`, `RoleBadge`, `MetricCard` |
| Component CVA adoption | ✅ Partial | `data-table`, `section-cards`, `BookPreview`, `ReservationTable`, `PhysicalBookDetailsModal`, `ProfileTab` |
| Feature hooks in pages | ✅ Partial | Admin/librarian books, reservations, students, teachers, librarians (9 pages) |
| Feature directory migration | ❌ Not started | Move components into `features/*/components/` |

---

## 13. File Counts & Stats

| Metric | Count |
|--------|-------|
| Total API route files | 33 ✅ all using service layer + `toNextResponse()` |
| Service modules | 4 (`auth.service`, `book.service`, `borrow.service`, `user.service`) |
| CVA wrapper components | 3 (`StatusBadge`, `RoleBadge`, `MetricCard`) |
| Feature hooks | 3 (`use-book-catalog`, `use-circulation`, `use-user-management`) |
| Pages refactored to feature hooks | 9 (admin/librarian books, reservations, students, teachers, librarians) |
| Components using CVA primitives | 6 (`data-table`, `section-cards`, `BookPreview`, `ReservationTable`, `PhysicalBookDetailsModal`, `ProfileTab`) |
| Socket event hooks | 5 (`useBooksInfinite`, `useCatalogSync`, `useCirculationSync`, `useUserSync`, `useSocketEvent`) |
| Lottie animation files | 3 (`Loading.tsx`, `TextToSvg.tsx`, `InfinityLoading.json`) |
| Docker deployment files | 3 (`Dockerfile`, `.dockerignore`, `docker-compose.yml`) |
| Production files created | `lib/errors.ts`, `lib/design-tokens.ts`, `lib/socket.ts`, `lib/services/*.ts` (4), `hooks/use-socket.ts`, `features/*/hooks/*.ts` (3), `components/StatusBadge.tsx`, `components/RoleBadge.tsx`, `components/MetricCard.tsx`, `features/README.md`, `Dockerfile`, `.dockerignore`, `docker-compose.yml` |
| Lines of code removed from route files | ~2,500+ (inline Prisma queries, availability calcs, manual auth checks consolidated into services) |

---

## 14. File Size Limits

| Location | File Type | Limit |
|----------|-----------|-------|
| `lib/upload.ts` | Book covers | 10 MB |
| `lib/upload.ts` | Ebook PDFs | 100 MB |
| `lib/upload.ts` | ZIP imports | 200 MB |
| `next.config.ts` | Server action bodies | 50 MB |
