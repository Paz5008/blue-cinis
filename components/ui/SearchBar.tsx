"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/i18n/provider";

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputId = useId();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return;
    }
    router.push(`/galerie?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      role="search"
      aria-label={t('nav.search_aria')}
      onSubmit={handleSearch}
      className={clsx("nav-search group", className)}
    >
      <div className="nav-search__icon" aria-hidden="true">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <label htmlFor={inputId} className="sr-only">
        {t('nav.search_aria')}
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        placeholder={t('nav.search_placeholder')}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="nav-search__input"
        aria-label={t('nav.search_aria')}
      />
    </form>
  );
}
