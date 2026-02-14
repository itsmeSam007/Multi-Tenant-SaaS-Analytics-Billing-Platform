# 🚀 Multi-Tenant SaaS Platform - Production-Ready Architecture

**Stack:** NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis 7 + BullMQ + Docker

## 📋 Project Overview

Enterprise-grade Multi-Tenant SaaS backend designed for B2B platforms (CRM, Analytics, Internal Tools). This project implements industry-standard patterns for authentication, authorization, multi-tenancy, background jobs, and scalability.

## 🏗️ Architecture

```
Client (Web / Mobile)
        ↓
   API Gateway
        ↓
   NestJS Backend
        ↓
┌───────────────────────┐
│  Modules Layer        │
│  (Auth, Users, etc.)  │
└───────────────────────┘
        ↓
┌───────────────────────┐
│ Infrastructure Layer  │
│ Prisma | Redis | S3   │
└───────────────────────┘
        ↓
    PostgreSQL

```

## ✨ Core Features

### 🔐 Authentication & Security

- JWT Access Tokens (15 min expiry)
- Refresh Token rotation with HttpOnly cookies
- Token reuse detection (SHA-256 hashing)
- Account lockout after failed login attempts
- Device-based session tracking
- Redis-based logout invalidation

### 👥 Authorization (RBAC)

- Role hierarchy (USER, ADMIN, SUPER_ADMIN)
- Permission-level access control
- Guards + decorators (`@Roles('ADMIN')`, `@Permissions('users.create')`)
- Per-tenant role isolation

### 🏢 Multi-Tenancy

- Row-level `tenant_id` isolation
- Prisma middleware for automatic tenant scoping
- Request-scoped tenant context
- Zero cross-tenant data leakage

### 📦 Background Jobs (BullMQ)

- Redis-backed job queues
- Email processing
- Webhook delivery with retry logic
- Audit log batching
- File processing pipelines

### ☁️ File Uploads

- S3 / MinIO integration
- Pre-signed upload URLs
- Public & private file storage
- Metadata tracking in database

### 📊 Observability

- Structured logging (Pino/Winston)
- Request correlation IDs
- Health checks (DB + Redis)
- Job monitoring & metrics

## 📁 Project Structure

```
backend/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── prisma.config.ts
│
└── src/
    ├── main.ts
    ├── app.module.ts
    │
    ├── config/
    │   ├── app.config.ts
    │   ├── database.config.ts
    │   ├── redis.config.ts
    │   └── jwt.config.ts
    │
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── dto/
    │   │   ├── strategies/
    │   │   └── guards/
    │   │
    │   ├── users/
    │   ├── roles/
    │   ├── tenants/
    │   ├── permissions/
    │   ├── files/
    │   ├── jobs/
    │   ├── audit/
    │   ├── webhooks/
    │   └── health/
    │
    └── common/
        ├── decorators/
        ├── guards/
        ├── interceptors/
        ├── filters/
        └── utils/

```

## 🛠️ Tech Stack

| **Component** | **Version** | **Purpose** |
| --- | --- | --- |
| Node.js | 22.x | Runtime |
| NestJS | 11.x | Framework |
| TypeScript | 5.7.x | Language |
| Prisma | 7.x | ORM |
| PostgreSQL | 16 | Database |
| Redis | 7 | Cache + Queue |
| BullMQ | Latest | Job Queue |
| Docker | Latest | Containerization |

## 🚀 Quick Start

### 1. Prerequisites

```bash
node -v  # v22.x required
docker --version
docker-compose --version

```

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start infrastructure (Postgres + Redis)
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run start:dev

```

### 3. Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# { "status": "ok", "database": "connected", "redis": "connected" }

```

## 📚 Database Schema

### Core Models

```
model Tenant {
  id        String   @id @default(uuid())
  name      String
  users     User[]
  createdAt DateTime @default(now())
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  password       String
  role           Role      @default(USER)
  tenantId       String
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  createdAt      DateTime  @default(now())
}

model RefreshToken {
  id           String   @id @default(uuid())
  userId       String
  tokenHash    String   @unique
  expiresAt    DateTime
  isRevoked    Boolean  @default(false)
  userAgent    String?
  ipAddress    String?
  createdAt    DateTime @default(now())
}

model Permission {
  id     String @id @default(uuid())
  code   String @unique
  name   String
}

model Role {
  id          String @id @default(uuid())
  name        String
  tenantId    String
  permissions Json
}

```

## 🔑 Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=uploads

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=

```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch

```

## 📖 API Documentation

### Authentication

```bash
# Register
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantId": "uuid"
}

# Login
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Refresh Token
POST /auth/refresh
Cookie: refresh_token=...

# Logout
POST /auth/logout
Authorization: Bearer <access_token>

```

### Protected Routes

```bash
# Get current user
GET /users/me
Authorization: Bearer <access_token>

# List users (Admin only)
GET /users
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>

```

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- ✅ NestJS project setup with TypeScript
- ✅ Docker Compose (Postgres + Redis)
- ✅ Prisma schema design
- ✅ Environment configuration
- ✅ Health checks

### Phase 2: Authentication (Week 2-3)

- ✅ User registration with password hashing
- ✅ JWT access + refresh tokens
- ✅ Token rotation & reuse detection
- ✅ Account lockout mechanism
- ✅ Session management

### Phase 3: Authorization (Week 3-4)

- Role-based access control (RBAC)
- Permission system
- Guards & decorators
- Policy-based access

### Phase 4: Multi-Tenancy (Week 4-5)

- Tenant isolation via Prisma middleware
- Request-scoped tenant context
- Cross-tenant prevention tests

### Phase 5: Background Jobs (Week 5-6)

- BullMQ integration
- Email queue processor
- Webhook delivery system
- Job retry & dead letter queue

### Phase 6: File Management (Week 6)

- S3/MinIO integration
- Pre-signed URLs
- File metadata storage

### Phase 7: Observability (Week 7)

- Structured logging
- Request tracing
- Metrics & monitoring
- Error tracking

### Phase 8: Production Hardening (Week 8)

- Rate limiting
- Security headers
- Input validation & sanitization
- CI/CD pipeline
- Load testing

## 🔒 Security Best Practices

- **HTTPS Everywhere:** Always use HTTPS in production
- **Secure Cookies:** HttpOnly, Secure, SameSite flags for refresh tokens
- **Rate Limiting:** Prevent brute force attacks (Redis-backed)
- **Input Validation:** class-validator on all DTOs
- **SQL Injection:** Prevented by Prisma's prepared statements
- **Token Security:** SHA-256 hashing for refresh tokens, bcrypt for passwords
- **Secrets Management:** Never commit .env files, use secret managers
- **Dependency Scanning:** Regular npm audit and updates

## 🚢 Deployment

### Docker Production Build

```bash
# Build image
docker build -t saas-backend:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  saas-backend:latest

```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploy step"

```

### Cloud Deployment Options

- **AWS:** ECS/Fargate + RDS + ElastiCache
- **GCP:** Cloud Run + Cloud SQL + Memorystore
- **DigitalOcean:** App Platform + Managed Database
- **Kubernetes:** Horizontal autoscaling with managed Postgres/Redis

## 📈 Performance Optimization

- **Database Indexing:** Proper indexes on frequently queried fields
- **Connection Pooling:** Prisma connection pool configuration
- **Redis Caching:** Cache frequently accessed data
- **Horizontal Scaling:** Stateless API design for load balancing
- **Queue Workers:** Separate worker processes for background jobs

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- NestJS framework for the solid foundation
- Prisma for the excellent ORM experience
- Community contributors and maintainers