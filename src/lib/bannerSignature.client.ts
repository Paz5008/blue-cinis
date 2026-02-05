"use client";

/**
 * Client-side banner CTA signature using Web Crypto API.
 * This avoids the 317KB crypto-browserify polyfill.
 * 
 * Note: For security, the actual signature verification should happen
 * server-side. This client-side version is only for generating tokens
 * that will be validated on the server.
 */

type BannerCtaPayload = {
    artistId: string;
    ctaHref: string;
    placement?: string | null;
    issuedAt?: number;
};

/**
 * Client-side HMAC-SHA256 signature using Web Crypto API.
 * Returns null if Web Crypto is not available or if no secret is configured.
 */
export const signBannerCtaPayloadClient = async (
    payload: BannerCtaPayload,
    secret: string | null
): Promise<string | null> => {
    if (!secret || typeof window === "undefined" || !window.crypto?.subtle) {
        return null;
    }

    const issuedAt = typeof payload.issuedAt === "number" ? payload.issuedAt : Date.now();
    const message = [
        payload.artistId || "",
        "||",
        payload.ctaHref || "",
        "||",
        payload.placement || "",
        "||",
        String(issuedAt),
    ].join("");

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        return `${issuedAt}:${hashHex}`;
    } catch {
        return null;
    }
};

/**
 * Synchronous fallback that returns null - signature should be pre-computed server-side.
 * This is a placeholder for when async is not possible.
 */
export const signBannerCtaPayloadSync = (
    _payload: BannerCtaPayload,
    _secret: string | null
): string | null => {
    // For synchronous client-side usage, return null.
    // The signature should be pre-computed server-side and passed via context.
    return null;
};
