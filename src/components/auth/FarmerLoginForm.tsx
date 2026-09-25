"use client";

import { Field, FormError, PasswordField, SubmitButton } from "./Field";
import { useAuthForm } from "./useAuthForm";

export function FarmerLoginForm() {
  const { pending, error, fieldErrors, onSubmit } = useAuthForm("/api/auth/farmer-login", (form) => ({
    phone: form.get("phone"),
    password: form.get("password"),
    remember: form.get("remember") === "on",
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <Field
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0300 1234567"
        required
        error={fieldErrors.phone?.[0]}
      />
      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        required
        error={fieldErrors.password?.[0]}
      />

      <div className="flex items-center justify-between gap-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-black/60">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded accent-brand-green-dark" />
          Keep me logged in
        </label>
        {/* No reset flow exists yet, so this says so instead of being a dead link. */}
        <span className="text-right text-black/45">Forgot password? Contact your Dr. Hen representative.</span>
      </div>

      <SubmitButton pending={pending}>Login as Farmer →</SubmitButton>
    </form>
  );
}
