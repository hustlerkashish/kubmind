# End-to-End Guide: Deploying a Sample Web App & Monitoring Live Traffic with KubeMind

This guide explains how to deploy a **Sample Web Application** into your Kubernetes cluster, simulate **real web traffic & container crash alerts**, and monitor everything live in **KubeMind**.

---

## 🏗️ End-to-End System Architecture

```
                                [ Public Internet Users / Traffic Generator ]
                                                   │
                                                   ▼
                                 [ Kubernetes Ingress / Service ]
                                                   │
                                     ┌─────────────┴─────────────┐
                                     ▼                           ▼
                        [ Target Web App Pod 1 ]    [ Target Web App Pod 2 ]
                                     │                           │
                                     └─────────────┬─────────────┘
                                                   │ (Metrics & Stderr Logs)
                                                   ▼
                                   [ KubeMind AI Copilot Platform ]
```

---

## 🚀 Step 1: Deploy a Target Web Application into Kubernetes

Create a sample deployment manifest file `sample-webapp.yaml` to run a real web application with scaling and resource limits:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-webapp
  namespace: default
  labels:
    app: sample-webapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-webapp
  template:
    metadata:
      labels:
        app: sample-webapp
    spec:
      containers:
      - name: web-server
        image: nginxdemos/hello:plain-text
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: sample-webapp-service
  namespace: default
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
  selector:
    app: sample-webapp
```

### Apply to Your Kubernetes Cluster:
```bash
kubectl apply -f sample-webapp.yaml
```

---

## 🌐 Step 2: Access Your Live Website

1. If using **Minikube**:
   ```bash
   minikube service sample-webapp-service --url
   ```
   *Output: `http://192.168.49.2:30080`*

2. Open `http://localhost:30080` (or the Minikube URL) in your browser. You will see your target web application running live across 3 pods!

---

## ⚡ Step 3: Simulate Real Visitor Web Traffic

To generate real incoming traffic requests to your web application, run a lightweight load traffic script in your terminal:

### Option A: Using `curl` loop in Bash/Command Prompt
```bash
# Sends continuous HTTP GET requests to your web app
while true; do curl -s http://localhost:30080 > /dev/null; echo "Visitor hit sample-webapp"; sleep 0.2; done
```

### Option B: Using `k6` or `ApacheBench` (High Traffic Load Test)
```bash
# Simulates 50 concurrent web visitors hitting your app
ab -n 10000 -c 50 http://localhost:30080/
```

---

## 💥 Step 4: Simulate a Live Pod Crash (OOMKilled / Memory Spike)

To see KubeMind detect a live incident, run a stress container that exceeds memory limits:

```bash
# Deploy a stress container that allocates 500MB RAM (triggering memory limit termination)
kubectl run stress-pod --image=polinux/stress --restart=Never -- stress --vm 1 --vm-bytes 500M --vm-hang 1
```

---

## 🔍 Step 5: Inspect Everything Live in KubeMind

1. Open **[http://localhost:3000/k8s/pods](http://localhost:3000/k8s/pods)**:
   - You will see `sample-webapp` running 3 live pods and `stress-pod` entering `OOMKilled` or `Error` state.
2. Open **[http://localhost:3000/logs](http://localhost:3000/logs)**:
   - Select namespace `default` and pod `sample-webapp-xxx`. View live visitor HTTP access log streams!
3. Open **[http://localhost:3000/copilot](http://localhost:3000/copilot)**:
   - Click **Diagnose OOMKilled Memory Alert**. KubeMind's LangGraph agent will parse the crash logs and suggest the exact `kubectl set resources` fix!
