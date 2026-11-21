import httpx
from config import BACKEND_URL, INTERNAL_API_KEY


async def _get_backend_data(path: str, params: dict | None = None, expected_type=None):
    if not INTERNAL_API_KEY:
        raise RuntimeError("INTERNAL_API_KEY is not configured in MCP server")

    url = f"{BACKEND_URL.rstrip('/')}{path}"
    headers = {"X-Internal-API-Key": INTERNAL_API_KEY}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params, headers=headers)
        if response.is_error:
            raise RuntimeError(
                f"Backend request {path} failed with HTTP {response.status_code}"
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise RuntimeError(f"Backend returned invalid JSON for {path}") from exc

    if not isinstance(payload, dict) or "data" not in payload:
        raise RuntimeError(f"Backend response for {path} has no data field")

    if payload.get("success") is False:
        raise RuntimeError(f"Backend reported failure for {path}")

    data = payload["data"]

    if expected_type is not None and not isinstance(data, expected_type):
        raise RuntimeError(f"Backend returned an invalid data type for {path}")

    return data


async def get_pods(namespace: str = "all"):
    return await _get_backend_data(
        "/k8s/pods", {"namespace": namespace}, list
    )


async def get_deployments(namespace: str = "all"):
    return await _get_backend_data(
        "/k8s/deployments", {"namespace": namespace}, list
    )


async def get_nodes():
    return await _get_backend_data("/k8s/nodes", expected_type=list)


async def get_events(namespace: str = "all"):
    return await _get_backend_data(
        "/k8s/events", {"namespace": namespace}, list
    )


async def get_logs(
    pod_name: str,
    namespace: str = "default",
    container: str = None,
    tail_lines: int = 100
):
    params = {"tailLines": tail_lines}
    if container:
        params["container"] = container

    return await _get_backend_data(
        f"/k8s/pods/{namespace}/{pod_name}/logs",
        params,
        dict
    )
