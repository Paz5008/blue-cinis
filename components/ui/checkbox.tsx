"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-white/20 ring-offset-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-white text-black" : "bg-transparent text-transparent",
            className
        )}
        {...props}
    >
        <Check className="h-3 w-3" strokeWidth={3} />
    </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
