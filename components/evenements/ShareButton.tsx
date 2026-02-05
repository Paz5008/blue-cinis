"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
    title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
    const handleShare = () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ title, url: window.location.href });
        } else {
            // Fallback: copy to clipboard
            if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
            }
        }
    };

    return (
        <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/10"
            onClick={handleShare}
        >
            <Share2 className="w-4 h-4" />
            Partager
        </button>
    );
}
