"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton({ className = "", label = "Sign out", pendingLabel = "Signing out…" }: { className?: string; label?: string; pendingLabel?: string }) {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      const target = typeof data.redirect === "string" && data.redirect.startsWith("/") ? data.redirect : "/";
      // Full load, so no client-side cache of protected pages survives the logout.
      window.location.assign(target);
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 ${className}`}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {pending ? pendingLabel : label}
    </button>
  );
}
