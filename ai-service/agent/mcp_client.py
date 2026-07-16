import httpx
from config import MCP_SERVER_URL

async def invoke_mcp_tool(tool_name: str, arguments: dict = None):
    """Executes target tool on the KubeMind MCP Protocol Server."""
    if arguments is None:
        arguments = {}
        
    payload = {
        "name": tool_name,
        "arguments": arguments
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(MCP_SERVER_URL, json=payload)
            if res.status_code == 200:
                data = res.json()
                return data.get("result", {})
    except Exception as ex:
        pass
        
    return {}
