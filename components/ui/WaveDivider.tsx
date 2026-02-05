"use client";
import React from "react";

interface WaveDividerProps {
  /** Flip the wave vertically */
  flip?: boolean;
  /** Optional CSS className for container */
  className?: string;
}

/**
 * A decorative SVG wave divider, using accent color.
 */
export default function WaveDivider({ flip = false, className = '' }: WaveDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 100"
        xmlns="http://www.w3.org/2000/svg"
        className="relative block w-[calc(100%+1px)] h-[100px]"
        preserveAspectRatio="none"
      >
        <path
          d="M0,32 C144,96 432,0 720,32 C1008,64 1296,16 1440,80 L1440,100 L0,100 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}