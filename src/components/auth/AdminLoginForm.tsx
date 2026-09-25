"use client";

import { Field, FormError, PasswordField, SubmitButton } from "./Field";
import { useAuthForm } from "./useAuthForm";

export function AdminLoginForm() {
  const { pending, error, fieldErrors, onSubmit } = useAuthForm("/api/auth/admin-login", (form) => ({
    email: form.get("email"),
    password: form.get("password"),
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        error={fieldErrors.email?.[0]}
      />
      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        required
        error={fieldErrors.password?.[0]}
      />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}
