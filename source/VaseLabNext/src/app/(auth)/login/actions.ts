"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InvalidCredentialsError, login, TOKEN_COOKIE, tokenExpiry } from "@/lib/auth";

export type LoginState = {
  /** Echoed back so the email field keeps what the user typed after a failed submit. */
  email: string;
  error?: string;
};

export async function submitLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { email, error: "Please enter your email and password." };
  }

  let token: string;
  try {
    token = await login(email, password);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return { email, error: "Incorrect email or password." };
    }
    return { email, error: "Couldn't sign in. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: tokenExpiry(token),
  });

  // Outside the try — redirect() works by throwing.
  redirect("/request");
}

/** The JWT is stateless, so logging out only means dropping the cookie. */
export async function logout(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/login");
}
