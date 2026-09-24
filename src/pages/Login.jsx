import { useState } from "react";
import { Alert, Button, Card, Flex, Form, Grid, Input, Segmented, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { palette } from "@/theme";

export default function Login() {
    const { t, lang, setLang } = useI18n();
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const screens = Grid.useBreakpoint();

    if (isAuthenticated) return <Navigate to="/" replace />;

    const submit = async ({ email, password }) => {
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate(location.state?.from || "/", { replace: true });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex style={{ minHeight: "100vh" }}>
            <Flex
                vertical
                justify="space-between"
                style={{
                    flex: 1,
                    padding: 48,
                    color: "#fff",
                    background: `linear-gradient(135deg, ${palette.primary.dark}, ${palette.accent.dark} 55%, ${palette.tertiary.DEFAULT})`,
                    display: screens.lg ? "flex" : "none",
                }}
            >
                <Flex align="center" gap={12}>
                    <img src="/logo.png" alt="" width={40} height={40} />
                    <span style={{ fontSize: 22, fontWeight: 800 }}>Kaskad Console</span>
                </Flex>
                <div style={{ maxWidth: 460 }}>
                    <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{t("login.heroTitle")}</div>
                    <div style={{ fontSize: 16, opacity: 0.9, marginTop: 16, lineHeight: 1.6 }}>{t("login.heroText")}</div>
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>{t("login.restricted")}</div>
            </Flex>
            <Flex vertical align="center" justify="center" style={{ flex: 1, padding: 24 }}>
                <Flex justify="flex-end" style={{ width: "100%", maxWidth: 400, marginBottom: 16 }}>
                    <Segmented size="small" value={lang} onChange={setLang} options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }]} />
                </Flex>
                <Card style={{ width: "100%", maxWidth: 400 }} styles={{ body: { padding: 32 } }}>
                    <Typography.Title level={3} style={{ marginTop: 0 }}>
                        {t("login.title")}
                    </Typography.Title>
                    <Typography.Paragraph type="secondary">{t("login.subtitle")}</Typography.Paragraph>
                    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
                    <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                        <Form.Item name="email" label={t("login.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                            <Input prefix={<MailOutlined />} size="large" autoComplete="username" autoFocus />
                        </Form.Item>
                        <Form.Item name="password" label={t("login.password")} rules={[{ required: true, message: t("login.passwordRequired") }]}>
                            <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            {t("login.submit")}
                        </Button>
                    </Form>
                </Card>
            </Flex>
        </Flex>
    );
}
