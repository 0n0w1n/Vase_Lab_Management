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
  const res = await fetch(`${API_URL}/requests/list`, { cache: "no-store" });
  if (!res.ok) throw new Error(`List requests failed: ${res.status}`);
  return res.json();
}

export async function getRequest(id: string): Promise<LabRequest | undefined> {
  if (!/^\d+$/.test(id)) return undefined;

  const res = await fetch(`${API_URL}/requests/details/${id}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Get request ${id} failed: ${res.status}`);
  return res.json();
}

const ERROR_FIELDS: Record<string, keyof NewRequestInput> = {
  "20": "title",
  "21": "details",
  "22": "priority",
  "23": "deadline",
  "30": "title",
  "31": "details",
  "32": "priority",
  "33": "deadline",
  "34": "deadline",
};

export class RequestValidationError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public field?: keyof NewRequestInput
  ) {
    super(message);
  }
}

export async function createRequest(
  input: NewRequestInput
): Promise<{ id: number }> {
  const res = await fetch(`${API_URL}/requests/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (body?.errorCode !== undefined) {
    const code = String(body.errorCode);
    throw new RequestValidationError(code, body.error, ERROR_FIELDS[code]);
  }
  if (!res.ok) throw new Error(`Create request failed: ${res.status}`);
  return body;
}
