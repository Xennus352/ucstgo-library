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

---

## 2. Directory Structure

```
ucstgo-library/
├── .env                                  # Environment variables
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
│   │   ├── borrow.ts
│   │   ├── chart-stats.ts
│   │   ├── circulation.ts
│   │   ├── get-borrows.ts
│   │   ├── get-brand.ts                  # Read dynamic brand config
│   │   ├── issueWarningAction.ts
│   │   ├── library.ts
│   │   ├── libraryStats.ts
│   │   ├── profile.ts
│   │   ├── return.ts
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
│   ├── student/dashboard/page.tsx       # Student portal (4 tabs)
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
│   ├── animations/                       # Lottie, splash screen
│   ├── app-sidebar.tsx                   # Shared sidebar
│   ├── brand-config-provider.tsx         # Dynamic brand React context
│   ├── data-table.tsx                    # Generic table (tanstack/react-table)
│   ├── EbookReader.tsx                   # Ebook reader container
│   ├── LoginDialog.tsx
│   └── ... (other shared components)
│
├── config/
│   └── brand.ts                          # Brand config (name, logo, favicon, title)
│
├── constants/
│   ├── sampleData.ts                     # Sample import file paths
│   └── overview.md                       # ← THIS FILE
│
├── hooks/                                # Custom React hooks
│   ├── use-books.ts                      # SWR: book search
│   ├── useBooksInfinite.ts               # SWR infinite: paginated books
│   ├── use-categories.ts                 # SWR: categories
│   ├── use-current-user.ts               # SWR: /api/me
│   ├── use-media-query.ts                # Responsive breakpoint
│   ├── use-mobile.ts                     # Mobile detection (768px)
│   └── usePushNotifications.ts           # Web push subscription
│
├── lib/                                  # Shared utilities
│   ├── auth.ts                           # Better-Auth server config
│   ├── auth-client.ts                    # Better-Auth client
│   ├── prisma.ts                         # Prisma client singleton
│   ├── utils.ts                          # cn(), getUploadPath()
│   ├── upload.ts                         # File validation + upload helpers
│   ├── fetcher.ts                        # SWR fetch wrapper
│   ├── get-current-user.ts               # Server-side user getter
│   ├── role-routes.ts                    # Role → default route mapping
│   ├── socket.ts                         # Socket.IO getIO()
│   ├── ebookCache.ts                     # IndexedDB offline cache
│   ├── sendPush.ts                       # Web push sender
│   ├── webpush.ts                        # VAPID config
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
│   └── migrations/                       # 21 migration files
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
                                   ↕
                              Socket.IO (real-time notifications)
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

## 6. Key Components

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

### Proxy (Middleware)
- `proxy.ts`: Next.js 16 middleware that enforces authentication + role-based routing
- Runs on all `/admin/*`, `/student/*`, `/librarian/*`, `/lecturer/*` routes
- Skips server-action POSTs (returns early to avoid timeout)
- Allows public access to `/student` and `/student/dashboard`
- Redirects unauthenticated users to `/`
- Enforces role-route matching (e.g., STUDENT can't access `/admin`)

---

## 7. File Upload System

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

## 8. Key Configurations

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

### Environment Variables

```
DATABASE_URL        → PostgreSQL connection (Supabase)
BETTER_AUTH_SECRET  → Session signing secret
BETTER_AUTH_URL     → Auth callback URL
GROQ_API_KEY        → Groq AI SDK key
NEXT_PUBLIC_VAPID_PUBLIC_KEY → Web push public key
VAPID_PRIVATE_KEY   → Web push private key
CRON_SECRET         → CRON endpoint security
```

---

## 9. Dependencies (Key Packages)

| Purpose | Packages |
|---------|----------|
| Framework | next, react, react-dom |
| Database | @prisma/client, @prisma/adapter-pg, pg |
| Auth | better-auth, @better-auth/prisma-adapter |
| UI | tailwindcss, @radix-ui/*, lucide-react, framer-motion, vaul |
| Tables | @tanstack/react-table, @tanstack/react-virtual |
| Forms | react-hook-form, @hookform/resolvers, zod |
| Charts | recharts |
| PDF | react-pdf, pdfjs-dist, jspdf |
| AI | groq-sdk |
| Realtime | socket.io, socket.io-client |
| Push | web-push |
| File | xlsx, unzipper, mime-types, @aws-sdk/client-s3 |
| Utilities | date-fns, clsx, tailwind-merge, swr, sonner |

---

## 10. Build & Deploy

### Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Development (node server.js) |
| `pnpm build` | Prisma generate + Next.js build |
| `pnpm start` | Production (NODE_ENV=production node server.js) |
| `pnpm lint` | ESLint |
| `pnpm deploy` | Full deploy: git pull → install → generate → migrate → build → pm2 reload |

### Deploy Script

```bash
git pull && pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build && pm2 reload ucstgo-library
```
