// components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
    color?: string;
    size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
                                                           color = 'var(--icon-color)', // Valeur par défaut depuis notre système de thème
                                                           size = 40
                                                       }) => {
    return (
        <div className="spinner" style={{ width: size, height: size }}>
            <svg viewBox="0 0 50 50" style={{ color }}>
                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5" stroke="currentColor" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="47.1">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 25 25"
                        to="360 25 25"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
        </div>
    );
};

export default LoadingSpinner;