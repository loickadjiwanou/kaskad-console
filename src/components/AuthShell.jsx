import { Card, Flex, Grid, Segmented, Typography } from "antd";
import { useI18n } from "@/i18n";
import { palette, useThemeMode } from "@/theme";

/** Mise en page des écrans publics (connexion, inscription, confirmation, invitation). */
export default function AuthShell({ title, subtitle, children, width = 420 }) {
    const { t, lang, setLang } = useI18n();
    const screens = Grid.useBreakpoint();
    const { material } = useThemeMode();
    return (
        <Flex style={{ minHeight: "100vh" }}>
            <Flex
                vertical
                justify="space-between"
                style={{
                    flex: 1,
                    padding: 48,
                    color: material ? "var(--md-sys-color-on-primary)" : "#fff",
                    background: material
                        ? "var(--md-sys-color-primary)"
                        : `linear-gradient(135deg, ${palette.primary.dark}, ${palette.accent.dark} 55%, ${palette.tertiary.DEFAULT})`,
                    borderRadius: material ? "0 28px 28px 0" : 0,
                    display: screens.lg ? "flex" : "none",
                }}
            >
                <Flex align="center" gap={12}>
                    <img src="/logo.png" alt="" width={40} height={40} />
                    <span style={{ fontSize: 22, fontWeight: material ? 500 : 800 }}>Kaskad Console</span>
                </Flex>
                <div style={{ maxWidth: 460 }}>
                    <div
                        style={
                            material
                                ? { fontSize: 45, fontWeight: 400, lineHeight: "52px" }
                                : { fontSize: 38, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }
                        }
                    >
                        {t("login.heroTitle")}
                    </div>
                    <div style={{ fontSize: 16, opacity: 0.9, marginTop: 16, lineHeight: 1.6 }}>{t("login.heroText")}</div>
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>{t("login.footer")}</div>
            </Flex>
            <Flex vertical align="center" justify="center" style={{ flex: 1, padding: 24 }}>
                <Flex justify="space-between" align="center" style={{ width: "100%", maxWidth: width, marginBottom: 16 }}>
                    {!screens.lg ? (
                        <Flex align="center" gap={8}>
                            <img src="/logo.png" alt="" width={28} height={28} />
                            <Typography.Text strong>Kaskad Console</Typography.Text>
                        </Flex>
                    ) : (
                        <span />
                    )}
                    <Segmented size="small" value={lang} onChange={setLang} options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }]} />
                </Flex>
                <Card style={{ width: "100%", maxWidth: width, borderRadius: material ? 28 : undefined }} styles={{ body: { padding: 32 } }}>
                    {title && (
                        <Typography.Title level={3} style={{ marginTop: 0 }}>
                            {title}
                        </Typography.Title>
                    )}
                    {subtitle && <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>}
                    {children}
                </Card>
            </Flex>
        </Flex>
    );
}
