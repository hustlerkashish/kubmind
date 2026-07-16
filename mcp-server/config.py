import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080/api/v1")
PORT = int(os.getenv("PORT", "8001"))
