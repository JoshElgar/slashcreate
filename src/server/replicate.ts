import { setTimeout as delay } from "timers/promises";

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
};

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

function getAuthHeaders() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN env var");
  }
  return {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  } as const;
}

export async function createPredictionForModel(
  model: string,
  input: Record<string, unknown>
): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API_BASE}/models/${model}/predictions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ input }),
    // Replicate recommends a 60s timeout default; we'll rely on platform timeout
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate createPrediction failed: ${res.status} ${text}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

export async function getPrediction(id: string): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate getPrediction failed: ${res.status} ${text}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

export async function waitForPrediction(
  id: string,
  opts?: { intervalMs?: number; maxMs?: number }
): Promise<ReplicatePrediction> {
  const intervalMs = opts?.intervalMs ?? 1200;
  const maxMs = opts?.maxMs ?? 60_000;
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const p = await getPrediction(id);
    if (
      p.status === "succeeded" ||
      p.status === "failed" ||
      p.status === "canceled"
    ) {
      return p;
    }
    if (Date.now() - start > maxMs) {
      throw new Error("Timed out waiting for prediction");
    }
    await delay(intervalMs);
  }
}
