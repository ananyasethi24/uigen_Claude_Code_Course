# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator. Users describe components in a chat interface, Claude generates the code via tool calls, and a live preview renders the result in a sandboxed iframe. All generated files live in an in-memory virtual file system — nothing is written to disk.

## Commands

- `npm run dev` — Start dev server (Next.js + Turbopack on port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run all tests (Vitest + jsdom)
- `npx vitest run src/path/to/test.test.tsx` — Run a single test file
- `npm run setup` — Install deps, generate Prisma client, run migrations
- `npm run db:reset` — Reset the SQLite database

Note: The Windows dev script uses `set NODE_OPTIONS=...`. The Unix scripts use `NODE_OPTIONS='...'`. The `node-compat.cjs` shim is required at runtime.

## Architecture

### AI Chat Flow

1. **Client**: `ChatProvider` (`src/lib/contexts/chat-context.tsx`) uses Vercel AI SDK's `useChat` hook, sending messages + serialized virtual file system to `/api/chat`
2. **Server**: `POST /api/chat` (`src/app/api/chat/route.ts`) reconstructs a `VirtualFileSystem`, calls `streamText` with two tools: `str_replace_editor` and `file_manager`
3. **Tool calls stream back** to the client, where `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) applies them to the client-side VirtualFileSystem
4. **Preview**: `PreviewFrame` watches `refreshTrigger` from FileSystemContext, transpiles JSX via `@babel/standalone` in the browser, and renders in a sandboxed iframe using blob URL import maps

### Key Abstractions

- **VirtualFileSystem** (`src/lib/file-system.ts`): In-memory tree of `FileNode` objects. Supports create/read/update/delete/rename, plus `replaceInFile` and `insertInFile` for the str_replace_editor tool. Serialized as JSON to send between client and server.
- **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Browser-side Babel transpilation that converts virtual files into blob URLs with an import map for the preview iframe.
- **Mock Provider** (`src/lib/provider.ts`): When no `ANTHROPIC_API_KEY` is set, a `MockLanguageModel` returns static component code so the app runs without API access. Uses Claude Haiku 4.5 when a key is present.

### AI Tools (given to Claude during generation)

- `str_replace_editor` (`src/lib/tools/str-replace.ts`): create files, str_replace within files, insert at line number
- `file_manager` (`src/lib/tools/file-manager.ts`): rename and delete files

### Auth & Data

- JWT-based auth using `jose`, stored in httpOnly cookies (`src/lib/auth.ts`)
- Prisma + SQLite: `User` and `Project` models. Projects store messages and file system data as JSON strings.
- The database schema is defined in `prisma/schema.prisma` — reference it anytime you need to understand the structure of stored data.
- Anonymous users can work without auth; `anon-work-tracker.ts` persists their state in localStorage

### Preview Entry Point Convention

The preview looks for `/App.jsx` first, then `/App.tsx`, `/index.jsx`, etc. The system prompt instructs Claude to generate an `App.jsx` as the entry point.

## Tech Stack

- Next.js 15 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Prisma with SQLite (generated client outputs to `src/generated/prisma`)
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)
- UI: Radix primitives via shadcn/ui (`src/components/ui/`), Monaco editor, react-resizable-panels
- Testing: Vitest + React Testing Library + jsdom
