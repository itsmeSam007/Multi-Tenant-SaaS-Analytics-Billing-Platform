# 📜 Development Conventions & AI Guardrails

## 🏗️ Architectural Principles
- **Pattern:** Follow the Controller-Service-Repository pattern for all modules.
- **Modularity:** Keep modules decoupled. Business logic stays in Services; Data access stays in Repositories.
- **Single Source of Truth:** The `schema.prisma` file is the ultimate authority on data structures. Always check it before proposing model changes.

## 🛡️ NestJS (TypeScript) Standards
- **Strict Typing:** NO `any` allowed. Use interfaces, types, or classes for everything.
- **Validation:** Every Controller input must use a DTO with `class-validator` decorators.
- **Errors:** Use standard NestJS `HttpException` classes (e.g., `NotFoundException`).
- **Dependency Injection:** Always use Constructor Injection; never use the `new` keyword for services.

## 🏢 Multi-Tenancy & Security (Priority #1)
- **Tenant Isolation:** Every database query MUST include a `tenant_id` filter.
- **Middleware:** Use the Prisma middleware/extension to automatically inject `tenant_id` into queries.
- **Context:** Always retrieve `tenant_id` from the `Request` object via a custom decorator (`@CurrentTenant()`).

## 📦 Queue & Background Jobs (BullMQ)
- **Processors:** Keep job logic in dedicated `.processor.ts` files.
- **Reliability:** Always implement `failed` and `completed` listeners for observability.

## 🔒 NestJS 11 Specifics
- **Typed Config:** Use the `config/` directory with `ConfigService` for all environment variables.
- **DTOs:** Use `mapped-types` for `PartialType` in Update DTOs to maintain strict typing.

## 📊 Data & Prisma
- **Type Safety:** Always run `npx prisma generate` after schema changes.
- **Migrations:** Never manually edit the database. Always use `npx prisma migrate dev`.
- **PostgreSQL:** Utilize native Postgres features (Enums, JSONB) where beneficial, defined via Prisma.

## 🤖 Agentic Behavior & Commits
- **Test-First**: Before writing a feature, draft the unit test using Jest.
- **Conventional Commits**: Use `feat:`, `fix:`, `refactor:`, or `docs:` for all AI-generated commits.
- **Self-Correction**: If a test fails, analyze the stack trace and iterate until the module is "Error-Free."