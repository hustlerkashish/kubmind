# KubeMind Kubernetes Engine API Documentation

The KubeMind backend communicates with target Kubernetes clusters using the **Official Kubernetes Java SDK** (`io.kubernetes:client-java`).

---

## 🔌 Connection Setup & Cluster Auto-Discovery

The Spring Boot backend automatically discovers active clusters in the following sequence:

1. **Local `kubeconfig` File**: Checks environment variable `$KUBECONFIG` or default local file path `~/.kube/config` (works out of the box for **Minikube**, **Docker Desktop K8s**, **MicroK8s**, and **Kind**).
2. **In-Cluster Service Account**: If deployed inside a Kubernetes pod, uses the automatically mounted `/var/run/secrets/kubernetes.io/serviceaccount/token`.
3. **Standby Fallback Telemetry**: If no live cluster is connected, the engine gracefully serves pre-indexed fallback telemetry so developers can test without requiring a running cluster.

### Mounting Local Kubeconfig in Docker Compose
To allow the containerized `backend` service to read your host's local Minikube cluster:
```yaml
  backend:
    volumes:
      - ~/.kube/config:/root/.kube/config:ro
```

---

## 📡 REST API Specifications (`/api/v1/k8s`)

| Endpoint | Method | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/k8s/clusters` | `GET` | None | Returns cluster health status, version, and context |
| `/k8s/pods` | `GET` | `namespace` (optional) | Lists pods, restart counts, statuses, IPs & node bindings |
| `/k8s/deployments` | `GET` | `namespace` (optional) | Lists deployment workloads, replica health & container images |
| `/k8s/services` | `GET` | `namespace` (optional) | Lists cluster services, types, ClusterIPs & port mappings |
| `/k8s/nodes` | `GET` | None | Lists cluster nodes, roles, ready status, CPU & RAM capacity |
| `/k8s/namespaces` | `GET` | None | Lists active namespaces |
| `/k8s/events` | `GET` | `namespace` (optional) | Returns real-time cluster warning & normal operation log events |
