async def summarize_logs(raw_logs: list[str]):
    error_count = sum(1 for line in raw_logs if "ERROR" in line or "FATAL" in line or "CrashLoopBackOff" in line or "OOMKilled" in line)
    warn_count = sum(1 for line in raw_logs if "WARN" in line)
    
    summary = f"Parsed {len(raw_logs)} log lines. Identified {error_count} critical errors/crashes and {warn_count} warning events."
    if error_count > 0:
        summary += " Critical container failures detected requiring Root Cause Analysis intervention."
        
    return {
        "summary": summary,
        "totalLines": len(raw_logs),
        "errorCount": error_count,
        "warnCount": warn_count
    }

async def filter_errors(raw_logs: list[str]):
    keywords = ["CrashLoopBackOff", "ImagePullBackOff", "OOMKilled", "FailedScheduling", "ERROR", "FATAL", "EXCEPTION", "FAILED"]
    error_lines = [
        line for line in raw_logs 
        if any(kw.lower() in line.lower() for kw in keywords)
    ]
    return {
        "matchedCount": len(error_lines),
        "errors": error_lines if error_lines else ["No severe crash patterns found in target log lines."]
    }
