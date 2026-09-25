import { useState } from "react";
import { Button, Form, Input, Result, Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { Link, Navigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

/** Mot de passe oublié : envoi d'un lien de réinitialisation (e-mail dans la langue de la console). */
export default function ForgotPassword() {
    const { t } = useI18n();
    const { isAuthenticated } = useAuth();
    const [sentTo, setSentTo] = useState(null);
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) return <Navigate to="/" replace />;

    const submit = async ({ email }) => {
        setLoading(true);
        const address = email.trim().toLowerCase();
        // Même réponse que l'adresse existe ou non (pas d'énumération des comptes)
        await api.forgotPassword(address).catch(() => {});
        setLoading(false);
        setSentTo(address);
    };

    if (sentTo) {
        return (
            <AuthShell>
                <Result
                    status="success"
                    icon={<MailOutlined />}
                    title={t("reset.sentTitle")}
                    subTitle={t("reset.sentText", { email: sentTo })}
                    extra={
                        <Link to="/login">
                            <Button type="primary">{t("signup.toLogin")}</Button>
                        </Link>
                    }
                />
            </AuthShell>
        );
    }

    return (
        <AuthShell title={t("reset.forgotTitle")} subtitle={t("reset.forgotSubtitle")}>
            <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                <Form.Item name="email" label={t("login.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                    <Input prefix={<MailOutlined />} size="large" autoComplete="email" autoFocus />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    {t("reset.send")}
                </Button>
            </Form>
            <Typography.Paragraph type="secondary" style={{ textAlign: "center", margin: "20px 0 0" }}>
                <Link to="/login">{t("reset.backToLogin")}</Link>
            </Typography.Paragraph>
        </AuthShell>
    );
}
