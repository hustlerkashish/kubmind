import logging
import secrets
from typing import Optional

from fastapi import FastAPI, HTTPException, Security, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from agent.state import AgentState
from agent.graph import build_agent_graph
from config import PORT, INTERNAL_API_KEY, ALLOWED_ORIGINS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kubemind.ai")

app = FastAPI(
    title="KubeMind AI Copilot Agent Service",
    description="Gemini-powered Kubernetes analysis using live MCP evidence",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-Internal-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


def verify_internal_auth(
    api_key: Optional[str] = Security(api_key_header),
    bearer: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)
):
    if not INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service internal authentication is not configured."
        )

    provided = api_key or (bearer.credentials if bearer else None)

    if not provided or not secrets.compare_digest(provided, INTERNAL_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: missing or invalid internal API key."
        )

    return True


agent_executor = build_agent_graph()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    namespace: Optional[str] = Field(default=None, max_length=253)
    podName: Optional[str] = Field(default=None, max_length=253)
    containerName: Optional[str] = Field(default=None, max_length=253)


class RcaRequest(BaseModel):
    namespace: Optional[str] = Field(default=None, max_length=253)
    podName: str = Field(min_length=1, max_length=253)


@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "KubeMind AI Agent Service",
        "framework": "FastAPI + Gemini + MCP"
    }


@app.post(
    "/api/v1/copilot/chat",
    dependencies=[Depends(verify_internal_auth)]
)
async def copilot_chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="Message cannot be blank.")

    initial_state = AgentState(
        user_prompt=request.message.strip(),
        namespace=request.namespace,
        pod_name=request.podName,
        container_name=request.containerName
    )

    try:
        result = await agent_executor.ainvoke(initial_state)

        if not isinstance(result, dict):
            raise RuntimeError("Agent returned an unsupported response format.")

        diagnosis = result.get("diagnosis")
        tools = result.get("toolsExecuted")
        reply = result.get("reply")

        if (
            result.get("status") != "SUCCESS"
            or not isinstance(reply, str)
            or not reply.strip()
            or not isinstance(diagnosis, dict)
            or not isinstance(tools, list)
        ):
            raise RuntimeError("Agent returned an incomplete response.")

        required_diagnosis_fields = (
            "reason",
            "confidenceScore",
            "summary",
            "remediationCommand"
        )

        if any(field not in diagnosis for field in required_diagnosis_fields):
            raise RuntimeError("Agent diagnosis is missing required fields.")

        return result

    except Exception as exc:
        logger.exception("Copilot request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI analysis failed. Check the AI service logs and verify Gemini and MCP connectivity."
        ) from exc


@app.post(
    "/api/v1/rca/analyze",
    dependencies=[Depends(verify_internal_auth)]
)
async def analyze_incident(request: RcaRequest):
    prompt = (
        f"Analyze the live Kubernetes evidence for pod {request.podName} "
        f"in namespace {request.namespace or 'all'}. "
        "Identify confirmed symptoms, likely causes, and safe remediation suggestions."
    )

    return await copilot_chat(
        ChatRequest(
            message=prompt,
            namespace=request.namespace,
            podName=request.podName
        )
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT)
