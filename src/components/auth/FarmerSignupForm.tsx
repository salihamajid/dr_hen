"use client";

import { Field, FormError, PasswordField, SubmitButton } from "./Field";
import { useAuthForm } from "./useAuthForm";

const BREEDS = ["Broiler", "Layer", "Desi/Local"];

export function FarmerSignupForm() {
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

      <Field name="name" label="Your name" autoComplete="name" required error={fieldErrors.name?.[0]} />
      <Field
        name="phone"
        label="Phone number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0300 1234567"
        hint="This is also your WhatsApp number and your login."
        required
        error={fieldErrors.phone?.[0]}
      />
      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters."
        required
        error={fieldErrors.password?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="location" label="Location" placeholder="City or village" required error={fieldErrors.location?.[0]} />
        <div>
          <Field name="breed" label="Breed" list="signup-breeds" required error={fieldErrors.breed?.[0]} />
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
          label="Birds"
          type="number"
          inputMode="numeric"
          min={1}
          required
          error={fieldErrors.flockSize?.[0]}
        />
        <Field
          name="numberOfSheds"
          label="Sheds"
          type="number"
          inputMode="numeric"
          min={1}
          required
          error={fieldErrors.numberOfSheds?.[0]}
        />
        <Field
          name="flockAgeWeeks"
          label="Flock age (weeks)"
          type="number"
          inputMode="numeric"
          min={0}
          required
          error={fieldErrors.flockAgeWeeks?.[0]}
        />
      </div>

      <SubmitButton pending={pending}>Create account →</SubmitButton>
    </form>
  );
}
