"use client";

import React from "react";
import { BlockRendererProps } from "./types";
import ContactForm from '@/components/shared/ContactForm';
import { composeBlockStyle } from "@/lib/cms/style";

export const ContactFormRenderer: React.FC<BlockRendererProps> = ({ block, context, style: injectedStyle }) => {
    const baseStyle = composeBlockStyle(block.style || {});
    // Requires artist email or id
    return (
        <div
            className="my-8"
            style={{ ...baseStyle, ...injectedStyle }}
        >
            <ContactForm
                variant={block.variant}
                submitLabel={block.submitLabel}
                showSubject={block.showSubject}
            />
        </div>
    );
};
