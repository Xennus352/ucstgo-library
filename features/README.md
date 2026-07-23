# Feature-Based Architecture

This directory organizes code by **domain** rather than by role or file-type. Each feature is self-contained with its own components, hooks, services, and types.

## Structure

```
features/
├── catalog/            # Books, authors, categories CRUD + browsing
├── circulation/        # Borrowing, returning, reservations
├── ebooks/             # Ebook reader, uploads, reading history
├── auth/               # Authentication, session, role management
├── user-management/    # Admin CRUD for students/librarians/teachers
├── notifications/      # Push notifications, announcements
├── analytics/          # Charts, statistics, dashboard data
├── ai-assistant/       # AI chat, recommendations, summarization
└── branding/           # Brand config, logo, favicon, site title
```

## Per-Feature Layout

Each feature follows this pattern:

```
features/catalog/
├── components/         # Presentation-only UI (no data fetching)
│   ├── BookCard.tsx
│   └── BookForm.tsx
├── hooks/              # Custom hooks with SWR + data fetching logic
│   └── use-book-catalog.ts
├── services/           # Feature-specific server action wrappers
│   └── catalog.actions.ts
└── types/              # Feature-specific TypeScript types + Zod schemas
    └── catalog.types.ts
```

## Migration Status

| Feature | Components | Hooks | Services | Types |
|---------|-----------|-------|----------|-------|
| Catalog | legacy/ | legacy/ | ✅ `lib/services/book.service.ts` | types/ |
| Circulation | legacy/ | legacy/ | ✅ `lib/services/borrow.service.ts` | types/ |
| Auth | legacy/ | legacy/ | ✅ `lib/services/auth.service.ts` | types/ |
| User Mgmt | legacy/ | legacy/ | ✅ `lib/services/user.service.ts` | types/ |
| Branding | legacy/ | legacy/ | server actions | config/ |
| Ebooks | legacy/ | legacy/ | — | types/ |
| AI | legacy/ | legacy/ | — | — |
| Notifications | legacy/ | legacy/ | — | — |
| Analytics | legacy/ | — | server actions | — |

> **legend:** ✅ = migrated to service layer, `legacy/` = still in `components/` or `app/actions/`
