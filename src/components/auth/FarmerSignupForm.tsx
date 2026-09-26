"use client";

import { useT } from "@/components/farmer/I18nProvider";
import { Field, FormError, PasswordField, SubmitButton } from "./Field";
import { useAuthForm } from "./useAuthForm";

const BREEDS = ["Broiler", "Layer", "Desi/Local"];

export function FarmerSignupForm() {
  const t = useT();
  const { pending, error, fieldErrors, onSubmit } = useAuthForm("/api/auth/farmer-signup", (form) => ({
    name: form.get("name"),
    phone: form.get("phone"),
    password: form.get("password"),
    location: form.get("location"),
    breed: form.get("breed"),
    flockSize: form.get("flockSize"),
    numberOfSheds: form.get("numberOfSheds"),
    flockAgeWeeks: form.get("flockAgeWeeks"),
  }));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormError message={error} />

      <Field name="name" label={t("auth.name")} autoComplete="name" required error={fieldErrors.name?.[0]} />
      <Field
        name="phone"
        label={t("auth.phone")}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0300 1234567"
        dir="ltr"
        hint={t("auth.phoneHint")}
        required
        error={fieldErrors.phone?.[0]}
      />
      <PasswordField
        name="password"
        label={t("auth.password")}
        autoComplete="new-password"
        dir="ltr"
        hint={t("auth.passwordHint")}
        required
        error={fieldErrors.password?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="location" label={t("auth.location")} placeholder={t("auth.locationPh")} required error={fieldErrors.location?.[0]} />
        <div>
          <Field name="breed" label={t("auth.breed")} list="signup-breeds" required error={fieldErrors.breed?.[0]} />
          <datalist id="signup-breeds">
            {BREEDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          name="flockSize"
          label={t("auth.birds")}
          type="number"
          inputMode="numeric"
          min={1}
          required
          error={fieldErrors.flockSize?.[0]}
        />
        <Field
          name="numberOfSheds"
          label={t("auth.sheds")}
          type="number"
          inputMode="numeric"
          min={1}
          required
          error={fieldErrors.numberOfSheds?.[0]}
        />
        <Field
          name="flockAgeWeeks"
          label={t("auth.flockAge")}
          type="number"
          inputMode="numeric"
          min={0}
          required
          error={fieldErrors.flockAgeWeeks?.[0]}
        />
      </div>

      <SubmitButton pending={pending}>{t("auth.createBtn")}</SubmitButton>
    </form>
  );
}
