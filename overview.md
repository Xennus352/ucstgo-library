# UCSTGO Digital Library — System Overview

## 1. Project Info

| Key | Value |
|-----|-------|
| Name | `library-ucstgo` |
| Version | 0.1.0 (private) |
| Framework | Next.js 16.2.9 (App Router, `output: standalone`) + React 19.2.4 |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7.8.0 (custom client generated into `app/generated/prisma`) |
| Auth | Better-Auth 1.6.16 (email/password + admin plugin) |
| Email | Nodemailer (SMTP; graceful skip when not configured) |
| Styling | Tailwind CSS v4 + shadcn/ui + class-variance-authority |
| Package Manager | pnpm 10.12.4 |
| Runtime | Custom Node.js HTTP server (server.js) with Socket.IO + monitoring |
| AI | Groq SDK (Llama-based chat/summarization/recommendations) |
| Charts | Recharts |
| Animation | framer-motion, GSAP, DotLottie |
| Real-time | socket.io + socket.io-client |
| Push | web-push (VAPID) + service worker (`public/sw.js`) |

---

## 2. Directory Structure

```
ucstgo-library/
├── .env                                  # Environment variables
├── .dockerignore                         # Docker build exclusions
├── Dockerfile                            # Multi-stage production build (node:22-alpine, pnpm 10)
├── docker-compose.yml                    # Container orchestration (env_file + build args + healthcheck)
├── next.config.ts                        # Next.js configuration
├── server.js                             # Custom HTTP server (Socket.IO + request monitoring)
├── proxy.ts                              # Next.js 16 Proxy (route guard)
├── tsconfig.json                         # TypeScript config
├── package.json
├── overview.md                           # ← THIS FILE
│
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # Root layout (fonts, providers, AI widget, ClientErrorReporter, ActiveUserPing)
│   ├── page.tsx                          # / → redirects to /student/dashboard
│   ├── not-found.tsx                     # Custom 404 (TextToSVG)
│   ├── error.tsx                         # Custom 500 (reports to /api/system/client-error)
│   ├── globals.css                       # Global styles + Tailwind v4 + design tokens
│   ├── icon.png                          # Favicon (overwritten by brand updates)
│   ├── knowledge/data.md                 # Burmese AI assistant knowledge base
│   ├── generated/prisma/                 # Prisma generated client (25 model files + enums)
│   │
│   ├── actions/                          # Server Actions
│   │   ├── ai/recommendBooks.ts          # Groq recommendations from borrow history
│   │   ├── ai/summarizeBook.ts           # Groq structured book summary
│   │   ├── analytics.ts                  # getTopBorrowedBooks (deduped by book), getTopBorrowers
│   │   ├── banUserAction.ts
│   │   ├── bookStatus.ts                 # getLibraryStats
│   │   ├── borrow.ts                     # borrowBookAction (2-book limit, socket emit)
│   │   ├── chart-stats.ts                # 90-day borrow/return timeline
│   │   ├── circulation.ts                # getLiveCirculationData (latest 10 borrows)
│   │   ├── get-borrows.ts                # getAllBorrows (full audit history)
│   │   ├── get-brand.ts                  # Read dynamic brand config
│   │   ├── issueWarningAction.ts         # Overdue-warning notification + socket emit
│   │   ├── library.ts                    # getLatestBooks
│   │   ├── library-rules.ts              # CRUD library rules
│   │   ├── libraryStats.ts               # getLibraryDashboardMetrics (transaction)
│   │   ├── notice.ts                     # CRUD notices
│   │   ├── password-reset.ts             # forgotPassword, accept/reject, status check, list (+ email, socket)
│   │   ├── profile.ts                    # getUserProfileData
│   │   ├── return.ts                     # returnBookAction (FCFS handoff, socket emit)
│   │   ├── section-stats.ts              # getSectionCardStats
│   │   ├── semesters.ts                  # CRUD semesters (name + slug)
│   │   ├── settings.ts                   # get/update library settings (SystemSetting)
│   │   └── update-brand.ts               # Write dynamic brand config
│   │
│   ├── api/                              # API Routes (RESTful endpoints)
│   │   ├── admin/
│   │   │   ├── authors/                  # GET/POST list+create, [id] PATCH/DELETE (409 on dup/in-use)
│   │   │   ├── backup/route.ts           # POST full DB dump → CSV ZIP (admin only)
│   │   │   ├── brand/route.ts            # Brand config + logo/favicon upload
│   │   │   ├── categories/               # GET/POST list+create, [id] PATCH/DELETE
│   │   │   ├── librarians/               # CRUD + bulk import/delete
│   │   │   ├── monitoring/route.ts       # GET dashboard data (?range=24h/7d/14d/30d)
│   │   │   ├── monitoring/active-users/  # GET paginated active users (search/role filters)
│   │   │   ├── monitoring/events/        # GET live events stream + PATCH block/unblock IP
│   │   │   ├── students/                 # CRUD + bulk import/delete
│   │   │   ├── system-errors/            # GET error log (filters + pagination)
│   │   │   ├── system-errors/[id]/       # PATCH issue status (investigate/resolve/reopen)
│   │   │   └── teachers/                 # CRUD + bulk import/delete
│   │   ├── ai/chat/route.ts              # AI chat (RAG over knowledge/data.md + live catalog)
│   │   ├── auth/[...auth]/route.ts       # Better-Auth handler
│   │   ├── books/
│   │   │   ├── route.ts                  # GET (list) + POST (create w/ uploads)
│   │   │   ├── [id]/route.ts             # GET + PATCH (update) + DELETE
│   │   │   ├── categories/route.ts       # GET categories
│   │   │   ├── import/route.ts           # POST bulk import (ZIP+XLSX)
│   │   │   └── lecturer/route.ts         # GET + POST (lecturer-specific)
│   │   ├── checkBorrowBookReturnUser/    # GET active borrows w/ user+book info + overdue days
│   │   ├── cron/check-due-dates/route.ts # Scheduled overdue check (Bearer CRON_SECRET)
│   │   ├── files/[...path]/route.ts      # Serve uploaded files (path-traversal guarded)
│   │   ├── me/route.ts                   # Current user profile
│   │   ├── notifications/                # User notifications + announcements
│   │   │   ├── route.ts                  # GET user's notifications
│   │   │   ├── announcement/route.ts     # POST broadcast/targeted + GET history
│   │   │   ├── read/route.ts             # Mark all as read
│   │   │   └── [id]/route.ts             # DELETE notification (sender-gated)
│   │   ├── reservations/                 # CRUD + cancel/fulfill
│   │   └── system/
│   │       ├── client-error/route.ts     # POST browser error reports (rate-limited)
│   │       └── active-ping/route.ts      # POST active-user heartbeat (authenticated)
│   │
│   ├── admin/                            # Admin role pages
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── books/                        # Catalog management (catalog/create/edit/borrow-books/reservations)
│   │   ├── catalog/                      # categories/page.tsx + authors/page.tsx (CatalogManager)
│   │   ├── librarians/page.tsx
│   │   ├── monitoring/page.tsx           # Tabs: Overview / Security / Issues / Active Users
│   │   ├── password-resets/page.tsx      # Password reset request management (socket-synced)
│   │   ├── students/page.tsx
│   │   ├── sys-config/page.tsx           # Tabs: General / Branding / Semesters / Notice / Rules / Backup
│   │   └── teachers/page.tsx
│   │
│   ├── librarian/                        # Librarian role pages (admin minus monitoring/sys-config)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── books/                        # catalog/create/edit/borrow-books/reservations
│   │   ├── catalog/                      # categories + authors (CatalogManager)
│   │   ├── librarians/page.tsx
│   │   ├── students/page.tsx
│   │   └── teachers/page.tsx
│   │
│   ├── lecturer/                         # Lecturer role pages
│   │   ├── layout.tsx
│   │   ├── books/page.tsx
│   │   ├── ebooks/page.tsx               # E-book browsing + reader
│   │   ├── home/page.tsx
│   │   ├── manage-ebooks/page.tsx        # Create/View/Edit tabs + ZIP import
│   │   └── profile/page.tsx
│   │
│   ├── student/dashboard/page.tsx       # Student portal — URL-driven tabs (?tab=home|eresources|books|profile)
│   │
│   ├── portal/page.tsx                   # Sign-in page (login + forgot-password request panel)
│   ├── 403/page.tsx                      # Forbidden
│   └── blocked/page.tsx                  # Banned user page
│
├── components/                           # React components
│   ├── ui/                               # shadcn/ui primitives (~33 files incl. custom combobox/field/input-group/responsive-drawer)
│   ├── admin/                            # Admin-specific components
│   │   ├── monitoring/                   # MonitoringOverview, SecurityEventsTable, SystemErrorsPanel, ActiveUsersPanel
│   │   ├── library/                      # LibrarianTableWrapper, librarian-* forms
│   │   ├── students/                     # student-table-wrapper, student-create-form, student-metrics
│   │   ├── teachers/                     # teacher-table-wrapper, teacher-create-teacher-form, teacher-metrics
│   │   ├── AddSemesterForm / EditSemesterButton / DeleteSemesterButton
│   │   ├── SettingsForm.tsx, updateBrand.tsx, NoticeBoardManager.tsx, LibraryRulesManager.tsx
│   │   ├── BackupDataButton.tsx, MonitoringIssueBadge.tsx (issue:new socket badge)
│   ├── system/                           # ClientErrorReporter, ActiveUserPing (mounted in root layout)
│   ├── librarian/                        # NavData (nav config)
│   ├── lecturer/                         # NavData, Nav-main, App-sidebar, BookManagementModal, CreateBookModal, BookFormFields
│   ├── students/                         # Student portal components (tabs/, layout/, books/, modals/, ui/, StudentReadingStats)
│   ├── books/                            # Book CRUD components (BookFormField, BookZipImport, ImportModal, EditBookForm, ...)
│   ├── catalog/                          # CatalogManager.tsx (categories + authors CRUD)
│   ├── reservations/                     # ReservationStats, ReservationFilters, ReservationTable, Pagination
│   ├── reader/                           # Ebook reader (EbookReaderContainer + virtualized PdfCanvasView + ReaderHeader)
│   ├── ai/                               # AiFloatingWidget, aiChat, aiRecommendationsSection, aiBookSummarizer
│   ├── animations/                       # Lottie JSON animations, splash screen
│   │   ├── Loading.tsx                   # DotLottie global loading (library.json)
│   │   ├── Splash.tsx                    # Gradient splash screen
│   │   ├── TextToSvg.tsx                 # DotLottie text-to-svg animation
│   │   ├── InfinityLoading.json          # Lottie infinite scroll indicator
│   │   └── library.json
│   ├── app-sidebar.tsx                   # Shared sidebar (+ Monitoring badge)
│   ├── brand-config-provider.tsx         # Dynamic brand React context
│   ├── data-table.tsx                    # Generic table (tanstack/react-table + dnd-kit)
│   ├── EbookReader.tsx                   # Legacy PDF reader (react-pdf)
│   ├── LoginDialog.tsx / ProfileDialog.tsx / LogOutButton.tsx
│   ├── AlertModal.tsx                    # Announcement composer + history (704 lines)
│   ├── NotificationBell.tsx              # Real-time bell popover (socket + 30s poll)
│   ├── CirculationAnalyticsDashboard.tsx # Real-time client component with animated counters, socket-synced
│   ├── PasswordResetToast.tsx            # Global socket toast for password-reset events
│   ├── StatusBadge.tsx / RoleBadge.tsx / MetricCard.tsx / Counter.tsx / Stack.tsx / TextType.tsx
│   ├── PushInit.tsx / ServiceWorkerRegister.tsx / chart-area-interactive.tsx / section-cards.tsx
│   └── ... (other shared components)
│
├── config/
│   └── brand.ts                          # Brand config (name, logo, favicon, title) — runtime-rewritten
│
├── constants/
│   └── sampleData.ts                     # Sample import file paths
│
├── features/                             # Feature-based architecture scaffold
│   ├── README.md                         # Migration status and layout guide
│   ├── catalog/hooks/
│   │   ├── use-book-catalog.ts           # SWR hooks: useBookSearch, useBookInfinite, useBook, useCategories, useCatalogSync
│   │   └── use-catalog-management.ts     # SWR CRUD hooks: useCatalogList/Mutation/Delete
│   ├── circulation/hooks/
│   │   └── use-circulation.ts            # SWR hooks: useReservations, useNotifications, useCirculationSync
│   ├── user-management/hooks/
│   │   └── use-user-management.ts        # SWR + mutate hooks for user CRUD (+ useUserSync)
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
│   ├── use-socket.ts                     # useSocketEvent + getSocketInstance (singleton Socket.IO client)
│   └── usePushNotifications.ts           # Web push subscription (uses /sw.js)
│
├── lib/                                # Shared utilities (production-grade)
│   ├── auth.ts                           # Better-Auth server config (STUDENT default, 7-day sessions)
│   ├── auth-client.ts                    # Better-Auth client
│   ├── prisma.ts                         # Prisma client singleton (Pg adapter, pool max 8)
│   ├── utils.ts                          # cn(), getUploadPath()
│   ├── upload.ts                         # File validation (FILE_LIMITS) + helpers
│   ├── upload-limits.ts                  # cover 5 MB / ebook 200 MB / zip 200 MB
│   ├── fetcher.ts                        # SWR fetch wrapper
│   ├── get-current-user.ts               # Server-side user getter
│   ├── role-routes.ts                    # Role → default route mapping
│   ├── socket.ts                         # Socket.IO setIO()/getIO() (server-side)
│   ├── monitor.js                        # Request monitoring: visits, threats, rate bursts, blocklist, retention
│   ├── log-error.ts                      # logActionIssue / logSystemError (+ issue:new socket emit, 10-min dedupe)
│   ├── email.ts                          # sendEmail via Nodemailer (SMTP env)
│   ├── ebookCache.ts                     # IndexedDB offline cache
│   ├── sendPush.ts                       # Web push sender
│   ├── webpush.ts                        # VAPID config
│   ├── errors.ts                         # AppError class + ErrorCodes + toNextResponse()
│   ├── design-tokens.ts                  # CVA primitives: statusBadge, roleBadge, metricCard, actionButton
│   ├── digits.ts                         # toAsciiDigits (Burmese/Indic numerals → ASCII)
│   ├── pagination.ts                     # getPageNumbers (ellipsis pager)
│   ├── services/                         # Data Access Layer (DAL)
│   │   ├── auth.service.ts               # getSession, requireSession, requireRole, getDbUserRole, role hierarchy
│   │   ├── book.service.ts               # listBooks, getBookById, createBook, updateBook, deleteBook (+ socket emits)
│   │   ├── borrow.service.ts             # borrowBook, returnBook, createReservation, fulfillReservation (+ socket emits)
│   │   └── user.service.ts               # listUsers, createUser, updateUser, deleteUser, banUser, bulkCreate (+ socket emits)
│   ├── ai/groq.ts                        # Groq SDK client
│   ├── ai/knowledge.ts                   # Knowledge base loader + safeJsonParse
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
│   ├── schema.prisma                     # Database schema (25 models, 6 enums)
│   ├── seed.ts                           # Seed via Better-Auth signUp (admin + librarian)
│   └── migrations/                       # 32 migrations
│
├── public/
│   ├── images/                           # Brand logos, avatars, hero images
│   ├── sampleExcelFormat/                # Import templates (book/student/librarian ZIPs)
│   ├── bookImport.zip                    # Sample book import archive
│   └── sw.js                             # Service worker (web push)
│
└── libraryRules/
    └── rules.ts                          # Library rules (Burmese)
```

---

## 3. Architecture Overview

### Request Flow

```
Browser → server.js (monitor.js: blocked-IP check → visit/security tracking)
       → Next.js Proxy (proxy.ts) → Route Handler / Server Action → Prisma → PostgreSQL
                                   ↕                              ↕
                              Socket.IO (real-time)       Socket.IO emits (DAL)
```

Every request passes through `lib/monitor.js` before reaching Next.js:
- Blocked IPs are rejected with 403 (cached in-memory, refreshed periodically)
- Visits are logged (page views only; `/_next`, `/__nextjs`, `/api`, and static assets are skipped)
- Scanner UA / path-probe / rate-burst (40 req/15s per IP) are detected and logged as security events
- Paths include the query string (`_rsc` noise param stripped) — e.g. `/student/dashboard?tab=eresources`
- 5xx responses and responses slower than 8s are logged as system issues from `server.js`

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

### Password Reset Flow

```
User submits email + desired new password
  → forgotPasswordAction() hashes password immediately, creates PasswordResetRequest (PENDING, 24h expiry, only hash stored)
  → Socket emits "password-reset:requested" (global) + email sent to user via Nodemailer (when SMTP configured)
  → Admin sees request in /admin/password-resets with "Password provided" indicator (hash never exposed)
  → Admin clicks Accept — acceptPasswordResetAction() applies stored hash to Account,
    updates Account, deletes sessions, emits "password-reset:completed" to user room, emails the user
  → Admin clicks Reject — rejectPasswordResetAction() marks REJECTED,
    creates Notification, emits "password-reset:rejected" to user room
  → User receives real-time toast via PasswordResetToast component
```

### File Upload Flow

```
Client (FormData with File)
  → POST /api/books (or PATCH, etc.)
  → validateContentLength() checks content-length header (413 if exceeded)
  → req.formData() parses multipart body
  → validateFileSize() checks each file (413 if exceeded)
  → Buffer.from(await file.arrayBuffer())
  → writeFile to ../ucstgo-library-storage/books/{covers|ebooks}/{year}/{month}/
  → Store relative path in database
  → Serve via /api/files/{path} (path-traversal guard → ../ucstgo-library-storage)
```

### Role-Based Access

| Role | Routes | Responsibilities |
|------|--------|-----------------|
| ADMIN | `/admin/*` | Full system control, brand config, user management, books, monitoring |
| LIBRARIAN | `/librarian/*` | Book management, user management, circulation, reservations |
| LECTURER | `/lecturer/*` | Own book management, ebooks with LECTURER_ONLY access |
| STUDENT | `/student/*` | Browse, borrow, reserve, read ebooks, profile |

Roles are resolved from the **database** (`getDbUserRole`) in the proxy, not from the session — a banned/role-changed user is redirected to their default route.

### Borrow Audit Trail
- `app/actions/get-borrows.ts`: `getAllBorrows()` fetches all records including `RETURNED` for audit/history
- Return Date column in admin/librarian borrow tables + Excel/CSV/PDF exports
- `returnBookAction` restricted to LIBRARIAN and ADMIN roles

---

## 4. Database Schema (Prisma)

### Core Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | id, name, email, role (enum), studentId, banned, faculty, phone | All user accounts (Better-Auth compatible) |
| **Book** | id, isbn (unique), title, coverImage, categoryId, authorId, createdById, language, publisher, publicationYear, donate | Catalog entries (createdBy = lecturer ownership) |
| **Author** | id, name (unique) | Book authors |
| **Category** | id, name (unique) | Book categories |
| **BookCopy** | id, barcode (unique), status (enum), bookId, shelfLocation | Physical inventory tracking |
| **BorrowRecord** | id, borrowDate, dueDate, returnDate, status, userId, copyId | Circulation history |
| **Reservation** | id, reservedAt, expiresAt, status (enum), userId, bookId | Hold queue (FCFS) |
| **Ebook** | id, filePath, fileSize, format, accessType, semesterId, bookId | Digital books (1:1 with Book) |
| **Semester** | id, name (unique), slug (unique) | Academic period mapping |
| **ReadingHistory** | userId, ebookId, lastPage, progress, readingTime | Reading progress (unique per user+ebook) |
| **Bookmark** | userId, ebookId, pageNumber, note | User bookmarks |
| **Notification** | id, title, message, userId, senderId | Notifications (userId null = broadcast; targetable per user) |
| **NotificationRead** | notificationId, userId | Read receipts (cascade-deletes with notification) |
| **PasswordResetRequest** | id, userId, token (unique), status (string), requestedPasswordHash, expiresAt | Admin-mediated password resets (hash stored, never plaintext) |
| **SystemSetting** | key (PK), value, description | System configuration (about/vision/mission/footer text) |
| **Notice** | id, title, content, color | Notice-board posts (student home) |
| **LibraryRule** | id, content | Library rules (student home) |

### Monitoring Models (added for observability)

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **VisitLog** | id, path, ip, userAgent, referrer, visitedAt | Page view tracking (auto-deleted after 30 days) |
| **SecurityEvent** | id, eventType, ip, path, count, createdAt | Scanner/path-probe/rate-burst detections (auto-deleted after 90 days) |
| **BlockedIp** | id, ip (unique), reason, createdAt | Manual block list (checked per request) |
| **ErrorLog** | id, source (http/api/client/db/action), message, stack, endpoint, method, severity (error/warning/critical), status (open/investigating/resolved), count, firstSeen, lastSeen, ip | Unified issue tracking with 10-min dedupe (auto-deleted after 90 days) |
| **ActiveUser** | userId (unique), name, email, studentId, role, path, lastSeenAt | Signed-in users active in the last 5 minutes (auto-deleted after 24h) |

### Enums

```
Role: ADMIN | LIBRARIAN | STUDENT | LECTURER
CopyStatus: AVAILABLE | BORROWED | LOST | DAMAGED
BorrowStatus: BORROWED | RETURNED | OVERDUE
ReservationStatus: ACTIVE | FULFILLED | CANCELLED | EXPIRED
EbookFormat: PDF | EPUB | DOCX
EbookAccessType: OPEN | STUDENT_ONLY | LECTURER_ONLY | ADMIN_ONLY
```

> Note: `types/Role.ts` and `types/LibraryType.ts` still carry legacy reservation statuses (PENDING/CANCELLED) — slightly out of sync with the schema.

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
| GET/POST | `/api/admin/authors` | List (paginated/search) / create authors (409 on duplicate) |
| PATCH/DELETE | `/api/admin/authors/[id]` | Rename / delete author (blocked if books linked) |
| GET/POST | `/api/admin/categories` | List / create categories (409 on duplicate) |
| PATCH/DELETE | `/api/admin/categories/[id]` | Rename / delete category (blocked if in use) |
| POST | `/api/admin/brand` | Update brand config + logo/favicon uploads |
| GET | `/api/admin/monitoring` | Dashboard data: totals, visits chart series, top pages/IPs, recent events/visits, active users (+`activeCount`) — `?range=24h/7d/14d/30d` |
| GET | `/api/admin/monitoring/active-users` | Paginated active users (5-min window) — `?page&limit&search&role` |
| GET | `/api/admin/monitoring/events` | Live security event stream (filterable by type) |
| PATCH | `/api/admin/monitoring/events` | Block/unblock IP (`BlockedIp` upsert + `refreshBlockedIps()`) |
| GET | `/api/admin/system-errors` | Error log with status filter (open/investigating/resolved/all), pagination, counts incl. last 24h |
| PATCH | `/api/admin/system-errors/[id]` | Update issue status (investigate / resolve / reopen) |
| POST | `/api/admin/backup` | Full DB backup: every public-schema table → CSV inside a ZIP (admin only) |

### System (Observability)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/system/client-error` | Browser error reports (rate-limited 5/min per IP, production only) |
| POST | `/api/system/active-ping` | Active-user heartbeat (authenticated; upserts ActiveUser with name/email/studentId/role/path) |

### Other

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/chat` | AI chat with intent detection (RAG over `app/knowledge/data.md` + live catalog) |
| GET | `/api/me` | Current authenticated user profile |
| GET | `/api/checkBorrowBookReturnUser` | All active (BORROWED/OVERDUE) borrows with user/book info + overdue-day calculation |
| GET | `/api/files/[...path]` | Serve protected uploaded files (path-traversal guarded) |
| GET | `/api/notifications` | User's notifications (last 4) |
| POST | `/api/notifications/announcement` | Create broadcast (`userId` omitted) or targeted notification (`userId` set); emits `new-notification` |
| GET | `/api/notifications/announcement` | History (last 50, staff) with sender + recipient info |
| POST | `/api/notifications/read` | Mark all as read |
| DELETE | `/api/notifications/[id]` | Delete notification (staff may delete own sends; reads cascade) |
| GET | `/api/reservations` | Paginated reservations |
| POST | `/api/reservations/create` | Create reservation (dynamic expiration; 409 if copy available) |
| POST | `/api/reservations/[id]/cancel` | Cancel reservation |
| POST | `/api/reservations/[id]/fullfill` | Fulfill reservation (staff → borrow record; note "fullfill" spelling) |
| GET | `/api/cron/check-due-dates` | CRON: mark overdue, send 2-day alerts (secured with `CRON_SECRET` bearer token) |

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
| `lib/log-error.ts` / `lib/monitor.js` | `issue:new` (live error-log push) |
| `app/actions/password-reset.ts` | `password-reset:requested` (global), `password-reset:completed` (user room), `password-reset:rejected` (user room) |
| `app/api/notifications/announcement` | `new-notification` (broadcast) or to recipient room (targeted) |

### Client-Side (`hooks/use-socket.ts`)
- Singleton Socket.IO client connection (`io()` with WebSocket-only transport)
- `useSocketEvent(event, callback)` and `getSocketInstance()` — ref-based callback hook with connection logging
- Automatically connects on mount, disconnects on unmount

### Client-Side Socket Consumers
| Component | Listens To | Behavior |
|-----------|-----------|----------|
| `NotificationBell` | `new-notification` | Appends notification to bell popover (raw socket.io + 30s poll) |
| `CirculationAnalyticsDashboard` | `borrow:created`, `borrow:returned` | Re-fetches top books/top patrons, all numbers animate with spring transitions |
| `StudentReadingStats` | `borrow:created`, `borrow:returned` | Refreshes trending readers/books |
| `PasswordResetToast` | `password-reset:requested`, `password-reset:completed`, `password-reset:rejected` | Global toasts for admins/users |
| `AdminPasswordResetPage` | `password-reset:requested`, `password-reset:completed`, `password-reset:rejected` | Auto-refreshes request table |
| `MonitoringIssueBadge` | `issue:new` | Increments sidebar badge + toast (admin/librarian) |
| `SystemErrorsPanel` | `issue:new` | Re-fetches error-log list |

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
- `components/books/EditBookForm.tsx` + `EditBookLayout.tsx`: Edit form with image/file preview
- `components/books/BookFormField.tsx`: Shared form fieldset (title, ISBN, author/category combobox, cover/ebook, copies, shelf, semester)
- `components/books/BookTable.tsx`: Data table with search, pagination, filters
- `components/books/BookZipImport.tsx` + `ImportModal.tsx`: ZIP + XLSX bulk import UI
- `components/books/BorrowButton.tsx`: Reserve/borrow workflow
- `components/catalog/CatalogManager.tsx`: Categories + authors CRUD (search/pagination/bulk add)
- `components/lecturer/BookManagementModal.tsx`: Lecturer CRUD modal (+ `CreateBookModal`)

### Student Portal
- `components/students/tabs/HomeTab.tsx`: Dashboard with hero/typewriter, notices, rules, carousels, trends
- `components/students/tabs/EbooksTab.tsx`: Ebook browsing (semester/category filters) + reading
- `components/students/tabs/PhysicalTab.tsx`: Physical book browsing
- `components/students/tabs/ProfileTab.tsx`: Borrowing history, fines, bookmarks, reading progress
- `components/students/StudentReadingStats.tsx`: Socket-synced trending stats
- `components/students/layout/TopNav.tsx`: Top navigation bar
- `components/students/layout/BottomNav.tsx`: Mobile bottom navigation
- `app/student/dashboard/page.tsx`: 4-tab portal (URL-driven via `?tab=`) with InfiniteScroll Lottie animation

### Ebook Reader
- `components/reader/EbookReaderContainer.tsx`: Modern virtualized reader (@tanstack/react-virtual)
- `components/reader/PdfCanvasView.tsx`: Virtualized PDF page rendering (react-pdf)
- `components/reader/ReaderHeader.tsx`: Toolbar (close, prev/next, page counter)
- `components/EbookReader.tsx`: Legacy fullscreen reader (still present)
- `lib/ebookCache.ts`: IndexedDB offline caching

### AI Assistant
- `components/ai/AiFloatingWidget.tsx`: Draggable floating chat button (mounted in root layout)
- `components/ai/aiChat.tsx`: Chat interface with context-aware responses
- `components/ai/aiBookSummarizer.tsx`: AI-powered book summarization
- `components/ai/aiRecommendationsSection.tsx`: Personalized recommendations
- `lib/ai/groq.ts`: Groq SDK configuration
- `app/api/ai/chat/route.ts`: Server endpoint with intent detection + Burmese RAG over `app/knowledge/data.md`

### Admin Console
- `components/admin/students/student-table-wrapper.tsx`, `components/admin/teachers/teacher-table-wrapper.tsx`, `components/admin/library/LibrarianTableWrapper.tsx`: User management tables (search, XLSX import/export, ban, delete, edit drawer)
- `components/admin/AlertModal.tsx` (`components/AlertModal.tsx`): Announcement composer + history
- `components/admin/NoticeBoardManager.tsx`, `LibraryRulesManager.tsx`, `SettingsForm.tsx`, `AddSemesterForm.tsx`
- `components/admin/BackupDataButton.tsx`: Downloads DB backup ZIP
- `components/admin/monitoring/*`: MonitoringOverview, SecurityEventsTable, SystemErrorsPanel, ActiveUsersPanel

### Animations (Lottie)
- `components/animations/Loading.tsx`: Full-screen DotLottie loading (library.json)
- `components/animations/Splash.tsx`: Gradient splash screen
- `components/animations/TextToSvg.tsx`: DotLottie text-to-SVG animation
- `components/animations/InfinityLoading.json`: Infinite scroll Lottie (used in student dashboard)
- Player: `@dotlottie/react-player`

### Proxy (Middleware)
- `proxy.ts`: Next.js 16 proxy that enforces authentication + role-based routing
- Matcher covers `/admin/*`, `/student/*`, `/librarian/*`, `/lecturer/*`
- Skips server-action POSTs (form-data / `next-action` header) to avoid timeouts
- Allows public access to `/student` and `/student/dashboard`
- Redirects unauthenticated users to `/`; role checked from **DB** (`getDbUserRole`)
- Role mismatch → redirect to `getDefaultRoute(role)`

---

## 8. File Upload System

### Limits (configured in `lib/upload-limits.ts` / `lib/upload.ts`)

| File Type | Max Size |
|-----------|----------|
| Cover images | 5 MB |
| Ebook files (PDF) | 200 MB |
| ZIP imports | 200 MB |
| Server actions (brand) | 250 MB (`next.config.ts`) |

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

- DB stores the relative path (`books/covers/2026/07/...`) → served as `/api/files/books/covers/...`
- Legacy `lib/utils.ts` `getUploadPath()` (→ `public/uploads/...`) is dead code; active writing happens in `app/api/books/route.ts`

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
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.google.com" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "250mb",
      allowedOrigins: [
        "library.ucstaungoo.edu.mm",
        "*.ucstaungoo.edu.mm",
        "10.23.23.110",
        "10.23.23.110:3000",
      ],
    },
  },
};
```

### `server.js`

Custom Node.js HTTP server wrapping Next.js request handler with Socket.IO for real-time push notifications.
- Port: 3000 (configurable via `PORT` env)
- Loads `.env` via dotenv at startup (dev; production uses real env vars)
- Socket.IO CORS: origin `*`
- Socket events: `join` (user room), `disconnect`
- `global.io = io` exposed for DAL socket emits
- Logs 5xx responses and slow responses (>8s) as system issues via `lib/monitor.js`
- Intercepts requests through `lib/monitor.js` (blocked-IP 403, visit/security-event tracking)

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
SMTP_HOST / SMTP_PORT / SMTP_SECURE → SMTP connection (optional)
SMTP_USER / SMTP_PASS   → SMTP credentials (optional)
SMTP_FROM               → Sender address (default noreply@ucstgo.edu.mm)
```

---

## 10. Dependencies (Key Packages)

| Purpose | Packages |
|---------|----------|
| Framework | next, react, react-dom |
| Database | @prisma/client, @prisma/adapter-pg, pg, bcryptjs |
| Auth | better-auth, @better-auth/prisma-adapter |
| UI | tailwindcss, radix-ui, @base-ui/react, lucide-react, framer-motion, gsap, vaul, next-themes, tw-animate-css, sonner, shadcn |
| Tables | @tanstack/react-table, @tanstack/react-virtual, @dnd-kit/* (sortable/dnd) |
| Forms | react-hook-form, @hookform/resolvers, zod |
| Charts | recharts |
| PDF | react-pdf, pdfjs-dist, jspdf, jspdf-autotable |
| AI | groq-sdk |
| Realtime | socket.io, socket.io-client |
| Push/Email | web-push, nodemailer |
| File | xlsx, jszip, unzipper, mime-types, @aws-sdk/client-s3 |
| Animation | @dotlottie/react-player |
| Virtual lists | react-window, react-virtualized-auto-sizer |
| Utilities | date-fns, dayjs, clsx, tailwind-merge, swr |

---

## 11. Docker Deployment

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (node:22-alpine, corepack pnpm 10.12.4, non-root nextjs user) |
| `.dockerignore` | Excludes node_modules, .next, .git, .env, docs, etc. |
| `docker-compose.yml` | Container service with restart, env_file + build args (BETTER_AUTH_SECRET/BETTER_AUTH_URL/GROQ_API_KEY/DATABASE_URL), wget healthcheck |

### Dockerfile Stages

1. **`base`** — node:22-alpine with corepack-pinned pnpm
2. **`builder`** — Install with pnpm (frozen lockfile, strict-dep-builds off) + prisma generate + next build (standalone), env baked via build args
3. **`runner`** — Minimal runtime, non-root `nextjs` user, copies `.next`, `public`, `server.js`, `prisma`, `app/generated/prisma`, `node_modules`; `CMD ["node", "server.js"]`

### Deployment Commands

```bash
# Build and start
docker compose up -d --build

# Run database migrations
docker exec ucstgo-library npx prisma migrate deploy

# View logs
docker logs -f ucstgo-library
```

> `.dockerignore` excludes `.env`, but compose passes it via `env_file: .env` and forwards the four build args above.

---

## 12. Production Refactoring Architecture

### 12.1 Service Layer (DAL)

All database and auth logic is isolated in `lib/services/` — a clean Data Access Layer. Route handlers and server actions call these services instead of touching Prisma or Better-Auth directly.

| Service | File | Responsibility |
|---------|------|----------------|
| `AuthService` | `lib/services/auth.service.ts` | Session, role verification, role hierarchy, route guard helpers |
| `BookService` | `lib/services/book.service.ts` | Book CRUD, search/pagination, author/category upsert, barcode generation (+ socket emits) |
| `BorrowService` | `lib/services/borrow.service.ts` | Reservations lifecycle, fulfillment, overdue/due-soon sweep (+ socket emits) |
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
| Route handlers | ✅ All refactored | 42 API route files; core routes use service layer + `toNextResponse()`, observability routes (monitoring/system) added later |
| Observability | ✅ Complete | `lib/monitor.js` (visits, security events, blocked IPs, auto-cleanup), `lib/log-error.ts` (logSystemError/logActionIssue), `ErrorLog` + `ActiveUser` models, `server.js` 5xx/slow logging, monitoring + system error APIs, admin monitoring tabs, ClientErrorReporter + ActiveUserPing in root layout |
| Notification CRUD | ✅ Complete | Targeted sends, history with recipient/sender joins, DELETE endpoint, AlertModal recipient picker + delete + SWR history |
| Notice / library-rules CRUD | ✅ Complete | `updateNotice`, `updateLibraryRule` actions; inline edit modes in `NoticeBoardManager`, `LibraryRulesManager` |
| Authors / categories CRUD | ✅ Complete | `CatalogManager` + `/api/admin/authors`, `/api/admin/categories` with feature hooks (`use-catalog-management.ts`) |
| Database backup | ✅ Complete | `/api/admin/backup` (CSV ZIP dump) + `BackupDataButton` |
| Monitoring events PATCH | ✅ Complete | Block/unblock IP from security-events table |
| Student portal URL tabs | ✅ Complete | `?tab=home/eresources/books/profile` with Suspense wrapper |
| CVA wrapper components | ✅ Created | `StatusBadge`, `RoleBadge`, `MetricCard` |
| Component CVA adoption | ✅ Partial | `data-table`, `section-cards`, `BookPreview`, `ReservationTable`, `PhysicalBookDetailsModal`, `ProfileTab` |
| Feature hooks in pages | ✅ Partial | Admin/librarian books, reservations, students, teachers, librarians, catalog (10 pages) |
| Feature directory migration | ❌ Not started | Move components into `features/*/components/` |

---

## 13. File Counts & Stats

| Metric | Count |
|--------|-------|
| Total API route files | 42 (all using service layer + `toNextResponse()` where applicable) |
| Server action files | 23 |
| Page files | 31 |
| Service modules | 4 (`auth.service`, `book.service`, `borrow.service`, `user.service`) |
| CVA wrapper components | 3 (`StatusBadge`, `RoleBadge`, `MetricCard`) |
| Feature hooks | 4 (`use-book-catalog`, `use-catalog-management`, `use-circulation`, `use-user-management`) |
| Pages refactored to feature hooks | 10 (admin/librarian books, reservations, students, teachers, librarians, catalog) |
| Components using CVA primitives | 6 (`data-table`, `section-cards`, `BookPreview`, `ReservationTable`, `PhysicalBookDetailsModal`, `ProfileTab`) |
| Socket event hooks | 5 (`useBooksInfinite`, `useCatalogSync`, `useCirculationSync`, `useUserSync`, `useSocketEvent`) |
| Socket consumers (components) | 7 (`NotificationBell`, `CirculationAnalyticsDashboard`, `StudentReadingStats`, `PasswordResetToast`, `AdminPasswordResetPage`, `MonitoringIssueBadge`, `SystemErrorsPanel`) |
| Lottie animation files | 4 (`Loading.tsx`, `Splash.tsx`, `TextToSvg.tsx`, `InfinityLoading.json`) |
| Docker deployment files | 3 (`Dockerfile`, `.dockerignore`, `docker-compose.yml`) |
| Database migrations | 32 |
| Production files created | `lib/errors.ts`, `lib/design-tokens.ts`, `lib/socket.ts`, `lib/monitor.js`, `lib/log-error.ts`, `lib/email.ts`, `lib/services/*.ts` (4), `hooks/use-socket.ts`, `features/*/hooks/*.ts` (4), `components/StatusBadge.tsx`, `components/RoleBadge.tsx`, `components/MetricCard.tsx`, `components/PasswordResetToast.tsx`, `components/system/*`, `components/admin/monitoring/*`, `components/AlertModal.tsx`, `features/README.md`, `Dockerfile`, `.dockerignore`, `docker-compose.yml` |
| Lines of code removed from route files | ~2,500+ (inline Prisma queries, availability calcs, manual auth checks consolidated into services) |
| Password reset flow | 3 server actions (`forgotPassword`, `acceptPasswordReset`, `rejectPasswordReset`), admin page (`password-resets/page.tsx`), global toast component, `PasswordResetRequest` model + migration, 3 socket events + SMTP email |
| Author/category CRUD | `CatalogManager`, `/api/admin/authors`, `/api/admin/categories` (4 route files), feature hooks |
| DB backup | `/api/admin/backup` (CSV ZIP via pg Pool + JSZip) + `BackupDataButton` |

---

## 14. File Size Limits

| Location | File Type | Limit |
|----------|-----------|-------|
| `lib/upload-limits.ts` | Book covers | 5 MB |
| `lib/upload-limits.ts` | Ebook PDFs | 200 MB |
| `lib/upload-limits.ts` | ZIP imports | 200 MB |
| `next.config.ts` | Server action bodies | 250 MB |

---

## 15. Monitoring & Observability

### 15.1 Request Pipeline (`lib/monitor.js` + `server.js`)

All traffic passes through `server.js` → `lib/monitor.js` before reaching Next.js:

| Step | Behavior |
|------|----------|
| Blocked-IP check | In-memory cache (refreshed from DB), 403 on match |
| Rate-burst detection | 40 requests / 15s per IP → `RATE_BURST` security event |
| Threat detection | Scanner user-agents (`SCANNER_UA`) and suspicious paths (`PATH_PROBE`) |
| Visit logging | GET page views only; skips `/_next`, `/__nextjs`, `/api`, static assets; path keeps query string (`_rsc` stripped) |
| 5xx / slow response | `server.js` `res.on("finish")` → `logIssue` (HTTP source, >8s = slow) |
| DB errors | `pool.on("error")` → `logIssue` (db source) |

### 15.2 Error Logging (`ErrorLog` model)

| Source | Written by |
|--------|-----------|
| `http` | `server.js` (5xx, slow responses) |
| `api` | `toNextResponse()` in `lib/errors.ts` — unhandled errors as errors, 4xx `AppError`s as warnings (401/403/404/429 excluded) |
| `client` | `/api/system/client-error` from `ClientErrorReporter` (window error / unhandledrejection, production only, 30s dedupe) |
| `db` | monitor.js pool error hook |
| `action` | `logActionIssue()` in `lib/log-error.ts` — used by ~19 server actions (borrow, return, ban, warnings, notices, rules, semesters, settings, analytics, profile, ...); skips `Unauthorized` messages |

Status workflow: `open → investigating → resolved` (admin panel buttons). Identical rows within 10 minutes increment `count` (dedupe). Every new row emits `issue:new` over Socket.IO — `MonitoringIssueBadge` and `SystemErrorsPanel` update live. `lib/monitor.js` buffers up to 200 rows in memory when the DB is unreachable and flushes on retry.

### 15.3 Active Users

- `ActiveUserPing` (client, mounted in root layout) posts a heartbeat every 60s with `pathname + search`
- A 5s URL-change check posts immediately when the URL changes (e.g. tab switch), so monitoring reflects the exact page (`/student/dashboard?tab=eresources`)
- `/api/system/active-ping` upserts by `userId` with server-side identity (name, email, studentId, role)
- Window: `lastSeenAt` within 5 minutes

### 15.4 Admin UI (`/admin/monitoring`)

| Tab | Content |
|-----|---------|
| Overview | 6 metric cards (Active Now = distinct IPs in 5 min, Visits Last Hour, Unique Visitors, Visits Today, Security Events, Blocked IPs), visits bar chart with 24h/7d/14d/30d range toggle, live Page Views / Active Users feed, detected threats, top pages, top IPs — polls every 5s |
| Security Events | Event table (Live · 5s), blocked IPs (Live · 10s) |
| System Issues | Error log with status filter pills + counts, health chips, Investigate/Resolve/Reopen actions — polls every 10s |
| Active Users | Search (name/roll/email, debounced), role filter pills, paginated table (15/page), Live · 5s |

### 15.5 Data Retention (auto-cleanup in `monitor.js`)

| Table | Retention |
|-------|-----------|
| `visit_log` | 30 days |
| `security_event` | 90 days |
| `error_log` | 90 days |
| `active_user` | 24 hours |

Cleanup runs every 30 minutes (24h throttle), interval is `.unref()`-ed so it never blocks shutdown.

---

## 16. Student Portal URL Tabs

`/student/dashboard` is a single route whose tabs are driven by a `tab` search param (`lib`-free, client-side `router.replace`, no reload):

| URL | Tab |
|-----|-----|
| `/student/dashboard` | Home (default) |
| `/student/dashboard?tab=eresources` | EResources |
| `/student/dashboard?tab=books` | Physical books |
| `/student/dashboard?tab=profile` | Profile |

Benefits: refresh persistence, browser back/forward, deep-linking. Unknown `tab` values fall back to Home. The page is wrapped in a `Suspense` boundary (required by `useSearchParams`). Monitoring records the full path including the tab query.

---

## 17. Production Readiness

Verified: `pnpm build` passes (TypeScript + routes), production mode boots via `NODE_ENV=production node server.js` (socket.io + monitoring verified), deploy script exists (`pnpm deploy` — git pull, install, migrate, build, pm2 reload).

**Required before go-live:**

| Item | Status |
|------|--------|
| `BETTER_AUTH_URL` + `NEXT_PUBLIC_SITE_URL` set to real domain **before** build (NEXT_PUBLIC is inlined client-side) | ⚠️ currently `http://localhost:3000` |
| `BETTER_AUTH_SECRET`, `DATABASE_URL`, SMTP, VAPID keys present in server env | ⚠️ confirm on server |
| E-book / cover storage present on server (`../ucstgo-library-storage/` sibling dir; S3 not yet wired — `@aws-sdk/client-s3` is a dependency only) | ⚠️ confirm |
| Supabase pooler session-mode connection limits vs Prisma pool size (pool max 8) | ⚠️ verify |
| Registration is open to the public (anyone can sign up as STUDENT) | ⚠️ consider gating |
| Lint debt: 296 problems (186 errors, 110 warnings) repo-wide — mostly `no-explicit-any`, unused vars, exhaustive-deps; `student/dashboard/page.tsx` alone has 16 (11 errors, 5 warnings). Not build blockers (Next 16 skips lint in build; `next lint` itself is removed in Next 16 — run `pnpm exec eslint` instead) | ⚠️ cleanup recommended |
| `pnpm lint` script is broken (`next lint` no longer exists in Next 16) — update script to `eslint .` | ⚠️ fix |
