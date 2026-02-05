"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface EditableTitleProps {
    artworkId: string;
    initialValue: string;
}

export default function EditableTitle({ artworkId, initialValue }: EditableTitleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    function handleClick() {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    }

    async function handleBlur() {
        setIsEditing(false);
        if (value !== initialValue) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append("title", value);
                const res = await fetch(`/api/artist/artworks/${artworkId}`, {
                    method: "PUT",
                    body: formData,
                    credentials: "include",
                });
                if (!res.ok) {
                    console.error("Erreur lors de la mise à jour du titre");
                }
                router.refresh();
            } catch (error) {
                console.error("Erreur lors de la mise à jour du titre", error);
            } finally {
                setLoading(false);
            }
        }
    }

    return isEditing ? (
        <input
            ref={inputRef}
            className="w-full p-1 border rounded"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
        />
    ) : (
        <h2
            className="text-lg font-semibold mb-1 cursor-pointer"
            onClick={handleClick}
        >
            {value} {loading && <span className="animate-pulse">…</span>}
        </h2>
    );
}