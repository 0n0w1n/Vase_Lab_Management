import type {
  LabRequest,
  NewRequestInput,
  RequestSummary,
} from "@/types/request";

/**
 * Only reachable from the server flask-app is the compose service name
 * no-store so the list isn't prerendered at build time when Flask is down
 */
const API_URL = process.env.API_URL ?? "http://flask-app:8000";

export async function getRequests(): Promise<RequestSummary[]> {
  const res = await fetch(`${API_URL}/requests/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`List requests failed: ${res.status}`);
  return res.json();
}

export async function getRequest(id: string): Promise<LabRequest | undefined> {
  if (!/^\d+$/.test(id)) return undefined;

  const res = await fetch(`${API_URL}/requests/${id}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Get request ${id} failed: ${res.status}`);
  return res.json();
}

/** Flask rejected the input, errors is keyed like NewRequestInput */
export class RequestValidationError extends Error {
  constructor(
    public errors: Partial<Record<keyof NewRequestInput, string>>
  ) {
    super("Request validation failed");
  }
}

/**
 * POST /requests/ Flask attaches the request to a placeholder user until
 * login exists current_user in requestviews.py
 */
export async function createRequest(
  input: NewRequestInput
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 400) throw new RequestValidationError((await res.json()).errors);
  if (!res.ok) throw new Error(`Create request failed: ${res.status}`);
  return res.json();
}
