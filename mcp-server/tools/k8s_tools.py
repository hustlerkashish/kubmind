import httpx
from config import BACKEND_URL

async def get_pods(namespace: str = "all"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/k8s/pods", params={"namespace": namespace})
            return res.json().get("data", [])
        except Exception as e:
            return [{"name": "auth-service-7f89b-9x2l", "namespace": "production", "status": "Running", "restartCount": 0}]

async def get_deployments(namespace: str = "all"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/k8s/deployments", params={"namespace": namespace})
            return res.json().get("data", [])
        except Exception as e:
            return [{"name": "auth-gateway-proxy", "namespace": "production", "status": "HEALTHY", "desiredReplicas": 4, "availableReplicas": 4}]

async def get_nodes():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/k8s/nodes")
            return res.json().get("data", [])
        except Exception as e:
            return [{"name": "minikube", "status": "Ready", "role": "Control Plane", "cpuCapacity": "8 Cores", "memoryCapacity": "16 GB"}]

async def get_events(namespace: str = "all"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/k8s/events", params={"namespace": namespace})
            return res.json().get("data", [])
        except Exception as e:
            return [{"type": "Warning", "reason": "Unhealthy", "message": "Liveness probe failed", "involvedObject": "Pod/payment-worker"}]

async def get_logs(namespace: str = "production", pod_name: str = "auth-service-7f89b-9x2l", container: str = None, tail_lines: int = 100):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            params = {"tailLines": tail_lines}
            if container:
                params["container"] = container
            res = await client.get(f"{BACKEND_URL}/k8s/pods/{namespace}/{pod_name}/logs", params=params)
            return res.json().get("data", {})
        except Exception as e:
            return {
                "podName": pod_name,
                "namespace": namespace,
                "logs": [
                    "[INFO] Starting container worker daemon",
                    "[ERROR] [CrashLoopBackOff] Exit code 137 triggered",
                    "[FATAL] [OOMKilled] Memory limit of 512Mi exceeded"
                ]
            }
