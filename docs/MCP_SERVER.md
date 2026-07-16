# KubeMind Model Context Protocol (MCP) Server Specification

The KubeMind **MCP Server** exposes standardized tools for LLM Copilots and agentic AI systems to query cluster telemetry, Prometheus metrics, incident logs, and PostgreSQL repositories.

---

## 🛠️ Registered MCP Tools (14 Tools)

### 1. Kubernetes Infrastructure Tools
- **`getPods`**: Returns live pods list, restart counts, statuses & host node bindings.
- **`getDeployments`**: Returns workload deployment specs & replica health.
- **`getNodes`**: Returns cluster nodes, role assignments, Kubelet version & hardware capacities.
- **`getEvents`**: Queries cluster warning & normal operation log events feed.
- **`getLogs`**: Extracts container stdout/stderr log stream for target pod.

### 2. Prometheus Observability Tools
- **`getCPU`**: Queries PromQL CPU utilization time-series data.
- **`getMemory`**: Queries PromQL memory allocation time-series data.
- **`getNodeMetrics`**: Queries PromQL node hardware capacity utilization.

### 3. Database & History Tools
- **`searchIncidents`**: Queries persistent incident records from PostgreSQL database.
- **`saveIncident`**: Creates a new cluster failure incident record in PostgreSQL.
- **`saveRecommendation`**: Persists AI Copilot RCA recommendations.
- **`getChatHistory`**: Retrieves past conversational sessions.

### 4. Log Parsing & Filter Tools
- **`summarizeLogs`**: Parses raw container log streams and calculates error counts.
- **`filterErrors`**: Extracts lines matching `CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, `FailedScheduling`, `ERROR`, or `FATAL`.

---

## 📡 REST API Protocols

- **Readiness Check**: `GET http://localhost:8001/mcp/health`
- **Discover Tool Schemas**: `GET http://localhost:8001/mcp/tools`
- **Execute Tool Call**: `POST http://localhost:8001/mcp/call`

### Invocation Curl Example
```bash
curl -X POST http://localhost:8001/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "getLogs",
    "arguments": {
      "namespace": "production",
      "pod_name": "payment-processor-78d9b-x92q",
      "tail_lines": 50
    }
  }'
```
