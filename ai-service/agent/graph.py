from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.mcp_client import invoke_mcp_tool
from agent.diagnostic_engine import diagnose_failure_mode

async def intent_recognition_node(state: AgentState) -> dict:
    """Node 1: Analyzes user prompt intent and sets pod/namespace targets."""
    prompt = state.user_prompt
    pod = state.pod_name or "payment-processor-78d9b-x92q"
    ns = state.namespace or "payment"

    return {
        "pod_name": pod,
        "namespace": ns,
        "executed_tools": ["intent_recognition"]
    }

async def mcp_ingestion_node(state: AgentState) -> dict:
    """Node 2: Connects to MCP Server and executes getLogs, filterErrors & getEvents."""
    pod = state.pod_name or "payment-processor-78d9b-x92q"
    ns = state.namespace or "payment"

    tools = list(state.executed_tools)

    # 1. Fetch live pod logs via MCP
    log_data = await invoke_mcp_tool("getLogs", {"namespace": ns, "pod_name": pod, "tail_lines": 50})
    raw_logs = log_data.get("logs", [])
    tools.append("getLogs")

    # 2. Filter error lines via MCP
    filter_data = await invoke_mcp_tool("filterErrors", {"raw_logs": raw_logs})
    filtered_errors = filter_data.get("errors", [])
    tools.append("filterErrors")

    # 3. Get cluster events feed via MCP
    events = await invoke_mcp_tool("getEvents", {"namespace": ns})
    tools.append("getEvents")

    return {
        "raw_logs": raw_logs,
        "filtered_errors": filtered_errors,
        "mcp_telemetry": {"events": events},
        "executed_tools": tools
    }

async def diagnostic_analysis_node(state: AgentState) -> dict:
    """Node 3: Runs rule-based diagnostic engine over ingested logs & events."""
    pod = state.pod_name or "payment-processor-78d9b-x92q"
    ns = state.namespace or "payment"
    events = state.mcp_telemetry.get("events", [])

    reason, confidence, summary, command = diagnose_failure_mode(
        prompt=state.user_prompt,
        pod_name=pod,
        namespace=ns,
        raw_logs=state.raw_logs,
        filtered_errors=state.filtered_errors,
        events=events if isinstance(events, list) else []
    )

    return {
        "detected_reason": reason,
        "confidence_score": confidence,
        "ai_summary": summary,
        "remediation_command": command
    }

async def synthesis_output_node(state: AgentState) -> dict:
    """Node 4: Formulates final structured AI Agent markdown reply."""
    reply = (
        f"### 🤖 KubeMind AI Agent Root Cause Analysis Report\n\n"
        f"**Target Pod:** `{state.pod_name}`  \n"
        f"**Namespace:** `{state.namespace}`  \n"
        f"**Diagnosed Failure Mode:** `{state.detected_reason}` (**{state.confidence_score}% Confidence**)\n\n"
        f"#### 🔍 Executive Diagnostic Synthesis\n"
        f"{state.ai_summary}\n\n"
        f"#### 🛠️ Executed MCP Tooling Stack\n"
        f"The AI Agent invoked the following MCP tools: "
        + ", ".join([f"`{t}`" for t in state.executed_tools]) + "\n\n"
        f"#### ⚡ Recommended Remediation Action\n"
        f"```bash\n{state.remediation_command}\n```"
    )

    return {"final_reply": reply}

def build_agent_graph():
    """Builds and compiles the LangGraph StateGraph pipeline."""
    workflow = StateGraph(AgentState)

    workflow.add_node("intent_recognition", intent_recognition_node)
    workflow.add_node("mcp_ingestion", mcp_ingestion_node)
    workflow.add_node("diagnostic_analysis", diagnostic_analysis_node)
    workflow.add_node("synthesis_output", synthesis_output_node)

    workflow.set_entry_point("intent_recognition")
    workflow.add_edge("intent_recognition", "mcp_ingestion")
    workflow.add_edge("mcp_ingestion", "diagnostic_analysis")
    workflow.add_edge("diagnostic_analysis", "synthesis_output")
    workflow.add_edge("synthesis_output", END)

    return workflow.compile()
