import { NextResponse } from "next/server";
import { FALLBACK_CATEGORIES, getCategories } from "@/lib/data/categories";

export const revalidate = 300;

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (error) {
    console.error('Erreur /api/categories', error);
    return NextResponse.json(FALLBACK_CATEGORIES);
  }
}
