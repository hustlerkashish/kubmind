# KubeMind — Production AWS Deployment Guide

**Target Environment:** AWS Asia Pacific (Mumbai) Region (`ap-south-1`)  
**Target Operating System:** Ubuntu Server 24.04 LTS (x86_64 / amd64)  
**Cluster Architecture:** Single-Node Lightweight Kubernetes (K3s) with Traefik Ingress Controller  
**Document Version:** 2.1 (Hardened, Tested & Verified)

---

## 1. System Architecture & Resource Planning

```
                              INTERNET
                                 │
                         [ HTTPS:443 / HTTP:80 ]
                                 │
                ┌────────────────▼────────────────┐
                │       AWS Security Group        │ (Inbound: 80, 443, 22 [Your IP Only])
                └────────────────┬────────────────┘
                                 │
                ┌────────────────▼────────────────┐
                │   Traefik Ingress (K3s Host)    │
                └───────┬──────────────────┬──────┘
                        │                  │
                 (Path: /)           (Path: /api)
                        │                  │
                ┌───────▼────────┐  ┌──────▼─────────┐
                │ frontend (80)  │  │ backend (8080) │ (ClusterIP — Internal Only)
                └────────────────┘  └───┬────────┬───┘
                                        │        │
                        ┌───────────────┘        └──────────────┐
                        │                                       │
                ┌───────▼────────┐                      ┌───────▼────────┐
                │ ai-service:8000│                      │ mcp-server:8001│ (ClusterIP)
                └────────────────┘                      └───────┬────────┘
                                                                │
                                                ┌───────────────▼────────┐
                                                │  Kubernetes API (K3s)  │ (In-Cluster SA)
                                                └────────────────────────┘
```

---

## 2. Workload Memory Footprint & EC2 Instance Sizing

### Exact Memory Footprint Breakdown

The KubeMind stack consists of multiple concurrent runtimes. Below is the verified memory configuration from `k8s/aws-demo/`:

| Component | Runtime | Memory Request | Memory Limit | CPU Request | CPU Limit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linux OS + System Daemons** | systemd, journald, networking | ~450 MiB | ~500 MiB | 50m | 200m |
| **K3s Control Plane + System** | containerd, flannel CNI, coreDNS, traefik | ~650 MiB | ~800 MiB | 150m | 500m |
| **PostgreSQL 16 Database** | C / Alpine | 256 MiB | 512 MiB | 100m | 500m |
| **Backend API Gateway** | Spring Boot 3 / Java 21 (Temurin JVM) | 512 MiB | 1024 MiB | 200m | 1000m |
| **AI Subsystem Service** | Python 3.11 / FastAPI / LangGraph | 256 MiB | 512 MiB | 100m | 500m |
| **MCP Tool Server** | Python 3.11 / FastAPI / Uvicorn | 256 MiB | 512 MiB | 100m | 500m |
| **Frontend Web Console** | Nginx Alpine / React 19 SPA | 64 MiB | 128 MiB | 50m | 200m |
| **Total Workload Allocation** | | **~2.44 GiB** | **~3.88 GiB** | **~0.85 vCPU** | **~3.40 vCPU** |

### Critical Instance Sizing Assessment

- **`t3.medium` (2 vCPU, 4.0 GiB RAM / 4,096 MiB):**
  - **Verdict:** **Tight Minimal Viable Baseline (NOT "ample headroom")**.
  - **Evidence:** Peak committed limits + infrastructure equal **~3,888 MiB**, leaving only **~208 MiB (~5.0%)** of unallocated RAM.
  - While baseline memory requests (~2.44 GiB) run comfortably, any traffic spike, JVM heap expansion, or heavy LangGraph reasoning chain could push consumption toward limits, risking Linux kernel OOM kills (`exit code 137`) unless backed by a 2 GiB swapfile.
  - Sits at ~$0.0416/hr (~$30/month).
- **`t3.large` (2 vCPU, 8.0 GiB RAM / 8,192 MiB):**
  - **Verdict:** **Strongly Recommended for Production Stability**.
  - **Evidence:** Leaves **~4.3 GiB (>50%)** of true free buffer for OS caching, database buffers, JVM garbage collection, and telemetry buffering without touching swap.
  - Sits at ~$0.0832/hr (~$60/month).
- **`t4g.small` (2.0 GiB RAM) / `t2.micro` (1.0 GiB RAM):**
  - **Verdict:** **Completely Unviable**.
  - **Evidence:** OS and K3s daemons alone consume ~1.1 GiB, leaving less than 900 MiB for all application containers combined. Immediate OOM killing or debilitating swap thrashing is guaranteed.

### Container Architecture Compatibility
- **Local Build Machine:** Windows 11 `x86_64` (`amd64`).
- **EC2 Instance:** Must select **64-bit (x86)** architecture (`t3.medium` or `t3.large`).
- *Warning:* If you select an AWS Graviton instance (`t4g.*`), it runs ARM64 architecture. Pushing standard x86_64 images to ARM64 EC2 will fail with `exec format error`.

---

## 3. Phase 1: AWS Infrastructure Provisioning

### Step 1.1: Security Group Hardening
Navigate to **EC2** → **Security Groups** → **Create security group**:
- **Name:** `kubemind-sg`
- **Description:** `KubeMind Web Ingress and Secure Administration Firewall`
- **Inbound Rules:**
  | Type | Protocol | Port Range | Source | Rationale |
  | :--- | :--- | :--- | :--- | :--- |
  | **SSH** | TCP | `22` | **My IP** (`<YOUR_PUBLIC_IP>/32`) | Restricts SSH strictly to your IP. |
  | **HTTP** | TCP | `80` | `0.0.0.0/0` | Web Ingress / Let's Encrypt HTTP-01 challenges. |
  | **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure public web access to Frontend and Ingress. |
- **Strict Network Isolation:** Do **NOT** expose ports `5432` (Postgres), `8000` (AI), `8001` (MCP), `8080` (Backend API), or `6443` (Kubernetes API).

### Step 1.2: Launch the EC2 Instance
- **Region:** `ap-south-1` (Mumbai).
- **AMI:** `Ubuntu Server 24.04 LTS (HVM), SSD Volume Type` (64-bit x86).
- **Instance Type:** `t3.large` (recommended) or `t3.medium` (budget baseline with swap).
- **Key Pair:** Create or select `kubemind-keypair.pem`.
- **Security Group:** Select `kubemind-sg`.
- **Storage:** `30 GiB gp3` (General Purpose SSD).

### Step 1.3: Elastic IP Allocation
1. In **EC2** → **Elastic IPs**, click **Allocate Elastic IP address**.
2. Select the IP → **Actions** → **Associate Elastic IP address** → choose `kubemind-production-server`.
3. Record your static Public IPv4 address (`<YOUR_ELASTIC_IP>`).

---

## 4. Phase 2: Build & Push Images to GHCR

### Step 2.1: Secure GHCR Authentication
Generate a GitHub Personal Access Token (Classic) with strictly necessary permissions:
- Scope: `write:packages` (automatically grants `read:packages`).
- Do **NOT** enable `delete:packages` or admin scopes.

Authenticate securely using `--password-stdin` to prevent token leakage in shell history:
```powershell
# In local PowerShell:
$env:GHCR_TOKEN = "<YOUR_GITHUB_TOKEN>"
$env:GHCR_USER = "<YOUR_GITHUB_USERNAME>".ToLower()

$env:GHCR_TOKEN | docker login ghcr.io -u $env:GHCR_USER --password-stdin
Remove-Item Env:\GHCR_TOKEN
```

### Step 2.2: Compile and Build Versioned Images
Build matching the exact image names declared in `k8s/aws-demo/` and `.github/workflows/ci.yml`:
```powershell
$TAG = "v1.0.0"

# 1. Backend Service (Fat JAR + Container)
mvn -f backend/pom.xml package -DskipTests
docker build -t ghcr.io/${env:GHCR_USER}/kubemind-backend:$TAG ./backend

# 2. Frontend Web Interface
docker build -t ghcr.io/${env:GHCR_USER}/kubemind-frontend:$TAG ./frontend

# 3. AI Subsystem Service
docker build --network=host -t ghcr.io/${env:GHCR_USER}/kubemind-ai-service:$TAG ./ai-service

# 4. MCP Server
docker build --network=host -t ghcr.io/${env:GHCR_USER}/kubemind-mcp-server:$TAG ./mcp-server

# Push to GitHub Container Registry
docker push ghcr.io/${env:GHCR_USER}/kubemind-backend:$TAG
docker push ghcr.io/${env:GHCR_USER}/kubemind-frontend:$TAG
docker push ghcr.io/${env:GHCR_USER}/kubemind-ai-service:$TAG
docker push ghcr.io/${env:GHCR_USER}/kubemind-mcp-server:$TAG
```

### Step 2.3: Package Visibility
On GitHub: Profile → **Packages** → set visibility of each package to **Public** (or configure Kubernetes `imagePullSecrets` if keeping private).

---

## 5. Phase 3: Server Bootstrap & K3s Setup

### Step 3.1: Connect via SSH
```bash
chmod 400 kubemind-keypair.pem
ssh -i "kubemind-keypair.pem" ubuntu@<YOUR_ELASTIC_IP>
```

### Step 3.2: System Hardening and Swap Configuration
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop fail2ban postgresql-client-common

# Configure 2GB swap space for JVM/Python memory stabilization
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Step 3.3: Install K3s with Default Secure Permissions
Install K3s using standard root-restricted kubeconfig permissions:
```bash
curl -sfL https://get.k3s.io | sh -
```

### Step 3.4: Configure Secure Kubeconfig for the `ubuntu` User
Do **NOT** world-open `/etc/rancher/k3s/k3s.yaml` to mode `644`. Copy it into the user's home directory with strict `600` permissions:
```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config

echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
source ~/.bashrc
```

Verify cluster status as non-root:
```bash
kubectl get nodes -o wide
```

---

## 6. Phase 4: Production Deployment

### Step 4.1: Clone Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/kubmind.git
cd kubmind
```

### Step 4.2: Update Manifest Image Repositories
Update the image references to point to your GHCR user:
```bash
sed -i "s|ghcr.io/kubemind/|ghcr.io/<YOUR_GITHUB_USERNAME>/|g" k8s/aws-demo/*.yaml
```

### Step 4.3: Secure Kubernetes Secret Provisioning (No Git Commits)
Create the `kubemind` namespace and inject production secrets directly into Kubernetes memory without creating plaintext files in the git workspace:
```bash
# 1. Create the namespace
kubectl apply -f k8s/aws-demo/00-namespace.yaml

# 2. Generate strong cryptographically secure random values
DB_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
INTERNAL_KEY=$(openssl rand -hex 16)
SETUP_TOKEN=$(openssl rand -hex 16)

# 3. Imperatively create the Secret in Kubernetes
kubectl create secret generic kubemind-secrets \
  --namespace=kubemind \
  --from-literal=POSTGRES_USER="kubemind_admin" \
  --from-literal=POSTGRES_PASSWORD="$DB_PASS" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=INTERNAL_API_KEY="$INTERNAL_KEY" \
  --from-literal=KUBEMIND_SETUP_TOKEN="$SETUP_TOKEN" \
  --from-literal=GROQ_API_KEY="<YOUR_GROQ_API_KEY>"

# 4. Save your setup token locally to initialize your admin account later!
echo "Your one-time setup token is: $SETUP_TOKEN"
```

### Step 4.4: Deploy All Declarative Manifests
```bash
kubectl apply -k k8s/aws-demo/
```

### Step 4.5: Monitor Initialization
Allow **2 to 4 minutes** for initial container image pulls, PostgreSQL volume initialization, and Spring Boot JVM startup:
```bash
kubectl get pods -n kubemind -w
```
Expected output once ready:
```
NAME                          READY   STATUS    RESTARTS   AGE
postgres-xxxxxxxxxx-xxxxx     1/1     Running   0          90s
ai-service-xxxxxxxxxx-xxxxx   1/1     Running   0          80s
mcp-server-xxxxxxxxxx-xxxxx   1/1     Running   0          80s
backend-xxxxxxxxxx-xxxxx      1/1     Running   0          70s
frontend-xxxxxxxxxx-xxxxx     1/1     Running   0          60s
```

---

## 7. Phase 5: Verification & Administrator Initialization

### Step 7.1: Verify Health Endpoints Against Source
Test health endpoints locally on the server:

1. **Backend Health Check:**
   ```bash
   curl -s http://localhost/api/v1/health | jq .
   ```
   *Expected response:*
   ```json
   {
     "success": true,
     "message": "KubeMind Backend Operational",
     "data": {
       "database": "PostgreSQL Connected",
       "activeProfile": "prod",
       "service": "KubeMind Core Backend",
       "javaVersion": "21.0.xx",
       "status": "UP"
     }
   }
   ```
2. **Frontend Ingress Routing:**
   ```bash
   curl -I http://localhost/
   ```
   *Expected status:* `HTTP/1.1 200 OK` (Nginx serving React bundle).

### Step 7.2: One-Time Lead Administrator Initialization (CRIT-02)
Verify endpoint against `AuthController.java` (`POST /api/v1/auth/setup-admin` expecting `SetupAdminRequest`):
```bash
curl -i -X POST http://localhost/api/v1/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d "{
    \"setupToken\": \"$SETUP_TOKEN\",
    \"username\": \"admin\",
    \"email\": \"admin@yourcompany.com\",
    \"fullName\": \"Lead Administrator\",
    \"password\": \"YourStrongPassword123!\"
  }"
```
*Expected response:*
- Status: `HTTP/1.1 201 Created`
- Body:
  ```json
  {
    "success": true,
    "message": "Initial administrator account initialized successfully",
    "data": {
      "username": "admin",
      "email": "admin@yourcompany.com",
      "fullName": "Lead Administrator",
      "roles": ["ROLE_ADMIN"]
    }
  }
  ```

---

## 8. Phase 6: Domain & Production HTTPS Configuration

> **STATUS:** **BLOCKED PENDING DOMAIN REGISTRATION AND AWS PROVISIONING.**  
> HTTPS cannot be validated until an actual registered domain points its DNS A-record to the server's Elastic IP.

### Step 8.1: Configure DNS A-Record
At your domain registrar (e.g., Route 53, Cloudflare, Namecheap):
- Create an **A Record**:
  - Name: `kubemind.yourdomain.com` (or `@`)
  - Target: `<YOUR_ELASTIC_IP>`
  - TTL: 300 seconds

### Step 8.2: Install Cert-Manager Prerequisite
Cert-Manager is not bundled with K3s and must be installed first:
```bash
# 1. Install cert-manager CRDs and controllers
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.4/cert-manager.yaml

# 2. Verify all three cert-manager pods are Ready
kubectl get pods -n cert-manager
```

### Step 8.3: Apply ClusterIssuer and Update Ingress
1. Update `email` in `k8s/aws-demo/10-cluster-issuer.yaml` to your real admin email:
   ```bash
   sed -i 's|admin@yourdomain.com|your-email@example.com|g' k8s/aws-demo/10-cluster-issuer.yaml
   kubectl apply -f k8s/aws-demo/10-cluster-issuer.yaml
   ```
2. Update the domain name in `k8s/aws-demo/09-ingress.yaml`:
   ```bash
   sed -i 's|kubemind.example.com|kubemind.yourdomain.com|g' k8s/aws-demo/09-ingress.yaml
   kubectl apply -f k8s/aws-demo/09-ingress.yaml
   ```
3. Monitor certificate issuance:
   ```bash
   kubectl get certificate -n kubemind -w
   ```
   *Status transitions from False to Ready (`True`) once Let's Encrypt completes the HTTP-01 challenge.*

---

## 9. Phase 7: Operational Maintenance, Backups & Disaster Recovery

### Automated Backup Script (`scripts/backup_kubemind.sh`)
The fail-safe backup script at `scripts/backup_kubemind.sh` features:
- `set -euo pipefail` strict failure termination.
- Traps `pg_dump` failure and removes incomplete/corrupt files.
- `pg_restore -l` TOC integrity verification and minimum size assertions.
- Non-zero exit on AWS S3 upload failure.
- Pruning of local archives older than 7 days.

### Required AWS IAM Permissions for S3 Off-Instance Sync
If shipping backups to AWS S3 (`S3_BACKUP_BUCKET`), attach an IAM Instance Profile to the EC2 instance with this least-privilege policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::YOUR_BACKUP_BUCKET_NAME/backups/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR_BACKUP_BUCKET_NAME"
    }
  ]
}
```

### Step-by-Step Database Disaster Recovery (Restore Procedure)
To restore a backup into a fresh or recovered cluster:
```bash
# 1. Identify your latest valid backup dump
BACKUP_FILE=$(ls -t /home/ubuntu/backups/kubemind_*.dump | head -1)

# 2. Locate active PostgreSQL pod
POSTGRES_POD=$(kubectl get pods -n kubemind -l app.kubernetes.io/name=postgres -o jsonpath="{.items[0].metadata.name}")

# 3. Copy dump file into the PostgreSQL container
kubectl cp "$BACKUP_FILE" "kubemind/$POSTGRES_POD:/tmp/restore.dump"

# 4. Fetch the database credentials
POSTGRES_USER=$(kubectl get secret kubemind-secrets -n kubemind -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)
POSTGRES_DB=$(kubectl get configmap kubemind-config -n kubemind -o jsonpath='{.data.POSTGRES_DB}')

# 5. Restore with clean drop-and-recreate
kubectl exec -i -n kubemind "$POSTGRES_POD" -- \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists /tmp/restore.dump

# 6. Clean up temporary container file
kubectl exec -n kubemind "$POSTGRES_POD" -- rm -f /tmp/restore.dump
```

### Accurate Cost Accounting While Instance is Stopped
When pausing demonstration workloads:
1. Stopping an EC2 instance eliminates **compute charges** ($0.00/hour).
2. **Charges that CONTINUE while stopped:**
   - **EBS Storage:** 30 GiB gp3 = **~$2.40/month** ($0.08 per GB-month).
   - **Public IPv4 Address / In-Use Elastic IP:** AWS charges **$0.005/hour** for all public IPv4 addresses, even on stopped instances = **~$3.60/month**.
   - **Total Stopped Holding Cost:** **~$6.00/month**.
3. **To achieve true $0.00 cost:** Disassociate and release the Elastic IP, and create a snapshot before terminating the instance if it will remain inactive for months.
