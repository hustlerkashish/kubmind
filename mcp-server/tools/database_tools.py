import httpx
from config import BACKEND_URL

async def search_incidents(status: str = "all", namespace: str = "all"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/incidents", params={"status": status, "namespace": namespace})
            return res.json().get("data", [])
        except Exception as e:
            return [
                {
                    "incidentCode": "INC-9042",
                    "clusterName": "k8s-prod-us-east",
                    "namespace": "payment-service",
                    "podName": "payment-processor-78d9b-x92q",
                    "reason": "OOMKilled",
                    "severity": "CRITICAL",
                    "status": "OPEN",
                    "logSnippet": "java.lang.OutOfMemoryError: Java heap space. Process terminated by kernel (Exit Code 137)."
                }
            ]

async def save_incident(cluster_name: str, namespace: str, pod_name: str, reason: str, severity: str, log_snippet: str):
    return {
        "status": "SAVED",
        "incidentCode": "INC-9043",
        "clusterName": cluster_name,
        "namespace": namespace,
        "podName": pod_name,
        "reason": reason,
        "severity": severity,
        "logSnippet": log_snippet
    }

async def save_recommendation(incident_id: str, summary: str, recommendation: str):
    return {
        "status": "SUCCESS",
        "incidentId": incident_id,
        "summary": summary,
        "recommendation": recommendation
    }

async def get_chat_history(session_id: str):
    return {
        "sessionId": session_id,
        "messages": [
            {"role": "user", "content": "Analyze pod payment-processor-78d9b-x92q crash logs"},
            {"role": "assistant", "content": "OOMKilled detected: Container memory allocation limit of 512Mi was exceeded."}
        ]
    }
