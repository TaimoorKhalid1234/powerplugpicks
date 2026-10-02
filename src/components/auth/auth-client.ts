"use client";

export async function authRequest<T = Record<string, unknown>>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 429 ? "Too many attempts. Please wait a minute and try again." : (result.message || result.error || "This request could not be completed."));
  return result as T;
}
