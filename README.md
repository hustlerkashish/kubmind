# KubeMind

> **AI-Powered Kubernetes Copilot for Intelligent Root Cause Analysis and Incident Resolution**

KubeMind is an enterprise-grade platform designed to assist DevOps and Reliability engineers in diagnosing Kubernetes cluster incidents, monitoring pod telemetry, analyzing crash logs with AI, and delivering automated root-cause analysis (RCA) recommendations.

---

## 🏗 System Architecture

The project is structured as a modular, containerized multi-service ecosystem:

```
kubemind/
├── frontend/             # React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui
├── backend/              # Java 21 + Spring Boot 3 + Spring Security + JPA + PostgreSQL
├── ai-service/           # FastAPI Microservice (AI Log Parsing & Copilot Engine)
├── mcp-server/           # Model Context Protocol Server (Tool orchestration for LLMs)
├── docker/               # Dockerfiles & docker-compose manifests
├── docs/                 # Architectural blueprints & design specifications
└── .github/              # Automation & CI Workflows
```

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: TailwindCSS, Lucide Icons, Modern Dark UI inspired by Vercel & Datadog
- **State & Data Fetching**: TanStack Query (React Query v5), Axios
- **Routing & Forms**: React Router v6+, React Hook Form, Zod validation

### Backend
- **Runtime & Framework**: Java 21 LTS, Spring Boot 3.3+
- **Security**: Spring Security, Stateless JWT Tokens
- **Database**: PostgreSQL, Spring Data JPA, Schema Migration structure
- **Build Tool**: Apache Maven

### AI & MCP Protocol
- **AI Service Framework**: Python FastAPI microservice baseline
- **MCP Server**: Model Context Protocol integration layer for Agentic AI tools

### Infrastructure & DevOps
- **Containerization**: Multi-stage Docker builds for production deployment
- **Orchestration**: Docker Compose local developer environment

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20
- JDK >= 21
- Docker & Docker Compose
- PostgreSQL 16+ (or run via Docker Compose)

### 1. Local Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Start Infrastructure with Docker Compose
```bash
docker-compose up --build
```
This will launch PostgreSQL, Spring Boot Backend, Vite Frontend, Python AI Service, and Node MCP Server.

---

## 📐 Enterprise Standards & Clean Architecture
- **API Response Standard**: All endpoints wrap data using unified `ApiResponse<T>`.
- **Exception Handling**: Global exception interceptor with `@RestControllerAdvice`.
- **Theme Standard**: Dark Mode native interface designed for operations command centers.
- **Repository Pattern**: Spring Data JPA repositories with strict DTO mappings.

---

## 📜 License
Privately managed enterprise architecture template for KubeMind FYP.
