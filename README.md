# LearnDev — Production-Ready Online Learning Platform

> A full-stack LMS built to demonstrate production engineering practices: clean architecture, RBAC, Redis caching, Docker, Kubernetes, CI/CD, Prometheus monitoring, and structured logging.

---

## Features

### Authentication
- JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- Silent refresh with request queuing (no logout on tab focus)
- Register / Login / Logout / Forgot Password / Reset Password
- Email verification + resend
- Role-based access control: **Student**, **Instructor**, **Admin**
- Password strength meter, show/hide password

### Core LMS
- Browse, search, and filter courses by category, level, price
- Course detail with structured **Sections → Lessons** hierarchy
- Enroll in courses (free or paid)
- **Lesson player** — supports Video (YouTube embed + direct URL), PDF viewer, Markdown notes, Resource download
- Mark lessons complete / incomplete
- Resume learning from last accessed lesson
- Progress percentage auto-computed from completed lessons
- Course completion detection → auto-issue certificate
- Student dashboard: in-progress courses, completed courses, certificates

### Admin Panel
- Dashboard with enrollment trends (chart), category distribution (pie), system status
- Manage users: search, role change, block/unblock, delete, enrollment history
- Manage courses: CRUD, publish/unpublish, thumbnail preview
- Manage enrollments: filter by status, paginated table, progress bars

### Infrastructure
- **Docker Compose** — single `docker compose up` starts all services
- **Kubernetes** — Namespace, Deployments, Services, ConfigMaps, Secrets, Ingress, HPA (backend + frontend)
- **GitHub Actions** — Install → Lint → Test → Build → Docker build → Push
- **Prometheus** — HTTP duration, request rate, error rate, Redis cache hit ratio
- **Grafana** — Pre-built dashboard auto-provisioned on startup
- **Winston** — Structured JSON logging, Loki/ELK-ready
- **Swagger** — OpenAPI 3.0 at `/api/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Framer Motion |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB 7 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh), bcrypt (rounds=12) |
| Monitoring | Prometheus, Grafana |
| Logging | Winston (JSON, file + console) |
| API Docs | Swagger / OpenAPI 3.0 |
| Container | Docker, Docker Compose, NGINX |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |

---

## Architecture

```
Browser
  │
  ▼
NGINX (port 80)
  ├── /* → React SPA (frontend:80)
  ├── /api/* → Express API (backend:5000)
  └── /health → backend health check

Express API
  ├── Middleware: Helmet, CORS, Rate Limit, JWT, Metrics
  ├── Routes: /auth, /courses, /enrollments, /users, /admin, /certificates
  ├── Controllers → Models (Mongoose)
  ├── Cache: Redis (courses, dashboard, stats)
  └── /metrics → Prometheus scrape

Prometheus → Grafana dashboards
```

---

## Folder Structure

```
online-learning-platform/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Jest + Supertest tests
│   │   ├── config/             # db, redis, logger, metrics, swagger
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # auth, errorHandler, validate
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── utils/              # cache, email, seed
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── admin/              # Admin pages and components
│   │   ├── api/                # Axios instance + adminApi
│   │   ├── components/         # Shared UI components
│   │   ├── context/            # Auth, Theme, Toast
│   │   ├── pages/              # Public and protected pages
│   │   └── App.jsx
│   ├── Dockerfile
│   └── vite.config.js
├── nginx/
│   └── default.conf
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/provisioning/   # Auto-provisioned datasource + dashboard
├── k8s/                        # Kubernetes manifests
├── .github/workflows/          # GitHub Actions CI/CD
└── docker-compose.yml
```

---

## Installation

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or Docker)

### Local Development

```bash
# 1. Clone the repo
git clone <repo-url>
cd online-learning-platform

# 2. Backend
cd backend
cp .env.example .env    # fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev             # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/olp` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Access token secret | — required — |
| `JWT_ACCESS_EXPIRES` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | — required — |
| `JWT_REFRESH_EXPIRES` | Refresh token expiry | `7d` |
| `CLIENT_URL` | Frontend URL (used in emails) | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `SMTP_HOST` | SMTP host (blank = Ethereal dev email) | — |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `LOG_LEVEL` | Winston log level | `info` |
| `SEED_ON_START` | Auto-seed demo data | `true` |

---

## Docker

```bash
# Start all services (app only)
docker compose up --build

# Start with monitoring (Prometheus + Grafana)
docker compose --profile monitoring up --build

# Access points:
# App:        http://localhost
# API docs:   http://localhost/api/docs
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001  (admin/admin)
```

Services started by Docker Compose:
- `mongodb` — MongoDB 7 with health check
- `redis` — Redis 7 Alpine with LRU eviction
- `backend` — Node.js API
- `frontend` — React SPA (Nginx served)
- `nginx` — Reverse proxy on port 80

---

## Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n olp

# Update image tags in k8s/backend.yaml and k8s/frontend.yaml
# before deploying to production
```

Manifests included:
- `namespace.yaml` — `olp` namespace
- `configmap.yaml` — non-secret environment variables
- `secrets.yaml` — JWT secrets, SMTP credentials
- `backend.yaml` — Deployment + Service + HPA (2-6 replicas, CPU+memory)
- `frontend.yaml` — Deployment + Service + HPA (2-4 replicas)
- `mongodb.yaml` — Deployment + PVC (5Gi) + Service
- `redis.yaml` — Deployment + PVC (1Gi) + Service
- `ingress.yaml` — NGINX Ingress at `learndev.local`

---

## API Documentation

Swagger UI available at: `http://localhost:5000/api/docs`

| Endpoint group | Base path |
|---|---|
| Authentication | `/api/auth` |
| Courses | `/api/courses` |
| Sections & Lessons | `/api/courses/:id/sections` |
| Enrollments | `/api/enrollments` |
| Certificates | `/api/certificates` |
| Users | `/api/users` |
| Admin | `/api/admin` |

### Key endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/courses               # public, cached
GET    /api/courses/:slug         # public, cached
POST   /api/courses               # admin/instructor
PATCH  /api/courses/:id/publish   # admin/instructor

GET    /api/enrollments           # student's own
POST   /api/enrollments/:courseId
PATCH  /api/enrollments/:courseId/lessons   # mark lesson complete

GET    /api/certificates          # student's own
GET    /api/certificates/verify/:code       # public verification
```

---

## Monitoring

### Prometheus metrics exposed at `GET /metrics`:

| Metric | Type | Description |
|---|---|---|
| `olp_http_request_duration_seconds` | Histogram | HTTP response time by route |
| `olp_http_requests_total` | Counter | Request count by method/route/status |
| `olp_redis_cache_hits_total` | Counter | Cache hit count |
| `olp_redis_cache_misses_total` | Counter | Cache miss count |
| `olp_active_connections` | Gauge | Live HTTP connections |
| `olp_nodejs_heap_size_used_bytes` | Gauge | Node heap usage |
| `olp_process_cpu_seconds_total` | Counter | CPU time |

Grafana dashboard auto-provisions panels for: request rate, p95 latency, error rate, cache hit ratio, heap usage, CPU, active connections.

---

## Testing

```bash
cd backend
npm test                    # run all tests once
npm run test:coverage       # with coverage report
```

Tests cover:
- Auth: register, login, getMe, forgot-password (26 cases)
- Courses: list, filter, create, get by slug, 404 (9 cases)
- Enrollments: enroll, duplicate, my enrollments, update progress (7 cases)

Tests run automatically in GitHub Actions against in-process MongoDB + Redis service containers.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@olp.dev | admin123 |
| Student | demo@olp.dev | demo123 |

---

## Deployment (Render)

1. Push to `main` branch
2. GitHub Actions builds and pushes Docker images to Docker Hub
3. Render pulls the new image and deploys

Required secrets in GitHub:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

---

## Troubleshooting

**Redis connection error on startup**
The app continues without cache — all reads go directly to MongoDB. This is expected in local dev without Redis. Set `REDIS_URL=redis://localhost:6379` or start Redis with `docker run -p 6379:6379 redis:7-alpine`.

**Email not sending**
In development, email uses Ethereal (fake SMTP). The preview URL is printed to the console log. Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` for real email delivery.

**JWT_REFRESH_SECRET not set**
Falls back to `JWT_SECRET`. Set both to different values in production.

**`docker compose up` fails — MongoDB not ready**
MongoDB has a health check with 5 retries. Wait 30 seconds and retry. First run downloads images which takes extra time.

---

## Future Roadmap (Phase 2+)

- AI Tutor integration
- Real-time chat (WebSockets)
- Gamification (XP, badges, leaderboards)
- Payment gateway (Stripe)
- Course recommendation engine
- Elasticsearch full-text search
- Kafka event streaming
- Multi-tenancy
