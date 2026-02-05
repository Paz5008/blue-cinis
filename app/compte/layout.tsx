import React from 'react';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BuyerSidebar from "@/components/dashboard-buyer/BuyerSidebar";
import Link from 'next/link';

export default async function BuyerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin?callbackUrl=/compte");
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden h-16 border-b border-gray-100 flex items-center justify-between px-4 bg-white sticky top-0 z-50">
                <Link href="/" className="font-bold tracking-tight">BLUE CINIS</Link>
                {/* Minimal mobile menu trigger - can be expanded later */}
                <Link href="/compte/menu" className="p-2 text-gray-500">
                    Menu
                </Link>
            </div>

            {/* Desktop Sidebar */}
            <BuyerSidebar
                userEmail={session.user?.email}
                userName={session.user?.name}
            />

            {/* Main Content Area */}
            <main className="flex-1 bg-gray-50/30 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
                <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
