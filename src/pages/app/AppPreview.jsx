import { useState } from "react";
import { Alert, Col, Flex, Row, Segmented, Skeleton, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import PhonePreview from "@/components/PhonePreview";
import { useI18n } from "@/i18n";

/** Prévisualisation de la fiche telle qu'affichée dans l'app client (en ligne, ou avec les modifications en attente). */
export default function AppPreview({ app, initialDraft = false }) {
    const { t } = useI18n();
    const [draft, setDraft] = useState(initialDraft && !!app.draft);
    const showDraft = draft && !!app.draft;
    const { data, isLoading } = useQuery({
        queryKey: ["preview", app.id, app.updated_at, app.draft?.updated_at, showDraft],
        queryFn: () => api.preview(app.id, showDraft),
    });
    return (
        <Row gutter={[32, 24]}>
            <Col xs={24} lg={10}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                    {t("preview.title")}
                </Typography.Title>
                <Typography.Paragraph type="secondary">{t("preview.help")}</Typography.Paragraph>
                {app.draft && (
                    <Segmented
                        style={{ marginBottom: 16 }}
                        value={showDraft ? "draft" : "live"}
                        onChange={(v) => setDraft(v === "draft")}
                        options={[
                            { value: "live", label: t("review.listing.previewLive") },
                            { value: "draft", label: t("review.listing.previewDraft") },
                        ]}
                    />
                )}
                {app.status !== "published" && <Alert type="info" showIcon title={t("preview.notVisible")} />}
            </Col>
            <Col xs={24} lg={14}>
                <Flex justify="center">{isLoading ? <Skeleton.Node active style={{ width: 360, height: 740 }} /> : <PhonePreview app={data} />}</Flex>
            </Col>
        </Row>
    );
}
