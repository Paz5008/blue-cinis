// components/GlobalLoadingSpinner.tsx
import React from "react";
import { m } from "framer-motion";

interface GlobalLoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    color?: string;
}

const GlobalLoadingSpinner: React.FC<GlobalLoadingSpinnerProps> = ({
                                                                       size = "md",
                                                                       color = "#4F46E5",
                                                                   }) => {
    const sizeMap = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16",
    };

    const spinnerVariants: any = {
        animate: {
            rotate: 360,
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: [0, 0, 1, 1],
            },
        },
    };

    return (
        <div className="flex justify-center items-center">
            <m.div
                className={`${sizeMap[size]} rounded-full border-4 border-t-transparent`}
                style={{ borderColor: `${color}20`, borderTopColor: color }}
                variants={spinnerVariants}
                animate="animate"
            />
            <span className="sr-only">Chargement...</span>
        </div>
    );
};

export default GlobalLoadingSpinner;