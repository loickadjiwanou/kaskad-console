import { useState } from "react";
import { Alert, App, Button, Divider, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

export default function Login() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    if (isAuthenticated) return <Navigate to="/" replace />;

    const submit = async ({ email, password }) => {
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate(location.state?.from || "/", { replace: true });
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        await api.resendVerification(form.getFieldValue("email")).catch(() => {});
        message.success(t("signup.resent"));
    };

    return (
        <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
            {error && (
                <Alert
                    type={error.code === "email_not_verified" ? "warning" : "error"}
                    showIcon
                    title={error.message}
                    action={
                        error.code === "email_not_verified" && (
                            <Button size="small" onClick={resend}>
                                {t("signup.resend")}
                            </Button>
                        )
                    }
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                <Form.Item name="email" label={t("login.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                    <Input prefix={<MailOutlined />} size="large" autoComplete="username" autoFocus />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t("login.password")}
                    rules={[{ required: true, message: t("login.passwordRequired") }]}
                    extra={
                        <Link to="/forgot-password" style={{ display: "inline-block", marginTop: 6 }}>
                            {t("login.forgot")}
                        </Link>
                    }
                >
                    <Input.Password prefix={<LockOutlined />} size="large" autoComplete="current-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                    {t("login.submit")}
                </Button>
            </Form>
            <Divider plain>
                <Typography.Text type="secondary">{t("login.noAccount")}</Typography.Text>
            </Divider>
            <Link to="/signup">
                <Button size="large" block>
                    {t("login.createAccount")}
                </Button>
            </Link>
        </AuthShell>
    );
}
