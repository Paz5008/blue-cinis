import { z } from "zod";

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function requiredString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export const ArtistRegistrationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
      message: "Le mot de passe doit contenir au moins une lettre et un chiffre",
    }),
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  artStyle: z.string().min(1, "Le style artistique est requis"),
  message: z.string().min(1, "Le message est requis"),
  recaptchaToken: z.string().min(1, "Le reCAPTCHA est requis"),
});

export type ArtistRegistrationInput = z.infer<typeof ArtistRegistrationSchema>;

export function parseArtistRegistrationFormData(formData: FormData) {
  const raw = {
    name: requiredString(formData.get("name")),
    email: requiredString(formData.get("email")),
    password: requiredString(formData.get("password")),
    phone: optionalString(formData.get("phone")),
    portfolio: optionalString(formData.get("portfolio")),
    artStyle: requiredString(formData.get("artStyle")),
    message: requiredString(formData.get("message")),
    recaptchaToken: requiredString(formData.get("recaptchaToken")),
  };
  return ArtistRegistrationSchema.safeParse(raw);
}
