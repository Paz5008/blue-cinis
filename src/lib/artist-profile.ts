import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

type ArtistSession = Session & {
  user: { id: string; role?: string | null; name?: string | null; email?: string | null };
};

type EnsureArtistProfileOptions<TSelect> = {
  select?: TSelect;
  createIfMissing?: boolean;
};

const defaultSelect = {
  id: true,
  name: true,
  slug: true,
  userId: true,
  photoUrl: true,
  enableCommerce: true,
  enableLeads: true,
  stripeAccountId: true,
} as const;

async function fetchArtist<TSelect>(
  userId: string,
  select: TSelect | undefined,
): Promise<any> {
  return prisma.artist.findUnique({
    where: { userId },
    select: (select as any) ?? defaultSelect,
  });
}

export async function ensureArtistProfile<TSelect = typeof defaultSelect>(
  session: ArtistSession | null | undefined,
  options?: EnsureArtistProfileOptions<TSelect>,
): Promise<any | null> {
  if (!session?.user?.id) {
    return null;
  }
  const { select, createIfMissing = true } = options || {};
  const userId = session.user.id;

  let artist = await fetchArtist(userId, select);
  if (artist || !createIfMissing) {
    return artist;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const fallbackName =
    session.user.name?.trim() ||
    user?.name?.trim() ||
    (session.user.email?.split("@")[0]?.trim() ||
      user?.email?.split("@")[0]?.trim()) ||
    "Nouvel artiste";

  try {
    await prisma.artist.create({
      data: {
        name: fallbackName,
        user: { connect: { id: userId } },
      },
    });
  } catch (error: any) {
    const code = error?.code;
    if (code !== "P2002" && code !== "P2025") {
      console.error("Failed to auto-create artist profile:", error);
    }
  }

  artist = await fetchArtist(userId, select);
  return artist;
}
