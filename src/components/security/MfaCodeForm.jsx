import { useState } from "react";
import { Alert, Button, Flex, Input, Typography } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useI18n } from "@/i18n";

/** Saisie du code de connexion : 6 chiffres de l'application d'authentification, ou un code de secours. */
export default function MfaCodeForm({ onSubmit, onBack, loading, error }) {
    const { t } = useI18n();
    const [recovery, setRecovery] = useState(false);
    const [value, setValue] = useState("");
    return (
        <Flex vertical gap={16}>
            <Flex gap={12} align="flex-start">
                <SafetyOutlined style={{ fontSize: 28, color: "var(--ant-color-primary)", marginTop: 2 }} />
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                    {recovery ? t("mfa.recoveryPrompt") : t("mfa.codePrompt")}
                </Typography.Paragraph>
            </Flex>
            {error && <Alert type="error" showIcon title={error.message} />}
            {recovery ? (
                <Input
                    size="large"
                    autoFocus
                    placeholder="xxxxx-xxxxx"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onPressEnter={() => value && onSubmit(value)}
                    autoComplete="off"
                />
            ) : (
                <Input.OTP key="otp" size="large" length={6} autoFocus disabled={loading} onChange={(v) => v?.length === 6 && onSubmit(v)} />
            )}
            {recovery && (
                <Button type="primary" size="large" block loading={loading} disabled={!value} onClick={() => onSubmit(value)}>
                    {t("mfa.verify")}
                </Button>
            )}
            <Flex justify="space-between" wrap gap={8}>
                <Button type="link" style={{ paddingInline: 0 }} onClick={onBack}>
                    {t("mfa.back")}
                </Button>
                <Button
                    type="link"
                    style={{ paddingInline: 0 }}
                    onClick={() => {
                        setRecovery(!recovery);
                        setValue("");
                    }}
                >
                    {recovery ? t("mfa.useApp") : t("mfa.useRecovery")}
                </Button>
            </Flex>
        </Flex>
    );
}
