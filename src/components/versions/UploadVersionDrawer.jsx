import { useState } from "react";
import { Alert, App, Button, Col, Drawer, Flex, Form, Input, InputNumber, Progress, Row, Select, Typography, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import MdiIcon from "@/components/MdiIcon";
import { useI18n } from "@/i18n";
import { EXTENSION, formatBytes, formatLabel, PLATFORMS, platformOf, SEMVER } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

// Format déduit de l'extension du fichier déposé
function detectFormat(name = "") {
    const lower = name.toLowerCase();
    return Object.keys(EXTENSION).find((f) => lower.endsWith(EXTENSION[f].toLowerCase()));
}

/**
 * Upload d'une nouvelle version : formulaire de métadonnées (version, code, plateforme, format, changelog)
 * puis envoi du binaire avec progression. L'analyse de sécurité démarre automatiquement côté serveur.
 */
export default function UploadVersionDrawer({ app, versions = [], open, onClose, onUploaded }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const platform = Form.useWatch("platform", form);

    const nextCode = Math.max(0, ...versions.map((v) => v.version_code)) + 1;
    const latest = versions[0];

    const upload = useMutation({
        mutationFn: ({ values, file }) => api.uploadVersion(app.id, values, file, setProgress),
        onSuccess: (v) => {
            queryClient.invalidateQueries({ queryKey: ["versions", app.id] });
            queryClient.invalidateQueries({ queryKey: ["moderation"] });
            queryClient.invalidateQueries({ queryKey: ["overview"] });
            message.success(t("versions.upload.done"));
            reset();
            onUploaded?.(v);
        },
        onError,
    });

    const reset = () => {
        form.resetFields();
        setFile(null);
        setProgress(0);
    };

    const pickFile = (f) => {
        setFile(f);
        const fmt = detectFormat(f.name);
        if (fmt) {
            const p = PLATFORMS.find((p) => p.formats.includes(fmt));
            form.setFieldsValue({ platform: p.id, file_format: fmt });
        }
        form.validateFields(["file"]).catch(() => {});
        return false;
    };

    const submit = (values) => {
        const { file: _f, ...fields } = values;
        upload.mutate({ values: { ...fields, changelog: fields.changelog ?? "" }, file });
    };

    const formats = platformOf(platform)?.formats ?? [];

    return (
        <Drawer
            open={open}
            onClose={() => !upload.isPending && onClose()}
            size="large"
            title={t("versions.upload.title", { app: app.name })}
            maskClosable={!upload.isPending}
            footer={
                <Flex justify="flex-end" gap={8}>
                    <Button onClick={onClose} disabled={upload.isPending}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={upload.isPending}>
                        {t("versions.upload.submit")}
                    </Button>
                </Flex>
            }
        >
            <Alert type="info" showIcon title={t("versions.upload.info")} style={{ marginBottom: 20 }} />
            <Form
                form={form}
                layout="vertical"
                onFinish={submit}
                disabled={upload.isPending}
                initialValues={{ version_code: nextCode }}
                requiredMark="optional"
            >
                <Form.Item name="file" label={t("versions.fields.file")} rules={[{ validator: () => (file ? Promise.resolve() : Promise.reject(t("versions.upload.fileRequired"))) }]}>
                    <Upload.Dragger
                        multiple={false}
                        showUploadList={false}
                        beforeUpload={pickFile}
                        accept={Object.values(EXTENSION).join(",")}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        {file ? (
                            <>
                                <Typography.Text strong>{file.name}</Typography.Text>
                                <br />
                                <Typography.Text type="secondary">{formatBytes(file.size)}</Typography.Text>
                            </>
                        ) : (
                            <>
                                <p className="ant-upload-text">{t("versions.upload.drop")}</p>
                                <p className="ant-upload-hint">{Object.values(EXTENSION).join(" · ")}</p>
                            </>
                        )}
                    </Upload.Dragger>
                </Form.Item>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Form.Item name="platform" label={t("versions.fields.platform")} rules={[{ required: true }]}>
                            <Select
                                onChange={(p) => form.setFieldValue("file_format", platformOf(p).formats[0])}
                                options={PLATFORMS.map((p) => ({
                                    value: p.id,
                                    label: (
                                        <Flex align="center" gap={6}>
                                            <MdiIcon name={p.icon} size={0.65} /> {p.label}
                                        </Flex>
                                    ),
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="file_format"
                            label={t("versions.fields.format")}
                            dependencies={["platform"]}
                            rules={[
                                { required: true },
                                {
                                    validator: (_, fmt) =>
                                        !file || !fmt || file.name.toLowerCase().endsWith(EXTENSION[fmt].toLowerCase())
                                            ? Promise.resolve()
                                            : Promise.reject(t("versions.upload.extensionMismatch", { ext: EXTENSION[fmt] })),
                                },
                            ]}
                        >
                            <Select disabled={!platform} options={formats.map((f) => ({ value: f, label: formatLabel(f) }))} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="version_name"
                            label={t("versions.fields.versionName")}
                            extra={latest ? t("versions.upload.latest", { version: latest.version_name }) : null}
                            rules={[{ required: true }, { pattern: SEMVER, message: t("versions.semver") }]}
                        >
                            <Input placeholder="1.4.0" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="version_code" label={t("versions.fields.versionCode")} extra={t("versions.upload.codeHelp")} rules={[{ required: true }]}>
                            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="changelog" label={t("versions.fields.changelog")}>
                    <Input.TextArea autoSize={{ minRows: 5, maxRows: 14 }} maxLength={20000} showCount placeholder={t("versions.upload.changelogPlaceholder")} />
                </Form.Item>
            </Form>
            {upload.isPending && (
                <div>
                    <Typography.Text type="secondary">{progress < 1 ? t("versions.upload.sending") : t("versions.upload.processing")}</Typography.Text>
                    <Progress percent={Math.round(progress * 100)} status="active" />
                </div>
            )}
        </Drawer>
    );
}
