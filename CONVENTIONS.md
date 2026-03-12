# 📜 SaaS Development Conventions & AI Guardrails (2026 Edition)

## 🏗️ Architectural Principles (NestJS 11)
- **Pattern:** Strictly follow the Controller-Service-Repository pattern.
- **Decoupling:** Business logic belongs in Services. Data access logic belongs in Repositories or specialized Prisma Service extensions.
- **Modularity:** Every feature must reside in its own module. Shared logic must be moved to a `CommonModule` or `SharedModule`.
- **Single Source of Truth:** `prisma/schema.prisma` is the absolute authority for data models. Always read it before proposing changes.

## 🛡️ TypeScript & NestJS Standards
- **Strict Typing:** `any` is forbidden. Use `unknown` with Type Guards or specific Interfaces.
- **Dependency Injection:** Use Constructor Injection only. Never use `new` for providers.
- **Validation:** All inputs must have DTOs with `class-validator` and `class-transformer`.
- **DTO Safety:** Use `PartialType` from `@nestjs/mapped-types` for updates.
- **Errors:** Use built-in NestJS `HttpException` (e.g., `ConflictException`, `ForbiddenException`).

## 🏢 Multi-Tenancy & Security (Priority #1)
- **Tenant Isolation:** Use **Prisma 7 Extensions** (`$extends`), NOT legacy Middleware.
- **Query Scoping:** Every database operation MUST be scoped to `tenant_id` via the Prisma Client extension.
- **Context Retrieval:** Extract `tenant_id` from the request using the `@CurrentTenant()` decorator.
- **Logic Guard:** Any query lacking an explicit `tenant_id` filter (unless globally scoped) is considered a critical security bug.

## 📊 Prisma 7 & PostgreSQL Specifics
- **Configuration:** Use `prisma.config.ts` for database connections (New in v7).
- **Driver Adapters:** Use `@prisma/adapter-pg` with a connection pool for all operations.
- **Type Generation:** Always run `npx prisma generate` after schema edits.
- **Output Path:** Generated client must reside in `src/generated/client` to maintain project cleanlines.
- **Migrations:** Use `npx prisma migrate dev` for all schema changes. Never modify the DB manually.

## 📦 Background Jobs (BullMQ)
- **Isolation:** Logic must reside in `.processor.ts` files using the `WorkerHost` pattern.
- **Tenant Propagation:** When adding a job to a queue, the `tenant_id` must be included in the job `data` payload.

## 🤖 AI Agent Guardrails (Aider/Cline)
- **Scope Limitation:** Only modify files explicitly added to the chat. If a "Read-Only" file needs changes, stop and ask for permission.
- **Safe App Registration:** When adding to `app.module.ts`, append to the `imports` array. Do not reorder or delete existing lines.
- **Test-Driven Development:** Draft a Vitest/Jest test file *before* or *alongside* the feature implementation.
- **Conventional Commits:** Use `feat:`, `fix:`, `refactor:`, or `docs:` for all generated commits.
- **Self-Correction:** If a test or build fails, analyze the log and fix the code autonomously before reporting completion.

## 📁 Folder Structure & Naming
- **Domain Modules (`src/modules/[name]/`):** Use singular kebab-case for the name.
  - *Example:* `src/modules/project-management/`
- **Internal File Structure:** Every module must contain:
  - `[name].module.ts` (Entry point)
  - `[name].controller.ts` (Routing & Request handling)
  - `[name].service.ts` (Business logic)
  - `dto/` (Input validation classes)
  - `entities/` (If using non-Prisma local types)
- **Shared Utilities (`src/common/`):**
  - `guards/`, `interceptors/`, `decorators/`, `pipes/`