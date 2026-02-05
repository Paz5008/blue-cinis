# Loire Gallery Project Context

## Overview
Loire Gallery is a Next.js platform connecting artists from the Loire Valley with art lovers. It features a public gallery, artist dashboards, and admin tools.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript (Strict mode)
- **Database**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`)
- **Type Safety**: Zod for validation
- **Styling**: Tailwind CSS + DaisyUI
- **Icons**: Lucide React
- **Auth**: NextAuth.js (v4)
- **State Management**: React Context (minimal use), URL state
- **Testing**: Vitest, Playwright

## Design System
The design is inspired by the Loire Valley (River, Tuffeau stone, Vineyards).
- **Colors**:
  - `river-blue`: Primary aesthetic color
  - `tuffeau-sand`: Backgrounds/Warm neutrals
  - `vine-green`: Success/Nature accents
  - `castle-gray`: Text/Structure
- **Fonts**:
  - `Playfair Display`: Headings (Serif)
  - `Montserrat`: Body (Sans-serif)
- **UI Libraries**:
  - DaisyUI for base components
  - `framer-motion` for animations
  - `react-hot-toast` for notifications

## Key Conventions
1.  **Architecture**:
    - Use **Server Components** by default. Add `"use client"` only when interactive.
    - **Server Actions** (`app/actions.ts` or `app/api/...`) for mutations.
    - **Barrel Files**: Prefer importing from specific files to avoid circular deps unless `index.ts` is purely for aggregation.
2.  **Coding Style**:
    - Functional components with named exports.
    - Explicit imports for Lucide icons (e.g., `import { Menu, X } from 'lucide-react'`).
    - Use `clsx` or `tailwind-merge` for class manipulation.
3.  **Data Fetching**:
    - Fetch directly in Server Components using prisma.
    - Use `Suspense` for loading states.

## Core Data Models
- **User**: Base authentication entity (Admins, Artists, Clients).
- **Artist**: Profile data, linked to User.
- **Artwork**: Main product entity.
- **Lead/Reservation**: Tracks interest in artworks.

## Workflow Tips
- **Files**: always use absolute paths.
- **Images**: Use `next/image`.
- **New Components**: Place in `components/[domain]/`.
