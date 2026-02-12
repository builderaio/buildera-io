import { useState, useEffect, useCallback, useRef } from "react";

type JobStatus = "pending" | "in_queue" | "running" | "done" | "failed";

interface CreatifyJobState {
  status: JobStatus;
  progress: number;
  output: any;
  error: string | null;
  isLoading: boolean;
}

export const useCreatifyJob = (
  jobId: string | null,
  checkFn: (id: string) => Promise<any>,
  intervalMs = 5000,
  timeoutMs = 600000 // 10 min
) => {
  const [state, setState] = useState<CreatifyJobState>({
    status: "pending",
    progress: 0,
    output: null,
    error: null,
    isLoading: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!jobId) return;

    // Timeout check
    if (Date.now() - startRef.current > timeoutMs) {
      stop();
      setState((s) => ({ ...s, status: "failed", error: "Timeout exceeded", isLoading: false }));
      return;
    }

    try {
      const data = await checkFn(jobId);
      const status: JobStatus = data.status || "pending";

      const progressMap: Record<JobStatus, number> = {
        pending: 10,
        in_queue: 25,
        running: 60,
        done: 100,
        failed: 0,
      };

      setState({
        status,
        progress: progressMap[status] ?? 50,
        output: status === "done" ? data : null,
        error: status === "failed" ? data.error || "Generation failed" : null,
        isLoading: status !== "done" && status !== "failed",
      });

      if (status === "done" || status === "failed") {
        stop();
      }
    } catch (err: any) {
      console.error("Polling error:", err);
      // Don't stop on transient errors, just log
    }
  }, [jobId, checkFn, stop, timeoutMs]);

  useEffect(() => {
    if (!jobId) return;

    setState({ status: "pending", progress: 5, output: null, error: null, isLoading: true });
    startRef.current = Date.now();

    // Initial check
    poll();

    // Start polling
    timerRef.current = setInterval(poll, intervalMs);

    return () => stop();
  }, [jobId, poll, intervalMs, stop]);

  return { ...state, stop };
};
