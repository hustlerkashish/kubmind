from dataclasses import dataclass
from typing import Optional


@dataclass
class AgentState:
    user_prompt: str
    namespace: Optional[str] = None
    pod_name: Optional[str] = None
    container_name: Optional[str] = None
