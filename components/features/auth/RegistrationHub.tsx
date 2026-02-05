"use client";

import { useMemo, useState } from "react";
import RegistrationClientForm from "@/components/features/auth/RegistrationClientForm";
import RegistrationForm from "@/components/features/auth/RegistrationForm";
import { SectionTitle, BodyText } from "@/components/typography";
import clsx from "clsx";
import type { RegistrationHubCopy, Role } from "@/i18n/content/register";

type RegistrationHubProps = {
  defaultRole?: Role;
  copy: RegistrationHubCopy;
};

export default function RegistrationHub({ defaultRole = "client", copy }: RegistrationHubProps) {
  const [activeRole, setActiveRole] = useState<Role>(defaultRole);
  const roleCopy = useMemo(() => copy.roles[activeRole], [copy.roles, activeRole]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionTitle as="h2" className="text-2xl">{roleCopy.title}</SectionTitle>
            <BodyText as="p" className="text-slate-600">{roleCopy.intro}</BodyText>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-semibold">
            {(["client", "artist"] as Role[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={clsx(
                  "w-full rounded-full px-4 py-2 transition",
                  activeRole === role ? "bg-white text-slate-900 shadow" : "text-slate-500"
                )}
              >
                {copy.switchLabels[role]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6">
          {activeRole === "client" ? (
            <RegistrationClientForm />
          ) : (
            <RegistrationForm />
          )}
        </div>
      </div>
      <aside className="rounded-3xl border border-slate-200 bg-slate-50/90 p-6 shadow-inner">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {copy.documentsLabel}
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {roleCopy.requirements.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-900">{copy.deadlineTitle}</p>
          <p className="mt-1">{roleCopy.sla}</p>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{copy.support.title}</p>
          <p className="mt-1">
            {copy.support.bodyPrefix}{" "}
            <a href={`mailto:${copy.support.email}`} className="text-accent underline">
              {copy.support.emailLabel}
            </a>{" "}
            {copy.support.bodySuffix}
          </p>
        </div>
      </aside>
    </div>
  );
}
