import os
import httpx


class MCPClient:
    def __init__(self):
        self.base_url = os.getenv(
            "MCP_SERVER_URL",
            "http://mcp-server.kubemind.svc.cluster.local:8001"
        ).rstrip("/")
        self.api_key = os.getenv("INTERNAL_API_KEY", "")

        if not self.api_key:
            raise RuntimeError("INTERNAL_API_KEY is not configured for the AI service.")

    async def call_tool(self, name: str, arguments: dict | None = None):
        headers = {"X-Internal-API-Key": self.api_key}
        payload = {"name": name, "arguments": arguments or {}}

        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                f"{self.base_url}/mcp/call",
                json=payload,
                headers=headers
            )
            response.raise_for_status()
            result = response.json()

        if result.get("status") != "SUCCESS":
            raise RuntimeError(f"MCP tool {name} did not return SUCCESS.")

        return result.get("result")
