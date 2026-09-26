"use client";

import { useT } from "@/components/farmer/I18nProvider";
import { Field, FormError, PasswordField, SubmitButton } from "./Field";
import { useAuthForm } from "./useAuthForm";

export function FarmerLoginForm() {
  const t = useT();
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
        label={t("auth.phone")}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0300 1234567"
        dir="ltr"
        required
        error={fieldErrors.phone?.[0]}
      />
      <PasswordField
        name="password"
        label={t("auth.password")}
        autoComplete="current-password"
        dir="ltr"
        required
        error={fieldErrors.password?.[0]}
      />

      <div className="flex items-center justify-between gap-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-black/60">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded accent-brand-green-dark" />
          {t("auth.keep")}
        </label>
        {/* No reset flow exists yet, so this says so instead of being a dead link. */}
        <span className="text-end text-black/45">{t("auth.forgot")}</span>
      </div>

      <SubmitButton pending={pending}>{t("auth.loginBtn")}</SubmitButton>
    </form>
  );
}
