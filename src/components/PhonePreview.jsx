import { Empty } from "antd";
import { palette } from "@/theme";
import { useI18n } from "@/i18n";
import { formatBytes, formatDate, formatLabel, formatNumber, platformOf } from "@/lib/format";
import AppIcon from "./AppIcon";
import MdiIcon from "./MdiIcon";

// Couleurs du thème clair de l'app client
const c = {
    bg: palette.light.background,
    surface: palette.light.surface,
    border: palette.light.border,
    text: palette.light.textPrimary,
    muted: palette.light.textSecondary,
    primary: palette.primary.DEFAULT,
    soft: "#E8F0FF",
};

const s = {
    frame: {
        width: 360,
        height: 740,
        borderRadius: 46,
        padding: 12,
        background: "#0B1020",
        boxShadow: "0 30px 60px -20px rgba(15,23,42,.45), inset 0 0 0 2px #1f2937",
        flexShrink: 0,
    },
    screen: { width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: c.bg, position: "relative", fontFamily: "Inter, system-ui" },
    island: { position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 96, height: 26, borderRadius: 20, background: "#000", zIndex: 2 },
    scroll: { height: "100%", overflowY: "auto", padding: "46px 16px 24px", color: c.text, scrollbarWidth: "none" },
    card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 14 },
    chip: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, border: `1px solid ${c.border}`, fontSize: 12, fontWeight: 600 },
    h2: { fontSize: 17, fontWeight: 800, margin: "20px 0 10px", letterSpacing: -0.3 },
};

/**
 * Fiche d'application telle qu'affichée dans l'app client (données de GET /admin/apps/{id}/preview),
 * dans un cadre de téléphone. Seules les versions publiées et validées apparaissent, comme pour les utilisateurs.
 */
export default function PhonePreview({ app }) {
    const { t } = useI18n();
    if (!app) return null;
    const latest = app.versions?.[0];
    const groups = Object.values(
        (app.versions ?? []).reduce((acc, v) => {
            (acc[v.version_code] ??= { ...v, files: [] }).files.push(v);
            return acc;
        }, {}),
    ).sort((a, b) => b.version_code - a.version_code);

    return (
        <div style={s.frame}>
            <div style={s.screen}>
                <div style={s.island} />
                <div style={s.scroll}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <AppIcon app={app} size={72} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{app.name}</div>
                            <div style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{app.short_description}</div>
                            <div style={{ color: palette.neutral[400], fontSize: 11, marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                                {app.platforms?.map((p) => <MdiIcon key={p} name={platformOf(p)?.icon} size={0.55} />)}
                                <span>· {formatNumber(app.downloads_count)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...s.card, marginTop: 16 }}>
                        {latest ? (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: c.muted, marginBottom: 10 }}>
                                    <span style={{ ...s.chip, borderColor: c.primary, color: c.primary, padding: "2px 8px", background: c.soft }}>
                                        {platformOf(latest.platform)?.label} · {formatLabel(latest.file_format)}
                                    </span>
                                    <span>
                                        v{latest.version_name} · {formatBytes(latest.file_size)}
                                    </span>
                                </div>
                                <div style={{ background: c.primary, color: "#fff", borderRadius: 999, padding: "10px 0", textAlign: "center", fontWeight: 700, fontSize: 14 }}>
                                    {t("preview.download", { format: formatLabel(latest.file_format) })}
                                </div>
                            </>
                        ) : (
                            <div style={{ color: c.muted, fontSize: 12 }}>{t("preview.noVersion")}</div>
                        )}
                    </div>

                    {!!app.categories?.length && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                            {app.categories.map((cat) => (
                                <span key={cat.id} style={s.chip}>
                                    <MdiIcon name={cat.icon} size={0.55} /> {cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {!!app.screenshots?.length && (
                        <>
                            <div style={s.h2}>{t("preview.screenshots")}</div>
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none" }}>
                                {app.screenshots.map((url) => (
                                    <img key={url} src={url} alt="" style={{ width: 120, height: 214, objectFit: "cover", borderRadius: 14, background: c.surface, flexShrink: 0 }} />
                                ))}
                            </div>
                        </>
                    )}

                    <div style={s.h2}>{t("preview.about")}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-line", color: c.text }}>
                        {app.long_description || <span style={{ color: c.muted }}>—</span>}
                    </div>

                    <div style={s.h2}>{t("preview.versions")}</div>
                    {groups.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("preview.noVersion")} />}
                    {groups.map((g) => (
                        <div key={g.version_code} style={{ ...s.card, marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{t("preview.version", { version: g.version_name })}</div>
                            <div style={{ color: c.muted, fontSize: 11, marginBottom: 8 }}>{formatDate(g.published_at)}</div>
                            {g.changelog && <div style={{ fontSize: 12, whiteSpace: "pre-line", marginBottom: 8 }}>{g.changelog}</div>}
                            {g.files.map((f) => (
                                <div key={f.id} style={{ borderTop: `1px solid ${c.border}`, paddingTop: 8, marginTop: 8, fontSize: 11 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                        <span>
                                            {platformOf(f.platform)?.label} · {formatLabel(f.file_format)}
                                        </span>
                                        <span style={{ color: c.muted }}>{formatBytes(f.file_size)}</span>
                                    </div>
                                    <div style={{ fontFamily: "ui-monospace, Menlo, monospace", color: c.muted, wordBreak: "break-all", marginTop: 4 }}>
                                        SHA-256 {f.sha256_hash}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
