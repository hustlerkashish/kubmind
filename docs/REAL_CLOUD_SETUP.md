# KubeMind Cloud & Real Data Integration Guide

This guide provides step-by-step instructions to connect **KubeMind** to your **real cloud Kubernetes cluster** (AWS EKS, GCP GKE, Azure AKS, DigitalOcean, or local Minikube), **live Prometheus metrics server**, **OpenAI LLM keys**, and **production PostgreSQL database**.

---

## 📋 Architecture Flow for Real Data

```
[ Your Cloud Cluster (EKS/GKE/AKS) ] <--- kubeconfig --- [ KubeMind Backend (Java SDK) ]
[ Prometheus Server (Helm) ]         <--- PromQL HTTP --- [ KubeMind Metrics Engine ]
[ OpenAI Platform (GPT-4o) ]         <--- API Key ---- [ KubeMind LangGraph Agent ]
[ Production PostgreSQL ]            <--- JDBC -------- [ KubeMind JPA Repository ]
```

---

## 🛠️ Step 1: Connect Your Real Kubernetes Cluster (kubeconfig)

The KubeMind backend automatically reads the official `kubeconfig` file mounted from your host operating system.

### A. Fetch Your Cloud Cluster Kubeconfig

Execute the appropriate command for your cloud provider in your terminal:

- **AWS EKS**:
  ```bash
  aws eks update-kubeconfig --region us-east-1 --name your-eks-cluster-name
  ```
- **Google Cloud GKE**:
  ```bash
  gcloud container clusters get-credentials your-gke-cluster-name --zone us-central1-a
  ```
- **Azure AKS**:
  ```bash
  az aks get-credentials --resource-group your-rg --name your-aks-cluster-name
  ```
- **DigitalOcean Kubernetes**:
  ```bash
  doctl kubernetes cluster kubeconfig save your-do-cluster-id
  ```
- **Local Minikube**:
  ```bash
  minikube start
  ```

### B. File Location Placement

Ensure your `kubeconfig` file is located at the default operating system path:

- **Windows**: `C:\Users\<YourWindowsUsername>\.kube\config`
- **Linux / macOS**: `~/.kube/config`

*Note:* `docker-compose.yml` automatically mounts this path into the backend container:
```yaml
  backend:
    volumes:
      - ~/.kube/config:/root/.kube/config:ro
```

---

## 📊 Step 2: Deploy & Connect Real Prometheus Metrics

### A. Install Prometheus into Your Kubernetes Cluster via Helm

Run these commands to deploy Prometheus monitoring into your target cluster:

```bash
# 1. Add Prometheus Helm Repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 2. Deploy Prometheus Stack
helm install prometheus prometheus-community/prometheus
```

### B. Set `PROMETHEUS_URL` in `.env`

1. Open your project environment file at:  
   `d:\github\kubmind\.env`

2. Add or update the `PROMETHEUS_URL` variable:
   ```env
   # Option 1: If using port-forwarding to localhost
   PROMETHEUS_URL=http://host.docker.internal:9090

   # Option 2: Direct internal cluster DNS URL
   PROMETHEUS_URL=http://prometheus-server.default.svc.cluster.local:9090
   ```

3. If running local port forwarding to test:
   ```bash
   kubectl port-forward svc/prometheus-server 9090:80
   ```

---

## 🤖 Step 3: Connect Live Generative AI (OpenAI API Key)

To upgrade the **LangGraph AI Agent** from rule-based mode to live generative LLM analysis:

1. Obtain your API Key from **[OpenAI Platform](https://platform.openai.com/api-keys)**.
2. Open `d:\github\kubmind\.env` and add:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
   LLM_MODEL=gpt-4o-mini
   ```
3. *(Optional)* For local offline LLMs using **Ollama** or **LM Studio**:
   ```env
   OPENAI_API_BASE=http://host.docker.internal:11434/v1
   LLM_MODEL=llama3
   ```

---

## 🗄️ Step 4: Production PostgreSQL Database Configuration

KubeMind runs containerized PostgreSQL automatically. If you want to connect to a **Managed Cloud Database** (AWS RDS, GCP Cloud SQL, Azure Database for PostgreSQL):

1. Open `d:\github\kubmind\.env` and specify your cloud database credentials:
   ```env
   POSTGRES_HOST=your-rds-instance.rds.amazonaws.com
   POSTGRES_PORT=5432
   POSTGRES_DB=kubemind
   POSTGRES_USER=kubemind_admin
   POSTGRES_PASSWORD=your_secure_cloud_db_password
   ```

---

## 🚀 Step 5: Launch & Verify Real Data Integration

1. Clean existing local containers (if needed):
   ```bash
   docker rm -f kubemind-db
   ```

2. Start the KubeMind Full Stack with new configuration:
   ```bash
   docker-compose up --build
   ```

3. **Verify Connection Status**:
   - Open **`http://localhost:3000/dashboard`**.
   - Check the **Active Cluster** widget in the left sidebar: It will show your real cluster name, node count, and Kubelet version!
   - Open **`http://localhost:3000/k8s/pods`**: Inspect your actual running cloud pods and containers.
   - Open **`http://localhost:3000/metrics`**: View real-time CPU, RAM, and network traffic from Prometheus.
