<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Instructions & Architectural Guidelines — Klarisa Platform

You are pair programming on the **Klarisa** platform codebase. Follow these instructions and architectural principles whenever creating, extending, or refactoring code for any feature in this repository.

---

##  1. Core Architectural Principles (Clean Layered Architecture)

Maintain a strict separation of concerns across the codebase. When adding any new domain feature (e.g., `contracts`, `chats`, `workspaces`, `profiles`, `documents`), organize the code into these functional layers inside `src/`:

```
src/
├── types/                      # Type definitions & domain models (<feature>.type.ts)
├── app/validations/            # Input validation schemas (<feature>.validation.ts)
├── repositories/               # Data access layer using Supabase SDK (<feature>.repository.ts)
├── services/                   # Business logic, sanitization, & error translation (<feature>.service.ts)
├── hooks/                      # UI state management & navigation hooks (use<Feature>.ts)
├── lib/                        # Shared system utilities & helpers (utils.ts, response.ts, supabase/)
├── components/                 # Reusable UI components & design system
└── app/                        # Presentation layer (App Router pages, route groups, API routes)
```

---

## 📐 2. Layer Responsibilities & Rules

### 1. `src/types/<feature>.type.ts` (Type Definitions Layer)
- Define TypeScript interfaces, DTOs, domain models, and hook state contracts for the feature module.
- Leverage Supabase auto-generated table schemas from `@/types/database.type` (`Tables<'table_name'>`).
- Export domain-specific response types aliased from `BaseResponse<T>` (defined in `@/types/response.type`).

### 2. `src/app/validations/<feature>.validation.ts` (Validation Layer)
- Define all Zod validation schemas for forms, request payloads, and user inputs.
- Export inferred TypeScript types (`z.infer<typeof schema>`).
- Import `z` directly from `'zod'`.

### 3. `src/repositories/<feature>.repository.ts` (Data Access Layer)
- Isolate native Supabase SDK calls (database queries, RPCs, storage, Auth).
- Class named in `PascalCase` (e.g., `ContractRepository`), exported as a singleton instance in `camelCase` (e.g., `contractRepository`).
- **Do NOT** include Zod validation logic, UI routing, or localized user error messages in this layer.

### 4. `src/services/<feature>.service.ts` (Business Logic Layer)
- Orchestrate feature workflows: validate input via Zod schemas, sanitize string inputs using utilities from `@/lib/utils`, and call repository methods.
- Map external errors (e.g., Supabase errors) to polite Indonesian user messages using `mapSupabaseError()` or feature-specific error mappers.
- Class named in `PascalCase` (e.g., `ContractService`), exported as a singleton instance in `camelCase` (e.g., `contractService`).
- **MUST** wrap all returned data and errors in standard `BaseResponse<T>` using `createSuccessResponse()` or `createErrorResponse()`.

### 5. `src/hooks/use<Feature>.ts` (Custom Hook Layer)
- Manage React component state (`isLoading`, `error`, `isSuccess`, `data`).
- Handle client-side navigation (`useRouter` from `next/navigation`).
- Expose clean, ready-to-use handlers for components (`handleCreate`, `handleUpdate`, `handleDelete`).

### 6. `src/lib/` (Utilities Layer)
- `src/lib/utils.ts`: Pure utility functions (e.g., `cn()`, `sanitizeFullName()`, `sanitizeEmail()`, string sanitizers).
- `src/lib/response.ts`: Standard response factory helpers (`createSuccessResponse`, `createErrorResponse`, `mapSupabaseError`).
- `src/lib/supabase/`: Client, Server, and Middleware Supabase SSR setup.

### 7. `src/app/` & `src/components/` (Presentation Layer)
- Client components interact with services through custom hooks (`use*`).
- Server components and route handlers interact directly with services or server-side Supabase clients.

---

## 3. Naming Conventions & File Patterns

- **Type Files**: `<feature>.type.ts` in `src/types/` (e.g., `auth.type.ts`, `contract.type.ts`, `chat.type.ts`).
- **Validation Files**: `<feature>.validation.ts` in `src/app/validations/` (e.g., `auth.validation.ts`, `contract.validation.ts`).
- **Repository Files**: `<feature>.repository.ts` in `src/repositories/` (e.g., `auth.repository.ts`, `contract.repository.ts`).
- **Service Files**: `<feature>.service.ts` in `src/services/` (e.g., `auth.service.ts`, `contract.service.ts`).
- **Custom Hook Files**: `use<Feature>.ts` in `src/hooks/` (e.g., `useAuth.ts`, `useContract.ts`, `useChat.ts`).

---

## 4. Code Commenting Standard

> [!IMPORTANT]
> **All code comments MUST be written in ENGLISH.**
> This applies to JSDoc comments, inline explanations, function headers, and docstrings across all files in the repository.

---

## 5. Standardized Response & Error Handling

All service methods and API handlers must consistently return responses adhering to `BaseResponse<T>`:

```typescript
export interface BaseResponse<T = unknown> {
  success: boolean
  data?: T | null
  error?: string | null
  message?: string
}
```

- **Success**: Return `createSuccessResponse(data, optionalIndonesianMessage)`.
- **Error**: Return `createErrorResponse(translatedErrorMessage)`. User-facing error and notification messages shown in the UI must be written in clear, polite Indonesian.

---

## 6. Verification Rule

After creating or modifying any files, always verify TypeScript compilation:

```bash
npx tsc --noEmit
```

Ensure the command exits with code 0 and zero errors before finalizing any task.
