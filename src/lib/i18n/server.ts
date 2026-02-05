import { cookies } from "next/headers";
import fr from "@/i18n/messages/fr.json";
import en from "@/i18n/messages/en.json";

export type AppLocale = "fr" | "en";

export async function resolveLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value;
  return locale === "en" ? "en" : "fr";
}

export function getMessages(locale: AppLocale) {
  return locale === "en" ? (en as Record<string, string>) : (fr as Record<string, string>);
}
