from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from tools.k8s_tools import get_pods, get_deployments, get_nodes, get_events, get_logs
from tools.prometheus_tools import get_cpu, get_memory, get_node_metrics
from tools.database_tools import search_incidents, save_incident, save_recommendation, get_chat_history
from tools.logs_tools import summarize_logs, filter_errors
from config import PORT

app = FastAPI(
    title="KubeMind MCP (Model Context Protocol) Server",
    description="Enterprise Model Context Protocol Gateway exposing 14 Kubernetes, Prometheus, Database & Log Tools",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCPCallRequest(BaseModel):
    name: str
    arguments: Optional[Dict[str, Any]] = {}

TOOLS_REGISTRY = {
    # Kubernetes Tools
    "getPods": {
        "name": "getPods",
        "description": "Query live Kubernetes pods list, status, restart counters and node bindings.",
        "inputSchema": {
            "type": "object",
            "properties": {"namespace": {"type": "string", "default": "all"}},
        },
        "handler": get_pods
    },
    "getDeployments": {
        "name": "getDeployments",
        "description": "Query live Kubernetes deployment specs, replica counts, and image tags.",
        "inputSchema": {
            "type": "object",
            "properties": {"namespace": {"type": "string", "default": "all"}},
        },
        "handler": get_deployments
    },
    "getNodes": {
        "name": "getNodes",
        "description": "Query active Kubernetes nodes, roles, Kubelet version, CPU & RAM capacity.",
        "inputSchema": {"type": "object", "properties": {}},
        "handler": get_nodes
    },
    "getEvents": {
        "name": "getEvents",
        "description": "Query cluster warning and normal operation log events feed.",
        "inputSchema": {
            "type": "object",
            "properties": {"namespace": {"type": "string", "default": "all"}},
        },
        "handler": get_events
    },
    "getLogs": {
        "name": "getLogs",
        "description": "Fetch container stdout/stderr log lines for target pod.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "namespace": {"type": "string", "default": "production"},
                "pod_name": {"type": "string"},
                "container": {"type": "string"},
                "tail_lines": {"type": "integer", "default": 100}
            },
            "required": ["pod_name"]
        },
        "handler": get_logs
    },

    # Prometheus Metrics Tools
    "getCPU": {
        "name": "getCPU",
        "description": "Query PromQL CPU utilization time-series data.",
        "inputSchema": {
            "type": "object",
            "properties": {"time_range": {"type": "string", "default": "1h"}},
        },
        "handler": get_cpu
    },
    "getMemory": {
        "name": "getMemory",
        "description": "Query PromQL Memory allocation time-series data.",
        "inputSchema": {
            "type": "object",
            "properties": {"time_range": {"type": "string", "default": "1h"}},
        },
        "handler": get_memory
    },
    "getNodeMetrics": {
        "name": "getNodeMetrics",
        "description": "Query PromQL node hardware capacity utilization metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {"time_range": {"type": "string", "default": "1h"}},
        },
        "handler": get_node_metrics
    },

    # Database & History Tools
    "searchIncidents": {
        "name": "searchIncidents",
        "description": "Search stored incidents in PostgreSQL database by status or namespace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "default": "all"},
                "namespace": {"type": "string", "default": "all"}
            },
        },
        "handler": search_incidents
    },
    "saveIncident": {
        "name": "saveIncident",
        "description": "Save a newly detected Kubernetes cluster incident to PostgreSQL database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cluster_name": {"type": "string"},
                "namespace": {"type": "string"},
                "pod_name": {"type": "string"},
                "reason": {"type": "string"},
                "severity": {"type": "string"},
                "log_snippet": {"type": "string"}
            },
            "required": ["cluster_name", "namespace", "pod_name", "reason", "severity"]
        },
        "handler": save_incident
    },
    "saveRecommendation": {
        "name": "saveRecommendation",
        "description": "Save AI Copilot Root Cause Analysis recommendation for an incident.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id": {"type": "string"},
                "summary": {"type": "string"},
                "recommendation": {"type": "string"}
            },
            "required": ["incident_id", "summary", "recommendation"]
        },
        "handler": save_recommendation
    },
    "getChatHistory": {
        "name": "getChatHistory",
        "description": "Fetch historical AI Copilot chat messages for target session ID.",
        "inputSchema": {
            "type": "object",
            "properties": {"session_id": {"type": "string"}},
            "required": ["session_id"]
        },
        "handler": get_chat_history
    },

    # Log Tools
    "summarizeLogs": {
        "name": "summarizeLogs",
        "description": "Parse and summarize raw container stderr log lines.",
        "inputSchema": {
            "type": "object",
            "properties": {"raw_logs": {"type": "array", "items": {"type": "string"}}},
            "required": ["raw_logs"]
        },
        "handler": summarize_logs
    },
    "filterErrors": {
        "name": "filterErrors",
        "description": "Filter log lines matching CrashLoopBackOff, OOMKilled, ImagePullBackOff, FailedScheduling, ERROR, or FATAL.",
        "inputSchema": {
            "type": "object",
            "properties": {"raw_logs": {"type": "array", "items": {"type": "string"}}},
            "required": ["raw_logs"]
        },
        "handler": filter_errors
    }
}

@app.get("/mcp/health")
def health_check():
    return {
        "status": "UP",
        "service": "KubeMind MCP Server",
        "registeredTools": len(TOOLS_REGISTRY)
    }

@app.get("/mcp/tools")
def list_tools():
    """Returns JSON schema of all 14 tools registered with MCP Protocol Server."""
    tools_list = []
    for tool_name, meta in TOOLS_REGISTRY.items():
        tools_list.append({
            "name": meta["name"],
            "description": meta["description"],
            "inputSchema": meta["inputSchema"]
        })
    return {"tools": tools_list}

@app.post("/mcp/call")
async def call_tool(request: MCPCallRequest):
    """Executes target MCP tool dynamically based on tool name and arguments."""
    tool = TOOLS_REGISTRY.get(request.name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{request.name}' is not registered in MCP Server.")

    handler = tool["handler"]
    args = request.arguments or {}

    try:
        result = await handler(**args)
        return {
            "status": "SUCCESS",
            "tool": request.name,
            "result": result
        }
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error executing MCP tool '{request.name}': {str(ex)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
