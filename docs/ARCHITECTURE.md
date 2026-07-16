# KubeMind System Architecture & Microservice Design Blueprint

## Architecture System Topology

```
                          ┌──────────────────────────┐
                          │    Browser Client UI     │
                          │   React 19 + Vite + TS   │
                          └────────────┬─────────────┘
                                       │
                                       ▼ REST / JSON
                          ┌──────────────────────────┐
                          │  Spring Boot 3 REST API  │
                          │     (Java 21 Engine)     │
                          └─────┬──────────────┬─────┘
                                │              │
           ┌────────────────────┘              └───────────────────┐
           ▼ JPA / SQL                                             ▼ HTTP / Async
┌─────────────────────┐                                ┌───────────────────────┐
│ PostgreSQL 16 DB    │                                │ Python FastAPI Engine │
│ (User & Audit Core) │                                │  (AI Log Parsing/RCA) │
└─────────────────────┘                                └───────────┬───────────┘
                                                                   │
                                                                   ▼ Protocol Tools
                                                       ┌───────────────────────┐
                                                       │  Model Context (MCP)  │
                                                       │      Node.js Server   │
                                                       └───────────────────────┘
```

## Security Strategy
- Stateless JWT Tokens signed with HMAC-SHA256.
- Strict Role-Based Access Control (`ROLE_ADMIN`, `ROLE_OPERATOR`, `ROLE_VIEWER`).
- Password salting & encryption via BCrypt.
- Unified Error Interceptor returning sanitized `ApiResponse<T>` wrappers.
