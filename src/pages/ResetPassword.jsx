import { useState } from "react";
import { Alert, App, Button, Form, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

/** Lien reçu par e-mail : choix d'un nouveau mot de passe, puis ouverture de la session. */
export default function ResetPassword() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const { startSession } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const submit = async ({ password }) => {
        setError(null);
        setLoading(true);
        try {
            const session = await api.resetPassword(params.get("token") || "", password);
            message.success(t("reset.done"));
            // Double authentification activée : le code est demandé sur la page de connexion
            if (session.mfa_required) return navigate("/login", { replace: true, state: { mfaToken: session.mfa_token } });
            startSession(session);
            navigate("/", { replace: true });
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t("reset.newTitle")} subtitle={t("reset.newSubtitle")}>
            {error && (
                <Alert
                    type="error"
                    showIcon
                    title={error.message}
                    action={
                        error.code === "token_invalid" && (
                            <Link to="/forgot-password">
                                <Button size="small">{t("reset.newLink")}</Button>
                            </Link>
                        )
                    }
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                <Form.Item name="password" label={t("account.newPassword")} rules={[{ required: true }, { min: 8, message: t("account.passwordMin") }]}>
                    <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" autoFocus />
                </Form.Item>
                <Form.Item
                    name="confirm"
                    label={t("account.confirmPassword")}
                    dependencies={["password"]}
                    rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                            validator: (_, v) => (!v || v === getFieldValue("password") ? Promise.resolve() : Promise.reject(t("account.mismatch"))),
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    {t("reset.save")}
                </Button>
            </Form>
            <Typography.Paragraph type="secondary" style={{ textAlign: "center", margin: "20px 0 0" }}>
                <Link to="/login">{t("reset.backToLogin")}</Link>
            </Typography.Paragraph>
        </AuthShell>
    );
}
