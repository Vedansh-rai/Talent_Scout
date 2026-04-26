import type { ScoutRequest, ScoutResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function scoutCandidates(req: ScoutRequest): Promise<ScoutResponse> {
  const res = await fetch(`${API_BASE}/scout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }

  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
