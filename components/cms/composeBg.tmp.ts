const composeBg = (style: Record<string, any>) => {
    const st: Record<string, any> = { ...(style || {}) };
    const layers: string[] = [];
    if (typeof st.overlayColor === "string" && st.overlayColor) {
        const alpha =
            typeof st.overlayOpacity === "number"
                ? Math.max(0, Math.min(1, st.overlayOpacity))
                : undefined;
        let color = st.overlayColor as string;
        if (alpha !== undefined && /^#/.test(color)) {
            const hex = color.replace("#", "");
            const bigint = Number.parseInt(
                hex.length === 3 ? hex.split("").map((c: string) => c + c).join("") : hex,
                16,
            );
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            color = `rgba(${r},${g},${b},${alpha})`;
        }
        layers.push(`linear-gradient(${color}, ${color})`);
    }
    if (st.gradientFrom && st.gradientTo) {
        const dir = st.gradientDirection || "to bottom";
        const mid = st.gradientMid;
        if (st.gradientType === "radial") {
            const stops = mid
                ? `${st.gradientFrom}, ${mid}, ${st.gradientTo}`
                : `${st.gradientFrom}, ${st.gradientTo}`;
            layers.push(`radial-gradient(circle at center, ${stops})`);
        } else {
            const stops = mid
                ? `${st.gradientFrom}, ${mid}, ${st.gradientTo}`
                : `${st.gradientFrom}, ${st.gradientTo}`;
            layers.push(`linear-gradient(${dir}, ${stops})`);
        }
    }
    if (st.backgroundImageUrl) layers.push(`url(${st.backgroundImageUrl})`);
    if (layers.length > 0) {
        st.backgroundImage = layers.join(", ");
        if (st.blendMode) st.backgroundBlendMode = st.blendMode;
        st.backgroundSize = st.backgroundImageUrl
            ? st.backgroundSize === "custom"
                ? st.backgroundSizeCustom || "auto"
                : st.backgroundSize || "cover"
            : st.backgroundSize || undefined;
        st.backgroundPosition = st.backgroundImageUrl
            ? st.backgroundPosition === "custom"
                ? st.backgroundPositionCustom || "center"
                : st.backgroundPosition || "center"
            : st.backgroundPosition || undefined;
        st.backgroundRepeat = st.backgroundImageUrl
            ? st.backgroundRepeat || "no-repeat"
            : st.backgroundRepeat || undefined;
        if (st.parallax) st.backgroundAttachment = "fixed";
    }
    return st;
};
