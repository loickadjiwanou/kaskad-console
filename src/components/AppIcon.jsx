import { palette } from "@/theme";

const GRADIENTS = [
    [palette.primary.DEFAULT, palette.accent.DEFAULT],
    [palette.tertiary.DEFAULT, palette.primary.light],
    [palette.accent.dark, palette.primary.dark],
    [palette.primary.darker, palette.tertiary.light],
    [palette.accent.DEFAULT, palette.tertiary.DEFAULT],
];

function hash(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/** Icône d'app : image publiée ou icône générée (mêmes couleurs que l'app client). */
export default function AppIcon({ app, size = 40 }) {
    const radius = size * 0.24;
    if (app?.icon_url) {
        return <img src={app.icon_url} alt="" width={size} height={size} style={{ borderRadius: radius, objectFit: "cover", flexShrink: 0 }} />;
    }
    const [a, b] = GRADIENTS[hash(app?.id ?? app?.name) % GRADIENTS.length];
    const initials = (app?.name ?? "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                background: `linear-gradient(135deg, ${a}, ${b})`,
                color: "#fff",
                fontWeight: 800,
                fontSize: size * 0.36,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                letterSpacing: -0.5,
            }}
        >
            {initials}
        </div>
    );
}
