"""
KubeMind no longer uses hard-coded incident rules as an AI diagnosis.

Incident interpretation is performed by Gemini using evidence retrieved
from the live Kubernetes MCP tools. This module intentionally contains
no fabricated diagnosis or default confidence score.
"""


def require_evidence(evidence: dict) -> dict:
    if not evidence:
        raise ValueError("No live Kubernetes evidence was collected.")
    return evidence
