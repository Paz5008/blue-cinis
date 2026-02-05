"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ContactForm from "@/components/shared/ContactForm";
import { ArtistPosterCanvasProps } from "./canvasTypes";
import { ArtistPosterStructure } from "./ArtistPosterStructure";

export * from "./canvasTypes";

export function ArtistPosterCanvas(props: ArtistPosterCanvasProps) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const useNextLink = props.variant === "standalone";
    const LinkComponent = (useNextLink ? Link : "a") as React.ElementType;

    return (
        <ArtistPosterStructure
            {...props}
            isMobile={isMobile}
            LinkComponent={LinkComponent}
            contactForm={<ContactForm />}
        />
    );
}
