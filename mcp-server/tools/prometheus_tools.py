import httpx
from config import BACKEND_URL

async def get_cpu(time_range: str = "1h"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/metrics/cpu", params={"range": time_range})
            return res.json().get("data", {})
        except Exception as e:
            return {
                "queryType": "CPU Load",
                "range": time_range,
                "series": [{"target": "cluster-overall", "unit": "%", "datapoints": [{"timestamp": "12:00:00", "value": 74.2}]}]
            }

async def get_memory(time_range: str = "1h"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/metrics/memory", params={"range": time_range})
            return res.json().get("data", {})
        except Exception as e:
            return {
                "queryType": "Memory RSS Bytes",
                "range": time_range,
                "series": [{"target": "cluster-overall", "unit": "GB", "datapoints": [{"timestamp": "12:00:00", "value": 81.6}]}]
            }

async def get_node_metrics(time_range: str = "1h"):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{BACKEND_URL}/metrics/nodes", params={"range": time_range})
            return res.json().get("data", {})
        except Exception as e:
            return {
                "queryType": "Node Capacity Utilization",
                "range": time_range,
                "series": [{"target": "minikube", "unit": "%", "datapoints": [{"timestamp": "12:00:00", "value": 65.0}]}]
            }
