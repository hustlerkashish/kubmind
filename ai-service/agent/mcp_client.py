import httpx
from config import MCP_SERVER_URL, MCP_API_KEY

async def invoke_mcp_tool(tool_name: str, arguments: dict = None):
    """Executes target tool on the KubeMind MCP Protocol Server with API key authentication."""
    if arguments is None:
        arguments = {}
        
    payload = {
        "name": tool_name,
        "arguments": arguments
    }
    
    headers = {}
    if MCP_API_KEY:
        headers["X-Internal-API-Key"] = MCP_API_KEY
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(MCP_SERVER_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data.get("result", {})
    except Exception:
        pass
        
    return {}
