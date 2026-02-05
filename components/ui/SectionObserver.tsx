"use client";

import { useEffect, useRef, ReactNode } from "react";
import { useInView } from "framer-motion";
import { useStore } from "@/lib/store";

interface SectionObserverProps {
    title: string;
    children: ReactNode;
}

export default function SectionObserver({ title, children }: SectionObserverProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });
    const setActiveSectionTitle = useStore((state) => state.setActiveSectionTitle);

    useEffect(() => {
        if (isInView) {
            setActiveSectionTitle(title);
        } else {
            // Only clear if this specific section was the one active, 
            // effectively handling the exit. However, simplistic clearing might flicker 
            // if margins don't overlap perfectly. 
            // A safer bet is just setting it when in view. 
            // The store logic might need to handle overlapping, but let's stick to the prompt:
            // "When isInView is false -> call setActiveSectionTitle(null)"
            // We'll add a check to avoid clearing someone else's title.
            // Actually, pure prompt implementation:
            // "Quand isInView est false -> appelle setActiveSectionTitle(null)"
            // We should conditionally clear it only if WE set it. But `useStore` doesn't give us the current title easily without subscription.
            // Let's rely on the next section setting it. But if we scroll to top/bottom void, clearing is good.
        }
    }, [isInView, title, setActiveSectionTitle]);

    // Handling exit specifically to avoid race conditions is tricky without checking state.
    // Modifying useEffect to check store current state might be an infinite loop if not careful.
    // Let's implement the simpler clear-on-exit first, and refine if flickering occurs.

    useEffect(() => {
        if (!isInView) {
            // We can't easily check if *we* are the active one without subscribing.
            // Check if we can just set null.
            setActiveSectionTitle(null);
        }
    }, [isInView, setActiveSectionTitle]);


    return (
        <div ref={ref} className="w-full">
            {children}
        </div>
    );
}
