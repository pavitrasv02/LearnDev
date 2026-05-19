# LearnDev — Online Learning Platform

A **production-grade full-stack DevOps application** with a premium React frontend, Node.js REST API, MongoDB, Redis caching, Docker orchestration, Kubernetes deployment, CI/CD pipelines, and Prometheus/Grafana monitoring.

![Stack](https://img.shields.io/badge/React-Vite%20%7C%20Tailwind-61DAFB)
![Node](https://img.shields.io/badge/Express-MongoDB-339933)
![DevOps](https://img.shields.io/badge/Docker-K8s-Jenkins-2496ED)

---

## Architecture

```
Client Browser
      ↓
nginx Reverse Proxy (API Gateway + Load Balancer)
      ↓
┌─────────────┬─────────────┐
│  Frontend   │   Backend   │
│  (React)    │  (Express)  │
└─────────────┴──────┬──────┘
                     ↓
            MongoDB + Redis
                     ↓
         Jenkins / GitHub Actions CI/CD
                     ↓
         Docker Compose / Kubernetes
```

---

## Features

### Frontend
- Glassmorphism & gradient UI inspired by Coursera/Stripe
- Dark/light mode toggle
- Framer Motion animations
- Course catalog with search & filters
- User dashboard, profile, auth pages
- Toast notifications & skeleton loaders
- Fully responsive (mobile-first)

### Backend
- JWT authentication & RBAC (Admin/User)
- Course CRUD APIs with validation
- Redis caching, session storage, distributed locking
- Rate limiting, Helmet security, Winston logging
- MongoDB with Mongoose ODM + seed data

### DevOps
- Multi-container Docker Compose (frontend, backend, MongoDB, Redis, nginx)
- Multi-stage Dockerfiles
- Jenkins declarative pipeline (6 stages)
- GitHub Actions CI/CD
- Kubernetes (Deployments, Services, Ingress, HPA, ConfigMaps, Secrets)
- Prometheus + Grafana monitoring stack

---

## Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
git clone https://github.com/YOUR_USERNAME/online-learning-platform.git
cd online-learning-platform

# Start full stack
docker compose up --build
```

Open **http://localhost** in your browser.

### Demo Accounts
| Role  | Email           | Password  |
|-------|-----------------|-----------|
| User  | demo@olp.dev    | demo123   |
| Admin | admin@olp.dev   | admin123  |

### Monitoring (optional profile)
```bash
docker compose --profile monitoring up -d
```
- Grafana: http://localhost:3001 (admin / admin)
- Prometheus: http://localhost:9090

---

## Local Development

### Backend
```bash
cd backend
cp .env.example .env
npm install
# Start MongoDB & Redis locally, then:
npm run dev
# Seed database: npm run seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/courses` | List courses (search, filter) |
| GET | `/api/courses/:slug` | Course detail |
| GET | `/api/courses/stats` | Platform statistics |
| POST | `/api/enrollments/:courseId` | Enroll in course |
| GET | `/api/enrollments` | My enrollments |
| PUT | `/api/users/profile` | Update profile |

---

## Kubernetes Deployment

```bash
# Update image names in k8s/*.yaml, then:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## Jenkins CI/CD

1. Install Jenkins with Docker Pipeline & Git plugins
2. Create Pipeline job → SCM → `jenkins/Jenkinsfile`
3. Add GitHub credentials ID: `github-credentials`
4. Configure webhook: `http://<jenkins>:8080/github-webhook/`

**Pipeline stages:** Clone → Install → Build Images → Deploy → Health Check → Verify

---

## Project Structure

```
online-learning-platform/
├── frontend/          # React + Vite + Tailwind + Framer Motion
├── backend/           # Express + MongoDB + Redis + JWT
├── nginx/             # Reverse proxy config
├── k8s/               # Kubernetes manifests
├── jenkins/           # Jenkinsfile
├── monitoring/        # Prometheus & Grafana
├── .github/workflows/ # GitHub Actions
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Framer Motion, Axios, React Router |
| Backend | Node.js, Express, JWT, bcrypt, express-validator, Winston |
| Database | MongoDB, Mongoose |
| Cache | Redis (ioredis) |
| DevOps | Docker, Docker Compose, nginx, Kubernetes, Jenkins, GitHub Actions |
| Monitoring | Prometheus, Grafana |

---

## License

MIT — free for educational and portfolio use.
