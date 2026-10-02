"use client";

import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) { super(message); }
}
export async function adminApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options?.headers } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(result.error || "This action could not be completed. Please try again.", response.status, result.details);
  return result as T;
}
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolvedPath, setResolvedPath] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await adminApi<T>(path)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load this page."); } finally { setResolvedPath(path); setLoading(false); }
  }, [path]);
  useEffect(() => {
    const controller = new AbortController();
    adminApi<T>(path, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) { setData(result); setError(""); } }).catch(e => { if (!controller.signal.aborted) { setData(null); setError(e instanceof Error ? e.message : "Unable to load this page."); } }).finally(() => { if (!controller.signal.aborted) { setResolvedPath(path); setLoading(false); } });
    return () => controller.abort();
  }, [path]);
  return { data, setData, error, loading: loading || resolvedPath !== path, refresh };
}
export function friendly(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/^./, char => char.toUpperCase()); }
export function dateLabel(value: string | null | undefined) { return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Your changes have been preserved."; }
