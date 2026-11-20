import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080/api/v1")
PORT = int(os.getenv("PORT", "8001"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", os.getenv("MCP_API_KEY", ""))
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
