import { useEffect } from "react";
import { App, Button, Card, Col, Descriptions, Flex, Form, Input, Row, Segmented, Switch, Tag, Typography } from "antd";
import { DesktopOutlined, MoonFilled, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import PageHeader from "@/components/PageHeader";
import TwoStepCard from "@/components/security/TwoStepCard";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { MODES, useThemeMode } from "@/theme";

const THEME_ICONS = { light: <SunOutlined />, system: <DesktopOutlined />, dark: <MoonOutlined />, black: <MoonFilled /> };

/** Mon compte : profil, mot de passe, préférences d'affichage. */
export default function Account() {
    const { t, lang, setLang } = useI18n();
    const { mode, setMode, material, setMaterial } = useThemeMode();
    const { admin, setAdmin } = useAuth();
    const { message } = App.useApp();
    const onError = useApiError();
    const [profile] = Form.useForm();
    const [password] = Form.useForm();

    useEffect(() => {
        profile.setFieldsValue({ name: admin?.name });
    }, [admin, profile]);

    const saveProfile = useMutation({
        mutationFn: (values) => api.updateMe(values),
        onSuccess: (a) => {
            setAdmin(a);
            message.success(t("common.saved"));
        },
        onError,
    });
    const savePassword = useMutation({
        mutationFn: ({ current_password, new_password }) => api.updateMe({ current_password, new_password }),
        onSuccess: () => {
            password.resetFields();
            message.success(t("account.passwordChanged"));
        },
        onError,
    });

    return (
        <>
            <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title={t("account.profile")} style={{ marginBottom: 16 }}>
                        <Descriptions
                            column={1}
                            size="small"
                            style={{ marginBottom: 20 }}
                            items={[
                                { label: t("team.fields.email"), children: admin?.email },
                                { label: t("team.fields.role"), children: <Tag color="blue">{t(`roles.${admin?.role}`)}</Tag> },
                                { label: t("team.columns.since"), children: formatDate(admin?.created_at) },
                            ]}
                        />
                        <Form form={profile} layout="vertical" onFinish={(v) => saveProfile.mutate(v)}>
                            <Form.Item name="name" label={t("team.fields.name")} rules={[{ required: true, whitespace: true }]}>
                                <Input maxLength={100} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={saveProfile.isPending}>
                                {t("common.save")}
                            </Button>
                        </Form>
                    </Card>
                    <Card title={t("account.preferences")}>
                        <Form layout="vertical">
                            <Form.Item label={t("account.theme")} extra={t("account.themeHelp")}>
                                <Segmented
                                    value={mode}
                                    onChange={setMode}
                                    options={MODES.map((m) => ({ value: m, label: t(`theme.${m}`), icon: THEME_ICONS[m] }))}
                                />
                            </Form.Item>
                            <Form.Item label={t("account.material")}>
                                <Flex align="flex-start" gap={16} justify="space-between">
                                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                        {t("account.materialHelp")}
                                    </Typography.Text>
                                    <Switch checked={material} onChange={setMaterial} aria-label={t("account.material")} />
                                </Flex>
                            </Form.Item>
                            <Form.Item label={t("account.language")} style={{ marginBottom: 0 }}>
                                <Segmented
                                    value={lang}
                                    onChange={setLang}
                                    options={[
                                        { value: "fr", label: "Français" },
                                        { value: "en", label: "English" },
                                    ]}
                                />
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title={t("account.password")}>
                        <Form form={password} layout="vertical" onFinish={(v) => savePassword.mutate(v)} autoComplete="off">
                            <Form.Item name="current_password" label={t("account.currentPassword")} rules={[{ required: true }]}>
                                <Input.Password autoComplete="current-password" />
                            </Form.Item>
                            <Form.Item name="new_password" label={t("account.newPassword")} rules={[{ required: true }, { min: 8, message: t("account.passwordMin") }]}>
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                            <Form.Item
                                name="confirm"
                                label={t("account.confirmPassword")}
                                dependencies={["new_password"]}
                                rules={[
                                    { required: true },
                                    ({ getFieldValue }) => ({
                                        validator: (_, v) => (!v || v === getFieldValue("new_password") ? Promise.resolve() : Promise.reject(t("account.mismatch"))),
                                    }),
                                ]}
                            >
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={savePassword.isPending}>
                                {t("account.changePassword")}
                            </Button>
                        </Form>
                    </Card>
                    <div style={{ marginTop: 16 }}>
                        <TwoStepCard />
                    </div>
                </Col>
            </Row>
        </>
    );
}
