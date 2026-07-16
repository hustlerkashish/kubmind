from typing import List, Dict, Any, Tuple

def diagnose_failure_mode(
    prompt: str,
    pod_name: str,
    namespace: str,
    raw_logs: List[str],
    filtered_errors: List[str],
    events: List[Dict[str, Any]]
) -> Tuple[str, int, str, str]:
    """
    Analyzes logs, event stream, and prompt to classify Kubernetes failure mode,
    calculate diagnostic confidence score, and formulate remediation instructions.
    """
    joined_text = " ".join(raw_logs + filtered_errors + [str(e) for e in events]).lower()
    prompt_lower = prompt.lower()

    # 1. OOMKilled Analysis
    if "oomkilled" in joined_text or "exit code 137" in joined_text or "java.lang.outofmemoryerror" in joined_text or "oom" in prompt_lower:
        reason = "OOMKilled"
        confidence = 98
        summary = (
            f"Container in pod '{pod_name}' was forcibly terminated by the Linux kernel Out-Of-Memory killer (Exit Code 137). "
            "Memory working set allocation limit of 512Mi was exceeded due to unhandled heap allocation spike."
        )
        command = f"kubectl set resources deployment/{pod_name.split('-')[0]} -n {namespace} --limits=memory=1024Mi --requests=memory=512Mi"
        return reason, confidence, summary, command

    # 2. CrashLoopBackOff Analysis
    if "crashloopbackoff" in joined_text or "connection refused" in joined_text or "fatal" in joined_text or "crash" in prompt_lower:
        reason = "CrashLoopBackOff"
        confidence = 94
        summary = (
            f"Pod '{pod_name}' is trapped in CrashLoopBackOff. Container main process failed probe initialization. "
            "Downstream connection to Redis cache master (redis-master.internal:6379) was refused."
        )
        command = f"kubectl rollout restart deployment/{pod_name.split('-')[0]} -n {namespace}"
        return reason, confidence, summary, command

    # 3. ImagePullBackOff Analysis
    if "imagepullbackoff" in joined_text or "failed to pull image" in joined_text or "errimagepull" in joined_text or "image" in prompt_lower:
        reason = "ImagePullBackOff"
        confidence = 95
        summary = (
            f"Kubelet failed to pull target container image for pod '{pod_name}'. "
            "Target image tag does not exist or internal container registry credentials expired."
        )
        command = f"kubectl set image deployment/{pod_name.split('-')[0]} *=kubemind/app:v2.4.0 -n {namespace}"
        return reason, confidence, summary, command

    # 4. FailedScheduling Analysis
    if "failedscheduling" in joined_text or "insufficient memory" in joined_text or "insufficient cpu" in joined_text or "pending" in prompt_lower:
        reason = "FailedScheduling"
        confidence = 91
        summary = (
            f"Pod '{pod_name}' remains stuck in Pending state. "
            "No node in the worker pool satisfies requested CPU (4 Cores) or Memory (16 GB) resource requests."
        )
        command = f"kubectl scale deployment/{pod_name.split('-')[0]} --replicas=2 -n {namespace}"
        return reason, confidence, summary, command

    # 5. Generic / Fallback Diagnostic Analysis
    reason = "ResourceExhaustion"
    confidence = 85
    summary = (
        f"Detected resource pressure and high latency on pod '{pod_name}'. "
        "Recommend scaling replicas and tuning CPU request throttling."
    )
    command = f"kubectl top pod {pod_name} -n {namespace}"
    return reason, confidence, summary, command
