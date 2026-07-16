# KubeMind AI Agent & LangGraph Architecture Specification

The KubeMind **AI Agent Microservice** (`/ai-service`) leverages **LangGraph** (`StateGraph`) to execute multi-step root cause analysis (RCA) on Kubernetes cluster incidents.

---

## 🔄 LangGraph State Graph Nodes Workflow

1. **Intent Recognition Node (`intent_recognition_node`)**: Parses user natural language query to determine target namespace, pod, and diagnostic intent.
2. **MCP Ingestion Node (`mcp_ingestion_node`)**: Communicates with the MCP Server (`http://mcp-server:8001/mcp/call`) to invoke `getLogs`, `filterErrors`, and `getEvents`.
3. **Diagnostic Analysis Node (`diagnostic_analysis_node`)**: Runs pattern matching over container stderr dumps and warning logs to classify failure modes and compute diagnostic confidence scores.
4. **Synthesis & Output Node (`synthesis_output_node`)**: Formulates markdown analysis reports and executable `kubectl` remediation commands.

---

## ⚡ Recognized Failure Modes & Diagnostic Matrix

| Failure Mode | Identified Log / Stderr Signatures | Default Confidence | Remediation Command |
| :--- | :--- | :--- | :--- |
| **`OOMKilled`** | Exit Code 137, OutOfMemoryError, Kernel RAM limit kill | **98%** | `kubectl set resources deployment -n ns --limits=memory=1024Mi` |
| **`CrashLoopBackOff`** | Probe connection refused, missing environment secrets, exit 1 | **94%** | `kubectl rollout restart deployment -n ns` |
| **`ImagePullBackOff`** | ErrImagePull, Tag Not Found, Registry auth error | **95%** | `kubectl set image deployment *=image:tag -n ns` |
| **`FailedScheduling`** | Insufficient memory/CPU capacity, pending pods | **91%** | `kubectl scale deployment --replicas=2 -n ns` |
| **`ResourceExhaustion`** | CPU throttling, high load latency | **85%** | `kubectl top pod -n ns` |

---

## 📡 REST API Contracts

- **Health Endpoint**: `GET http://localhost:8000/health`
- **Interactive Chat Assistant**: `POST http://localhost:8000/api/v1/copilot/chat`
- **Automated Root Cause Analysis**: `POST http://localhost:8000/api/v1/rca/analyze`
