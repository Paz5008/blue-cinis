import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardArtistClientLayout from "./ClientLayout";
import React from "react";
import { prisma } from "@/lib/prisma";
import { ensureArtistProfile } from "@/lib/artist-profile";
import type { Session } from "next-auth";

export default async function DashboardArtistLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || (session.user as any).role !== "artist") {
        redirect("/auth/signin");
    }

    const artist = await ensureArtistProfile(session as Session, { select: { id: true } });

    // Fetch critical data for layout (Sidebar badges)
    // We only count 'new' leads for the badge notification
    let leadCount = 0;
    if (artist) {
        try {
            leadCount = await prisma.lead.count({
                where: {
                    artistId: artist.id,
                    status: 'new'
                }
            });
        } catch (e) {
            // Handle case where Lead table might not exist yet or DB error
            console.error("Failed to fetch lead count", e);
        }
    }

    return <DashboardArtistClientLayout initialLeadCount={leadCount}>{children}</DashboardArtistClientLayout>;
}
