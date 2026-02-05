"use client";

import clsx from "clsx";
import dynamic from "next/dynamic";

const SearchBar = dynamic(() => import("@/components/ui/SearchBar").then(mod => mod.default), {
  ssr: false,
});

type SearchBarShellProps = {
  wrapperClassName?: string;
};

export default function SearchBarShell({ wrapperClassName }: SearchBarShellProps) {
  return (
    <div className={clsx("nav-search-shell hidden lg:flex", wrapperClassName)}>
      <SearchBar className="nav-search--header" />
    </div>
  );
}

