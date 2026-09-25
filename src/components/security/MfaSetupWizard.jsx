import { useState } from "react";
import { Alert, App, Button, Checkbox, Flex, Form, Input, QRCode, Steps, Typography, theme } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import RecoveryCodes from "./RecoveryCodes";

/**
 * Configuration de la double authentification : mot de passe → QR code à scanner (ou clé à saisir)
 * et premier code → codes de secours à conserver.
 */
export default function MfaSetupWizard({ onDone, onCancel }) {
    const { t } = useI18n();
    const { token } = theme.useToken();
    const { message } = App.useApp();
    const { admin, setAdmin } = useAuth();
    const [step, setStep] = useState(0);
    const [setup, setSetup] = useState(null);
    const [codes, setCodes] = useState([]);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [nextAdmin, setNextAdmin] = useState(null);

    const run = async (fn) => {
        setError(null);
        setLoading(true);
        try {
            await fn();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const start = ({ password }) =>
        run(async () => {
            setSetup(await api.mfaSetup(password));
            setStep(1);
        });

    const confirm = (code) =>
        run(async () => {
            const res = await api.mfaEnable(code);
            setCodes(res.recovery_codes);
            setNextAdmin(res.admin);
            setStep(2);
        });

    const finish = () => {
        // Le profil n'est mis à jour qu'à la fin : la console (gate) reste sur les codes de secours tant qu'ils ne sont pas enregistrés
        if (nextAdmin) setAdmin({ ...admin, ...nextAdmin });
        message.success(t("mfa.enabled"));
        onDone?.();
    };

    return (
        <div>
            <Steps
                size="small"
                current={step}
                style={{ marginBottom: 24 }}
                items={[{ title: t("mfa.steps.password") }, { title: t("mfa.steps.scan") }, { title: t("mfa.steps.codes") }]}
            />
            {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

            {step === 0 && (
                <Form layout="vertical" onFinish={start} requiredMark={false}>
                    <Typography.Paragraph type="secondary">{t("mfa.intro")}</Typography.Paragraph>
                    <Form.Item name="password" label={t("mfa.confirmPassword")} rules={[{ required: true }]}>
                        <Input.Password autoFocus autoComplete="current-password" />
                    </Form.Item>
                    <Flex gap={8} justify="flex-end">
                        {onCancel && <Button onClick={onCancel}>{t("common.cancel")}</Button>}
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {t("mfa.continue")}
                        </Button>
                    </Flex>
                </Form>
            )}

            {step === 1 && setup && (
                <Flex vertical gap={16}>
                    <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                        {t("mfa.scanHelp")}
                    </Typography.Paragraph>
                    <Flex gap={24} wrap align="center">
                        <QRCode value={setup.otpauth_url} size={176} bgColor="#fff" color="#000" style={{ padding: 8, background: "#fff" }} />
                        <div style={{ flex: 1, minWidth: 220 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                {t("mfa.manualKey")}
                            </Typography.Text>
                            <Typography.Paragraph
                                copyable={{ text: setup.secret, icon: <CopyOutlined />, tooltips: [t("share.copy"), t("share.copied")] }}
                                style={{ fontFamily: token.fontFamilyCode, fontSize: 15, letterSpacing: 1, margin: "4px 0 0", wordBreak: "break-all" }}
                            >
                                {setup.secret.match(/.{1,4}/g).join(" ")}
                            </Typography.Paragraph>
                        </div>
                    </Flex>
                    <div>
                        <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                            {t("mfa.enterCode")}
                        </Typography.Text>
                        <Input.OTP length={6} autoFocus disabled={loading} onChange={(v) => v?.length === 6 && confirm(v)} />
                    </div>
                    {onCancel && (
                        <Flex justify="flex-end">
                            <Button onClick={onCancel}>{t("common.cancel")}</Button>
                        </Flex>
                    )}
                </Flex>
            )}

            {step === 2 && (
                <Flex vertical gap={16}>
                    <Alert type="warning" showIcon title={t("mfa.recoveryTitle")} description={t("mfa.recoveryHelp")} />
                    <RecoveryCodes codes={codes} email={admin?.email} />
                    <Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)}>
                        {t("mfa.savedCodes")}
                    </Checkbox>
                    <Flex justify="flex-end">
                        <Button type="primary" disabled={!saved} onClick={finish}>
                            {t("mfa.finish")}
                        </Button>
                    </Flex>
                </Flex>
            )}
        </div>
    );
}
