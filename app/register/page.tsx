import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import RegistrationHub from "@/components/features/auth/RegistrationHub";
import { SectionTitle, BodyText } from "@/components/typography";
import { getRegisterCopy } from "@/i18n/content/register";

type RegisterPageProps = {
  searchParams?: { type?: string };
};

export async function generateMetadata() {
  return {
    title: "Inscription | Blue Cinis",
  }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }
  const defaultRole = searchParams?.type === "artist" ? "artist" : "client";
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value === "en" ? "en" : "fr";
  const copy = getRegisterCopy(locale);

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {copy.hero.eyebrow}
        </p>
        <SectionTitle as="h1" className="mt-3 text-4xl">
          {copy.hero.title}
        </SectionTitle>
        <BodyText as="p" className="mt-4 text-slate-600">
          {copy.hero.description}
        </BodyText>
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
        <RegistrationHub defaultRole={defaultRole as "client" | "artist"} copy={copy.hub} />
      </div>
    </section>
  );
}
