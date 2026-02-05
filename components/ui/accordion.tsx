"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    value: string[]
    onValueChange: (value: string) => void
}>({
    value: [],
    onValueChange: () => { },
})

const Accordion = React.forwardRef<
    HTMLDivElement,
    { type: "single" | "multiple"; defaultValue?: string[]; className?: string; children: React.ReactNode }
>(({ type, defaultValue = [], className, children, ...props }, ref) => {
    const [value, setValue] = React.useState<string[]>(defaultValue)

    const handleValueChange = (itemValue: string) => {
        if (type === "multiple") {
            setValue((prev) =>
                prev.includes(itemValue)
                    ? prev.filter((v) => v !== itemValue)
                    : [...prev, itemValue]
            )
        } else {
            // type === "single"
            setValue((prev) => (prev.includes(itemValue) ? [] : [itemValue]))
        }
    }

    return (
        <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("border-b border-white/10", className)}
        data-value={value}
        {...props}
    />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(AccordionContext)
    // Getting the parent item value is a bit tricky without another context, 
    // but for simplicity we can just rely on the user passing a unique key if we wanted strict correctness.
    // However, Shadcn/Radix structure usually implies Item wraps Trigger.
    // We'll rely on a small hack: finding the parent value via context is hard without nesting.
    // Let's change the pattern slightly: Trigger needs to know its Item's value.
    // To keep it drop-in compatible, we'll traverse up or use a context for the Item.

    // Actually, let's just make the ItemProvider.

    return (
        <ItemContextConsumer>
            {(itemValue) => {
                const isOpen = value.includes(itemValue)
                return (
                    <div className="flex">
                        <button
                            ref={ref}
                            onClick={() => onValueChange(itemValue)}
                            className={cn(
                                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-white text-white/60",
                                isOpen && "[&>svg]:rotate-180",
                                className
                            )}
                            data-state={isOpen ? "open" : "closed"}
                            {...props}
                        >
                            {children}
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-white/40" />
                        </button>
                    </div>
                )
            }}
        </ItemContextConsumer>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value } = React.useContext(AccordionContext)
    return (
        <ItemContextConsumer>
            {(itemValue) => {
                const isOpen = value.includes(itemValue)
                if (!isOpen) return null;
                return (
                    <div
                        ref={ref}
                        className="overflow-hidden text-sm animate-accordion-down"
                        {...props}
                    >
                        <div className={cn("pb-4 pt-0 text-white/60", className)}>{children}</div>
                    </div>
                )
            }}
        </ItemContextConsumer>
    )
})
AccordionContent.displayName = "AccordionContent"

// Helper context for Item value
const ItemContext = React.createContext<string>("")
function ItemContextConsumer({ children }: { children: (value: string) => React.ReactNode }) {
    return <ItemContext.Consumer>{children}</ItemContext.Consumer>
}

// Wrap Item to provide context
const AccordionItemWrapped = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
    <ItemContext.Provider value={value}>
        <div
            ref={ref}
            className={cn("border-b border-white/10", className)}
            {...props}
        >
            {children}
        </div>
    </ItemContext.Provider>
))
AccordionItemWrapped.displayName = "AccordionItem"


export { Accordion, AccordionItemWrapped as AccordionItem, AccordionTrigger, AccordionContent }
