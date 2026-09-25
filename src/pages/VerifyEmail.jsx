import { useEffect, useRef, useState } from "react";
import { App, Button, Form, Input, Result, Spin } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

/** Lien reçu par e-mail après l'inscription : confirme l'adresse et ouvre la session. */
export default function VerifyEmail() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const { startSession } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [error, setError] = useState(null);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return; // une seule tentative (le jeton est à usage unique)
        started.current = true;
        api.verifyEmail(params.get("token") || "")
            .then((session) => {
                startSession(session);
                message.success(t("signup.verified"));
                navigate("/", { replace: true });
            })
            .catch((e) => setError(e.message));
    }, [params, startSession, navigate, message, t]);

    if (!error) {
        return (
            <AuthShell>
                <Result icon={<Spin size="large" />} title={t("signup.verifying")} />
            </AuthShell>
        );
    }
    return (
        <AuthShell>
            <Result
                status="warning"
                title={t("signup.linkInvalid")}
                subTitle={error}
                extra={
                    <Form
                        layout="inline"
                        style={{ justifyContent: "center", rowGap: 8 }}
                        onFinish={async ({ email }) => {
                            await api.resendVerification(email).catch(() => {});
                            message.success(t("signup.resent"));
                        }}
                    >
                        <Form.Item name="email" rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                            <Input placeholder={t("login.email")} style={{ width: 220 }} />
                        </Form.Item>
                        <Button htmlType="submit">{t("signup.resend")}</Button>
                        <Link to="/login" style={{ marginLeft: 8 }}>
                            <Button type="link">{t("signup.toLogin")}</Button>
                        </Link>
                    </Form>
                }
            />
        </AuthShell>
    );
}
