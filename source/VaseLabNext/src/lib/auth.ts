import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";

export type UserRole = "admin" | "lab_manager" | "lab_ta" | "lab_member" | "visitor";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** httpOnly cookie holding the Flask JWT, so client JS can never read it. */
export const TOKEN_COOKIE = "token";

/**
 * The logged-in user, or null when there's no token or Flask rejects it
 * (401 = expired / user gone, 422 = malformed token).
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 422) return null;
  if (!res.ok) throw new Error(`Get current user failed: ${res.status}`);
  return res.json();
}

/**
 * fetch() against Flask with the user's token attached. A missing or rejected
 * token sends them to /login — callers inside try/catch must unstable_rethrow.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 || res.status === 422) redirect("/login");
  return res;
}

export class InvalidCredentialsError extends Error {}

/** Exchanges email/password for a Flask access token. */
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  if (res.status === 401) throw new InvalidCredentialsError(body?.error);
  if (!res.ok || typeof body?.access_token !== "string") {
    throw new Error(`Login failed: ${res.status}`);
  }
  return body.access_token;
}

/**
 * Reads the `exp` claim so the cookie dies with the token. The payload is only
 * decoded, not verified — Flask does the verifying on every request.
 */
export function tokenExpiry(token: string): Date | undefined {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    return typeof payload.exp === "number" ? new Date(payload.exp * 1000) : undefined;
  } catch {
    return undefined;
  }
}

