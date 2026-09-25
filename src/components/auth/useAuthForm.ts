"use client";

import { useState, type FormEvent } from "react";

interface ApiResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  redirect?: string;
}

async function postJson(url: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error, fieldErrors: data.fieldErrors, redirect: data.redirect };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

// Only ever follow a same-origin path the server handed back.
function safePath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

/**
 * Shared submit logic for the login/signup forms. Navigates with a full page load
 * (not router.push) on success: the new session cookie must be sent with the next
 * request, and the client router cache could otherwise replay a "redirect to login"
 * it stored from a prefetch made while logged out.
 */
export function useAuthForm(endpoint: string, toBody: (form: FormData) => unknown) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);
    setFieldErrors({});

    const result = await postJson(endpoint, toBody(new FormData(event.currentTarget)));
    if (result.ok && result.redirect) {
      // Stay in the pending state through the navigation so the button can't be double-clicked.
      window.location.assign(safePath(result.redirect));
      return;
    }

    setError(result.error ?? "Something went wrong. Please try again.");
    setFieldErrors(result.fieldErrors ?? {});
    setPending(false);
  }

  return { pending, error, fieldErrors, onSubmit };
}
