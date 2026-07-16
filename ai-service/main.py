from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from agent.state import AgentState
from agent.graph import build_agent_graph
from config import PORT

app = FastAPI(
    title="KubeMind AI Copilot Agent Service",
    description="LangGraph-powered AI Agent for Kubernetes Root Cause Analysis, Stderr Log Ingestion & Remediation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_executor = build_agent_graph()

class ChatRequest(BaseModel):
    message: str
    namespace: Optional[str] = "payment"
    podName: Optional[str] = "payment-processor-78d9b-x92q"
    containerName: Optional[str] = None

class RcaRequest(BaseModel):
    namespace: Optional[str] = "payment"
    podName: str = "payment-processor-78d9b-x92q"

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "KubeMind AI Agent Service",
        "framework": "LangGraph v0.1"
    }

@app.post("/api/v1/copilot/chat")
async def copilot_chat(request: ChatRequest):
    """Executes full LangGraph AI Agent graph for interactive user chat queries."""
    initial_state = AgentState(
        user_prompt=request.message,
        namespace=request.namespace,
        pod_name=request.podName,
        container_name=request.containerName
    )

    try:
        final_state = await agent_executor.ainvoke(initial_state)

        # Handle dict or AgentState object response from LangGraph compiled graph
        if isinstance(final_state, dict):
            reply = final_state.get("final_reply", "RCA pipeline executed.")
            tools = final_state.get("executed_tools", [])
            reason = final_state.get("detected_reason", "OOMKilled")
            confidence = final_state.get("confidence_score", 98)
            summary = final_state.get("ai_summary", "Diagnostic complete.")
            command = final_state.get("remediation_command", "kubectl top pod")
        else:
            reply = final_state.final_reply
            tools = final_state.executed_tools
            reason = final_state.detected_reason
            confidence = final_state.confidence_score
            summary = final_state.ai_summary
            command = final_state.remediation_command

        return {
            "status": "SUCCESS",
            "reply": reply,
            "toolsExecuted": tools,
            "diagnosis": {
                "reason": reason,
                "confidenceScore": confidence,
                "summary": summary,
                "remediationCommand": command
            }
        }
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"AI Agent graph execution error: {str(ex)}")

@app.post("/api/v1/rca/analyze")
async def analyze_incident(request: RcaRequest):
    """Triggers automated RCA analysis for target pod."""
    prompt = f"Analyze incident on pod {request.podName} in namespace {request.namespace}"
    return await copilot_chat(ChatRequest(message=prompt, namespace=request.namespace, podName=request.podName))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
