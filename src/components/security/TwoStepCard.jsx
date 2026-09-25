import { useState } from "react";
import { Alert, App, Button, Card, Flex, Form, Input, Modal, Skeleton, Tag, Typography } from "antd";
import { CheckCircleFilled, SafetyOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import MfaSetupWizard from "./MfaSetupWizard";
import RecoveryCodes from "./RecoveryCodes";

/** Mon compte : état de la double authentification, activation, désactivation, nouveaux codes de secours. */
export default function TwoStepCard() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const { admin, setAdmin } = useAuth();
    const queryClient = useQueryClient();
    const { data: status } = useQuery({ queryKey: ["mfa"], queryFn: api.mfaStatus });
    const [modal, setModal] = useState(null); // setup | disable | codes
    const [codes, setCodes] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const close = () => {
        setModal(null);
        setCodes(null);
        setError(null);
    };
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["mfa"] });
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

    const disable = ({ password, code }) =>
        run(async () => {
            await api.mfaDisable(password, code);
            setAdmin({ ...admin, mfa_enabled: false });
            refresh();
            close();
            message.success(t("mfa.disabled"));
        });
    const regenerate = ({ code }) =>
        run(async () => {
            setCodes((await api.mfaRecoveryCodes(code)).recovery_codes);
            refresh();
        });

    const enabled = status?.enabled ?? admin?.mfa_enabled;
    return (
        <Card
            title={
                <Flex align="center" gap={8}>
                    <SafetyOutlined />
                    {t("mfa.title")}
                </Flex>
            }
            extra={enabled ? <Tag color="green" icon={<CheckCircleFilled />}>{t("mfa.on")}</Tag> : <Tag>{t("mfa.off")}</Tag>}
        >
            <Typography.Paragraph type="secondary">{t("mfa.description")}</Typography.Paragraph>
            {!status ? (
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
            ) : enabled ? (
                <>
                    <Typography.Paragraph>
                        {t("mfa.enabledSince", { date: formatDate(status?.enabled_at) })}
                        <br />
                        <Typography.Text type={status?.recovery_codes_left <= 2 ? "danger" : "secondary"}>
                            {t("mfa.codesLeft", { count: status?.recovery_codes_left ?? 0 })}
                        </Typography.Text>
                    </Typography.Paragraph>
                    {status?.required && <Alert type="info" showIcon title={t("mfa.requiredInfo")} style={{ marginBottom: 16 }} />}
                    <Flex gap={8} wrap>
                        <Button onClick={() => setModal("codes")}>{t("mfa.newCodes")}</Button>
                        {!status?.required && (
                            <Button danger onClick={() => setModal("disable")}>
                                {t("mfa.disable")}
                            </Button>
                        )}
                    </Flex>
                </>
            ) : (
                <Button type="primary" icon={<SafetyOutlined />} onClick={() => setModal("setup")}>
                    {t("mfa.enable")}
                </Button>
            )}

            <Modal open={modal === "setup"} title={t("mfa.enable")} footer={null} onCancel={close} destroyOnHidden width={560} maskClosable={false}>
                <MfaSetupWizard
                    onCancel={close}
                    onDone={() => {
                        refresh();
                        close();
                    }}
                />
            </Modal>

            <Modal open={modal === "disable"} title={t("mfa.disable")} footer={null} onCancel={close} destroyOnHidden>
                {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
                <Form layout="vertical" onFinish={disable} requiredMark={false}>
                    <Typography.Paragraph type="secondary">{t("mfa.disableHelp")}</Typography.Paragraph>
                    <Form.Item name="password" label={t("mfa.confirmPassword")} rules={[{ required: true }]}>
                        <Input.Password autoComplete="current-password" autoFocus />
                    </Form.Item>
                    <Form.Item name="code" label={t("mfa.codeOrRecovery")} rules={[{ required: true }]}>
                        <Input autoComplete="one-time-code" placeholder="123456" />
                    </Form.Item>
                    <Flex gap={8} justify="flex-end">
                        <Button onClick={close}>{t("common.cancel")}</Button>
                        <Button danger type="primary" htmlType="submit" loading={loading}>
                            {t("mfa.disable")}
                        </Button>
                    </Flex>
                </Form>
            </Modal>

            <Modal open={modal === "codes"} title={t("mfa.newCodes")} footer={null} onCancel={close} destroyOnHidden width={520}>
                {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
                {codes ? (
                    <Flex vertical gap={16}>
                        <Alert type="warning" showIcon title={t("mfa.recoveryTitle")} description={t("mfa.recoveryHelp")} />
                        <RecoveryCodes codes={codes} email={admin?.email} />
                        <Flex justify="flex-end">
                            <Button type="primary" onClick={close}>
                                {t("mfa.finish")}
                            </Button>
                        </Flex>
                    </Flex>
                ) : (
                    <Form layout="vertical" onFinish={regenerate} requiredMark={false}>
                        <Typography.Paragraph type="secondary">{t("mfa.newCodesHelp")}</Typography.Paragraph>
                        <Form.Item name="code" label={t("mfa.enterCode")} rules={[{ required: true, len: 6 }]}>
                            <Input.OTP length={6} autoFocus />
                        </Form.Item>
                        <Flex gap={8} justify="flex-end">
                            <Button onClick={close}>{t("common.cancel")}</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {t("mfa.generate")}
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Modal>
        </Card>
    );
}
