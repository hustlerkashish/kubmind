import os

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8001/mcp/call")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080/api/v1")
PORT = int(os.getenv("PORT", "8000"))
