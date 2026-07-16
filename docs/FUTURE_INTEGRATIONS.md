# KubeMind Future Integration Blueprints

This document guides feature implementation for Phase 2 without restructuring the existing codebase architecture.

## 1. Kubernetes Client Ingestion (`fabric8` / `official-k8s-client`)
- Add `io.kubernetes:client-java` dependency to `backend/pom.xml`.
- Implement K8s Watch listener in `backend/src/main/java/io/kubemind/backend/service/KubernetesWatcherService.java`.
- Stream pod status events directly to the frontend telemetry table.

## 2. Prometheus Telemetry Collector
- Add Spring WebClient or REST Template worker to query Prometheus range API:
  `GET /api/v1/query_range?query=sum(rate(container_cpu_usage_seconds_total[5m]))`
- Serve chart datasets to frontend TanStack Query hooks.

## 3. Grafana Embed
- Integrate Grafana panel iframe proxies in `frontend/src/pages/dashboard/DashboardPage.tsx`.

## 4. MCP Tool Handlers
- Expand `mcp-server/src/index.ts` to expose additional cluster remediation tools (`scale_deployment`, `restart_rollout`).
