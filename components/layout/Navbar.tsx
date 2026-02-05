"use client";

import NavbarClient from "./Navbar.client";
import type { CategorySummary } from "@/lib/data/categories";
import type { Session } from "next-auth";

type NavbarProps = {
  categories: CategorySummary[];
  initialSession?: Session | null;
};

export default function Navbar({ categories, initialSession }: NavbarProps) {
  return <NavbarClient categories={categories} initialSession={initialSession} />;
}
