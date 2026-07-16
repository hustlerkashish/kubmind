# KubeMind Prometheus Metrics & Grafana Integration Blueprint

This document outlines the **Prometheus Metrics Engine** architecture and **Grafana Embed** blueprints implemented in KubeMind.

---

## 📊 PromQL Query Definitions

The Spring Boot backend (`PrometheusService.java`) queries the Prometheus HTTP API (`http://prometheus:9090`) using standard PromQL expressions:

| Metric Type | PromQL Query | Unit |
| :--- | :--- | :--- |
| **CPU Usage** | `sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)` | `%` / Cores |
| **Memory Usage** | `sum(container_memory_working_set_bytes) by (pod)` | `GB` |
| **Network Throughput** | `sum(rate(container_network_receive_bytes_total[5m]))` | `MB/s` |
| **Disk Storage I/O** | `sum(container_fs_usage_bytes)` | `GB` |
| **Node Utilization** | `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` | `%` |

---

## 📡 REST API Specifications (`/api/v1/metrics`)

All metrics endpoints accept a `range` parameter (`5m`, `1h`, `6h`, `24h`, `7d`):

- `GET /metrics/cpu?range=1h`
- `GET /metrics/memory?range=1h`
- `GET /metrics/network?range=1h`
- `GET /metrics/disk?range=1h`
- `GET /metrics/pods?range=1h`
- `GET /metrics/nodes?range=1h`
- `GET /metrics/grafana-embed`

---

## 📈 Frontend Auto-Refresh & Grafana Embed Strategy

1. **5-Second Dynamic Polling**: The frontend uses TanStack Query `refetchInterval: 5000` to refresh live PromQL telemetry every 5 seconds.
2. **Grafana Panel Embeds**: Component `<GrafanaEmbedCard />` provides iframe embedding to load live Grafana dashboard panels (`http://grafana:3000/d-solo/...`) with dark-mode parameters.
