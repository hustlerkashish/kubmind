# KubeMind Workspace Connection & Kubernetes Setup Guide

This guide contains all necessary commands, saved credentials, and quick start scripts for restoring your environment after restarting your computer.

---

## ⚡ Quick Restart Cheat Sheet (Run after PC Restart)

Whenever you restart your PC or Docker Desktop, open **two separate command prompts** and run the following port-forward commands:

### Terminal 1: Prometheus Port-Forward
```cmd
kubectl port-forward svc/prometheus-server 9090:80 -n default
```
> **URL:** `http://localhost:9090`

### Terminal 2: Grafana Port-Forward
```cmd
kubectl port-forward svc/grafana 3001:80 -n default
```
> **URL:** `http://localhost:3001`

---

## 📋 Saved Form Credentials (Workspace Connection Settings)

Use these credentials to fill out your **Workspace Connection & Token Settings** form:

| Setting Field | Saved Value | Notes |
| :--- | :--- | :--- |
| **API Server Host URL** | `https://kubernetes.docker.internal:6443` | Kubernetes API control plane |
| **Service Account Token (Bearer)** | *(See command below to generate)* | 1-year valid bearer token |
| **Prometheus Server URL** | `http://localhost:9090` | Active when Terminal 1 port-forward is running |
| **Grafana Server Host URL** | `http://localhost:3001` | Active when Terminal 2 port-forward is running |
| **Grafana Service API Key** | *(Generated from Grafana UI)* | Starts with `glsa_...` |

---

## 🔑 Key Retrieval Commands

### 1. Generate Kubernetes Bearer Token (Valid for 1 Year)
Run in CMD / PowerShell whenever you need a new token:
```cmd
kubectl create token kubemind-admin --duration=8760h -n default
```

### 2. Retrieve Grafana Admin Password
Run in **PowerShell**:
```powershell
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String((kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}")))
```
> **Saved Admin Credentials:**
> - **Username:** `admin`
> - **Password:** `rcq0DEhVdNIie2dNze3fJJcjuDpvTonEp0tiNRrI`

---

## 🛠️ One-Time Setup Reference (If Cluster is Recreated)

If you ever reset or recreate your Docker Desktop Kubernetes cluster, execute these commands in order:

### 1. Create K8s Admin Service Account
```cmd
kubectl create serviceaccount kubemind-admin -n default
kubectl create clusterrolebinding kubemind-admin-binding --clusterrole=cluster-admin --serviceaccount=default:kubemind-admin
```

### 2. Install Grafana via Helm
```cmd
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install grafana grafana/grafana -n default
```

### 3. Connect Prometheus in Grafana UI
1. Open `http://localhost:3001` (Login: `admin` / `rcq0DEhVdNIie2dNze3fJJcjuDpvTonEp0tiNRrI`)
2. Go to **Connections** → **Data Sources** → **Add data source** → **Prometheus**
3. Set **URL** to: `http://prometheus-server.default.svc.cluster.local:80`
4. Click **Save & test**

### 4. Create Grafana Service Account Token
1. Go to **Administration (Gear Icon)** → **Users & access** → **Service accounts**
2. Click **Add service account** → Name: `KubeMind Integration` → Role: `Admin`
3. Click **Add service account token** → **Generate token**
4. Copy token (`glsa_...`) into your KubeMind connection settings form.
