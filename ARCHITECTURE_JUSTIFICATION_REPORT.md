# Architecture and Engineering Justification Report

## 1. Architecture Design
The system is designed around a gateway-first model where Nginx is the single public entry point.

### Components
- Reverse Proxy: Nginx
- Frontend: React + Vite
- Backend: Node.js + Express
- Metadata Store: MongoDB
- Object Store: MinIO
- Orchestration: Docker Compose

### Request Flow
1. Client sends request to `http://localhost`
2. Nginx routes by path:
   - `/` -> frontend
   - `/api/*` -> backend
   - `/storage/*` -> MinIO
3. Backend handles metadata in MongoDB and files in MinIO

This keeps ingress centralized and service boundaries explicit.

## 2. Tool and Technology Choices
### Nginx (Reverse Proxy)
Chosen for predictable routing, low overhead, and straightforward path-based forwarding.

### Express (Backend)
Fast to implement challenge endpoints and integrates cleanly with MongoDB and MinIO SDKs.

### MongoDB (Metadata)
Flexible document model for metadata objects (`title`, `description`, `filePath`).

### MinIO (Object Storage)
S3-compatible storage suitable for local reproducible environments.

### React + Vite (Frontend)
Minimal UI with fast dev iteration to validate upload/list/view/delete behavior.

### Docker Compose
Simple multi-service orchestration for reproducible challenge setup.

## 3. Routing Decisions
Routing is enforced in `proxy/nginx.conf`.

- `/` -> `frontend:5173`
- `/api/` -> `backend:5000/`
- `/storage/` -> `minio:9000/`

Reasoning:
- Satisfies mandatory reverse proxy requirement
- Prevents direct host exposure of internal services
- Keeps client-side API paths stable (`/api/...`) regardless of internal topology

## 4. Service Communication and Isolation
### Intentional Communication Paths
- Frontend -> Backend (through proxy)
- Backend -> MongoDB
- Backend -> MinIO
- Client -> MinIO object access only through proxy `/storage/*`

### Isolation Strategy
- Services share an internal Compose network only
- Host exposure restricted to reverse proxy
- No unnecessary cross-service links

## 5. Reliability Considerations
- Integration tests validate health, metadata, and upload endpoint behavior
- Backend uses explicit route-level error responses
- Proxy-level body size is configured to avoid upload failures for moderate file sizes
- Architecture is reproducible with one command (`docker compose up -d --build`)

## 6. Trade-Offs
### Chosen Simplicity
- Single backend service handles metadata and file API orchestration
- No cache or message queue to avoid unnecessary complexity for challenge scope

### Trade-Off Impact
- Lower operational complexity and resource use
- Less horizontal scalability than split microservices, but adequate for required functionality

## 7. Cost and Resource Optimization
- Minimal container count for required capabilities
- No optional infrastructure (Redis/Kafka/etc.) unless required
- Uses lightweight images where practical and internal networking only
- Avoids duplicate gateways and redundant data services

## 8. Security and Configuration Posture
- Environment variables drive backend service configuration
- `.env.example` provided for reproducible setup without hard-coding secrets in source files
- Public access is constrained through a single reverse proxy boundary

## 9. Reproducibility
Artifacts included for deterministic setup:
- `docker-compose.yml`
- `proxy/nginx.conf`
- `backend/dockerfile`
- `frontend/dockerfile`
- `backend/.env.example`
- Root `README.md` with setup and test instructions

## 10. Future Improvements (Beyond Challenge Scope)
- Healthcheck blocks and restart policies per service
- AuthN/AuthZ for API and object access
- Structured logging and centralized observability
- CI pipeline to run integration tests on each push
