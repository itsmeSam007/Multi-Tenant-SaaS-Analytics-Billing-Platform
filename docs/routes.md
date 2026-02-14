# API Routes Reference

Base URL: /api  
Environment: Dev / Staging / Production

---

## 🔐 Authentication

| Method | Endpoint | Auth | Description |
|------|---------|------|-------------|
| POST | /auth/register | ❌ | Register a new user |
| POST | /auth/login | ❌ | Login with email & password |
| POST | /auth/refresh | ❌ | Refresh access token |
| POST | /auth/logout | ✅ | Invalidate refresh token |

### Notes
- Passwords are hashed using **bcrypt**
- No JWT tokens returned yet (Phase 2 – Step 3)
- Refresh token will be **HTTP-only cookie**

### Notes
- Access token is **JWT**
- Short-lived (15 minutes)
- Signed with `JWT_SECRET`
- Refresh token added in next step

---

## 👤 Users

| Method | Endpoint | Auth | Roles | Description |
|------|---------|------|------|-------------|
| GET | /users/me | ✅ | user, admin | Get current user profile |
| GET | /users/:id | ✅ | admin | Get user by ID |
| PATCH | /users/:id | ✅ | admin | Update user |
| DELETE | /users/:id | ✅ | admin | Soft delete user |

---

## 🛡️ Roles & Permissions

| Method | Endpoint | Auth | Roles | Description |
|------|---------|------|------|-------------|
| GET | /roles | ✅ | admin | List roles |
| POST | /roles | ✅ | admin | Create role |
| PATCH | /roles/:id | ✅ | admin | Update role |
| DELETE | /roles/:id | ✅ | admin | Delete role |

---

## 🧵 Background Jobs

| Method | Endpoint | Auth | Description |
|------|---------|------|-------------|
| POST | /jobs/email | ✅ | Enqueue email job |

> ⚠️ Most job processors run via workers and do not expose HTTP routes.

---

## ❤️ Health & Monitoring

| Method | Endpoint | Auth | Description |
|------|---------|------|-------------|
| GET | /health | ❌ | Service health check |
| GET | /health/db | ❌ | Database connectivity check |
| GET | /health/redis | ❌ | Redis connectivity check |

---

## 📘 Notes

- `Auth` means **JWT access token required**
- Refresh token is sent via **HTTP-only cookie**
- Admin routes are protected using:
  ```ts
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)


  🧪 Environments
Environment	Base URL
Local	http://localhost:3000/api

Staging	https://staging.example.com/api

Production	https://api.example.com