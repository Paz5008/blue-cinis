
import React from 'react';

interface SectionWrapperProps {
    /** Height in px or vh (Desktop only). Mobile is auto. */
    height?: string | number;
    backgroundColor?: string;
    // viewMode: 'desktop' | 'mobile'; // Removed
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
    height = '100vh',
    backgroundColor = 'transparent',
    // viewMode removed
    children,
    className = '',
    style = {},
}) => {
    // const isMobile = viewMode === 'mobile'; // Removed

    // Desktop: Fixed height, Absolute positioning context
    const desktopClasses = `relative overflow-hidden`;
    const desktopStyle: React.CSSProperties = {
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor,
        width: '100%',
        ...style,
    };

    // Mobile logic removed

    return (
        <section
            className={`${desktopClasses} ${className}`}
            style={desktopStyle}
            // Data attribute for debugging
            data-view-mode="desktop"
        >
            {/* 
        On Mobile, we ensure children are stacked. 
        Note: The children (BlockWrappers) should adjust their positioning mode too.
      */}
            {children}
        </section>
    );
};
