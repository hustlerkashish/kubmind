import json
import os
from typing import Any

from google import genai
from google.genai import types

from agent.diagnostic_engine import require_evidence
from agent.mcp_client import MCPClient
from agent.state import AgentState


class KubeMindAgent:
    async def ainvoke(self, state: AgentState | dict[str, Any]):
        if isinstance(state, dict):
            user_prompt = state.get("user_prompt", "")
            namespace = state.get("namespace")
            pod_name = state.get("pod_name")
            container_name = state.get("container_name")
        else:
            user_prompt = state.user_prompt
            namespace = state.namespace
            pod_name = state.pod_name
            container_name = state.container_name

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        model = os.getenv("GEMINI_MODEL") or os.getenv("DEFAULT_MODEL") or "gemini-3-flash-preview"
        mcp = MCPClient()

        # Collect actual cluster evidence. A failed MCP request is an error,
        # never an empty successful result.
        evidence = {
            "namespace": namespace or "all",
            "requested_pod": pod_name,
            "pods": await mcp.call_tool(
                "getPods",
                {"namespace": namespace or "all"}
            ),
            "events": await mcp.call_tool(
                "getEvents",
                {"namespace": namespace or "all"}
            )
        }

        executed_tools = ["getPods", "getEvents"]

        if pod_name:
            log_arguments = {
                "namespace": namespace or "default",
                "pod_name": pod_name,
                "tail_lines": 100
            }
            if container_name:
                log_arguments["container"] = container_name

            evidence["pod_logs"] = await mcp.call_tool(
                "getLogs",
                log_arguments
            )
            executed_tools.append("getLogs")

        evidence = require_evidence(evidence)

        prompt = f"""
You are KubeMind, a Kubernetes incident-analysis assistant.

Analyze the user's request using ONLY the live cluster evidence supplied
below. The evidence comes from successful MCP tool calls.

Rules:
- Never invent pods, events, logs, metrics, incidents, or tool executions.
- Do not assume an incident type without supporting evidence.
- If evidence is insufficient, clearly say what additional information is needed.
- Distinguish observed facts from possible explanations.
- Remediation commands are suggestions only. They are NOT executed.
- Never claim that a remediation was applied.
- Do not claim CPU or memory values unless they appear in the evidence.
- Do not claim a pod is unhealthy unless the evidence supports that.
- Keep the response useful, clear, and technically precise.
- Confidence must be an integer from 0 to 100 and reflect evidence quality.
- If there is no confirmed incident, use "Insufficient evidence" as the reason,
  set confidenceScore to 0, and leave remediationCommand empty.

Return ONLY a valid JSON object with these fields:
{{
  "reply": "Readable response for the user",
  "reason": "Evidence-supported incident reason or Insufficient evidence",
  "confidenceScore": 0,
  "summary": "Short evidence-based summary",
  "remediationCommand": "Safe suggested command, or empty string"
}}

USER REQUEST:
{user_prompt}

LIVE MCP EVIDENCE:
{json.dumps(evidence, default=str)[:40000]}
"""

        client = genai.Client(api_key=api_key)

        import logging
        logger = logging.getLogger(__name__)

        logger.info("Gemini request started. Model: %s", model)

        response = await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
                automatic_function_calling=types.AutomaticFunctionCallingConfig(
                    disable=True
                ),
                http_options=types.HttpOptions(timeout=45000)
            )
        )

        logger.info("Gemini generate_content returned successfully.")

        response_text = (response.text or "").strip()
        logger.info(
            "Gemini response text extracted. Characters: %d",
            len(response_text)
        )
        if not response_text:
            raise RuntimeError("Gemini returned an empty response.")

        try:
            result = json.loads(response_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Gemini returned invalid JSON.") from exc

        required_fields = (
            "reply",
            "reason",
            "confidenceScore",
            "summary",
            "remediationCommand"
        )
        if not isinstance(result, dict) or any(
            field not in result for field in required_fields
        ):
            raise RuntimeError("Gemini response is missing required diagnosis fields.")

        confidence = result["confidenceScore"]
        if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
            raise RuntimeError("Gemini returned an invalid confidence score.")

        result["confidenceScore"] = max(0, min(100, int(confidence)))

        reply = result["reply"]
        if not isinstance(reply, str) or not reply.strip():
            raise RuntimeError("Gemini returned an empty user response.")

        tools_executed = executed_tools

        return {
            "status": "SUCCESS",
            "reply": reply.strip(),
            "toolsExecuted": tools_executed,
            "diagnosis": {
                "reason": str(result["reason"]),
                "confidenceScore": result["confidenceScore"],
                "summary": str(result["summary"]),
                "remediationCommand": str(result["remediationCommand"] or "")
            },
            "model": model
        }


def build_agent_graph():
    return KubeMindAgent()
