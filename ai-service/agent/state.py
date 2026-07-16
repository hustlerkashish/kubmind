from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class AgentState(BaseModel):
    user_prompt: str
    namespace: Optional[str] = "all"
    pod_name: Optional[str] = None
    container_name: Optional[str] = None
    executed_tools: List[str] = []
    mcp_telemetry: Dict[str, Any] = {}
    raw_logs: List[str] = []
    filtered_errors: List[str] = []
    detected_reason: Optional[str] = None
    confidence_score: int = 0
    ai_summary: Optional[str] = None
    remediation_command: Optional[str] = None
    final_reply: Optional[str] = None
