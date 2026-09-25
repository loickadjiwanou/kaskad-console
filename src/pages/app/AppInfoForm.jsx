import { useEffect } from "react";
import { Alert, App, Button, Card, Checkbox, Col, Flex, Form, Input, Row, Select, Switch, Tabs, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import MdiIcon from "@/components/MdiIcon";
import { useI18n } from "@/i18n";
import { PLATFORMS } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

const FIELDS = ["name", "category_ids", "target_platforms", "featured", "android_package"];
const LANGS = ["fr", "en"];
const otherLang = (l) => (l === "fr" ? "en" : "fr");

/** Valeurs du formulaire : textes par langue (`short_fr`, `long_en`…) à partir de la fiche (langue principale + traduction). */
function toForm(listing) {
    const base = listing.default_language || "fr";
    const tr = listing.translations?.[otherLang(base)] || {};
    return {
        ...Object.fromEntries(FIELDS.map((f) => [f, listing[f]])),
        default_language: base,
        [`short_${base}`]: listing.short_description || "",
        [`long_${base}`]: listing.long_description || "",
        [`short_${otherLang(base)}`]: tr.short_description || "",
        [`long_${otherLang(base)}`]: tr.long_description || "",
    };
}

/** Corps de mise à jour : textes de la langue principale + traduction dans l'autre langue. */
function fromForm(values) {
    const base = values.default_language || "fr";
    const other = otherLang(base);
    const rest = Object.fromEntries(FIELDS.map((f) => [f, values[f]]));
    return {
        ...rest,
        android_package: values.android_package || null,
        default_language: base,
        short_description: values[`short_${base}`] || "",
        long_description: values[`long_${base}`] || "",
        translations: { [other]: { short_description: values[`short_${other}`] || "", long_description: values[`long_${other}`] || "" } },
    };
}

/**
 * Formulaire complet de la fiche : textes, catégories, plateformes ciblées, mise en avant.
 * App visible : les valeurs affichées et enregistrées sont celles du brouillon de fiche (non publié).
 */
export default function AppInfoForm({ app }) {
    const listing = app.draft ?? app;
    const liveApp = app.status === "published" && !app.draft;
    const { canWrite } = useAuth();
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

    useEffect(() => {
        form.setFieldsValue(toForm(listing));
    }, [listing, form]);

    const save = useMutation({
        mutationFn: (values) => api.updateApp(app.id, fromForm(values)),
        onSuccess: (updated) => {
            queryClient.setQueryData(["app", app.id], updated);
            queryClient.invalidateQueries({ queryKey: ["apps"] });
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            form.resetFields();
            form.setFieldsValue(toForm(updated.draft ?? updated));
            message.success(updated.draft ? t("review.listing.savedDraft") : t("common.saved"));
        },
        onError,
    });

    return (
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} requiredMark="optional" disabled={!canWrite}>
            {liveApp && canWrite && <Alert type="info" showIcon title={t("review.listing.liveNotice")} style={{ marginBottom: 16 }} />}
            <Row gutter={16}>
                <Col xs={24} xl={16}>
                    <Card title={t("apps.sections.texts")}>
                        <Form.Item name="name" label={t("apps.fields.name")} rules={[{ required: true, whitespace: true }]}>
                            <Input maxLength={120} showCount />
                        </Form.Item>
                        <Form.Item name="default_language" label={t("release.defaultLanguage")} extra={t("release.defaultLanguageHelp")}>
                            <Select style={{ maxWidth: 240 }} options={LANGS.map((l) => ({ value: l, label: t(`release.lang.${l}`) }))} />
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate={(a, b) => a.default_language !== b.default_language}>
                            {({ getFieldValue }) => {
                                const base = getFieldValue("default_language") || "fr";
                                return (
                                    <Tabs
                                        items={[base, otherLang(base)].map((l) => ({
                                            key: l,
                                            forceRender: true,
                                            label: (
                                                <span>
                                                    {t(`release.lang.${l}`)}
                                                    <Tag bordered={false} style={{ marginInlineStart: 6 }}>
                                                        {l === base ? t("release.primary") : t("release.translation")}
                                                    </Tag>
                                                </span>
                                            ),
                                            children: (
                                                <>
                                                    {l !== base && (
                                                        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                                                            {t("release.listingTranslationHelp", { lang: t(`release.lang.${base}`) })}
                                                        </Typography.Paragraph>
                                                    )}
                                                    <Form.Item name={`short_${l}`} label={t("apps.fields.short")} extra={t("apps.fields.shortHelp")}>
                                                        <Input maxLength={200} showCount />
                                                    </Form.Item>
                                                    <Form.Item name={`long_${l}`} label={t("apps.fields.long")} extra={t("apps.fields.longHelp")}>
                                                        <Input.TextArea autoSize={{ minRows: 8, maxRows: 20 }} maxLength={20000} showCount />
                                                    </Form.Item>
                                                </>
                                            ),
                                        }))}
                                    />
                                );
                            }}
                        </Form.Item>
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card title={t("apps.sections.classification")} style={{ marginBottom: 16 }}>
                        <Form.Item name="category_ids" label={t("apps.fields.categories")}>
                            <Select
                                mode="multiple"
                                options={(categories ?? []).map((c) => ({
                                    value: c.id,
                                    label: (
                                        <Flex align="center" gap={6}>
                                            <MdiIcon name={c.icon} size={0.65} /> {c.name}
                                        </Flex>
                                    ),
                                }))}
                            />
                        </Form.Item>
                        <Form.Item name="target_platforms" label={t("apps.fields.platforms")} extra={t("apps.fields.platformsHelp")}>
                            <Checkbox.Group
                                options={PLATFORMS.map((p) => ({
                                    value: p.id,
                                    label: (
                                        <Flex align="center" gap={4}>
                                            <MdiIcon name={p.icon} size={0.65} /> {p.label}
                                        </Flex>
                                    ),
                                }))}
                            />
                        </Form.Item>
                        <Form.Item name="featured" label={t("apps.fields.featured")} valuePropName="checked" extra={t("apps.fields.featuredHelp")}>
                            <Switch />
                        </Form.Item>
                    </Card>
                    <Card title="Android">
                        <Form.Item name="android_package" label={t("apps.fields.androidPackage")} extra={t("apps.fields.androidPackageHelp")}>
                            <Input placeholder="com.kaskad.notes" />
                        </Form.Item>
                    </Card>
                </Col>
            </Row>
            <Flex justify="flex-end" gap={8} style={{ marginTop: 16, display: canWrite ? "flex" : "none" }}>
                <Form.Item shouldUpdate noStyle>
                    {() => (
                        <>
                            {form.isFieldsTouched() && <Typography.Text type="warning">{t("common.unsaved")}</Typography.Text>}
                            <Button onClick={() => form.resetFields()} disabled={!form.isFieldsTouched()}>
                                {t("common.cancel")}
                            </Button>
                            <Button type="primary" htmlType="submit" loading={save.isPending}>
                                {t("common.save")}
                            </Button>
                        </>
                    )}
                </Form.Item>
            </Flex>
        </Form>
    );
}
