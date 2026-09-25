import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Col, Empty, Flex, Popconfirm, Progress, Row, Typography, Upload } from "antd";
import { DeleteOutlined, HolderOutlined, UploadOutlined } from "@ant-design/icons";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AppIcon from "@/components/AppIcon";
import { useI18n } from "@/i18n";
import { useApiError } from "@/lib/useApiError";

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_SCREENSHOTS = 12;

function Screenshot({ url, onDelete, readOnly }) {
    const { t } = useI18n();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, position: "relative", width: 150 }}
        >
            <img src={url} alt="" style={{ width: 150, height: 267, objectFit: "cover", borderRadius: 14, display: "block", background: "var(--ant-color-fill-tertiary)" }} />
            <Flex justify="space-between" style={{ position: "absolute", top: 8, left: 8, right: 8, display: readOnly ? "none" : "flex" }}>
                <Button size="small" icon={<HolderOutlined />} {...attributes} {...listeners} style={{ cursor: "grab" }} aria-label={t("media.reorder")} />
                <Popconfirm title={t("media.deleteScreenshot")} onConfirm={onDelete} okButtonProps={{ danger: true }}>
                    <Button size="small" danger icon={<DeleteOutlined />} aria-label={t("common.delete")} />
                </Popconfirm>
            </Flex>
        </div>
    );
}

/**
 * Icône et captures d'écran (ajout, réorganisation par glisser-déposer, suppression).
 * App visible : les changements sont enregistrés dans le brouillon de fiche.
 */
export default function AppMedia({ app }) {
    const listing = app.draft ?? app;
    const { canWrite } = useAuth();
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [shots, setShots] = useState(listing.screenshots ?? []);
    const [progress, setProgress] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
    useEffect(() => setShots(listing.screenshots ?? []), [listing.screenshots]);

    const updated = (next) => {
        queryClient.setQueryData(["app", app.id], next);
        queryClient.invalidateQueries({ queryKey: ["apps"] });
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
    };

    const icon = useMutation({
        mutationFn: (file) => api.uploadIcon(app.id, file, setProgress),
        onSuccess: (next) => {
            updated(next);
            message.success(next.draft ? t("review.listing.savedDraft") : t("media.iconUpdated"));
        },
        onError,
        onSettled: () => setProgress(null),
    });
    const addShots = useMutation({
        mutationFn: (files) => api.addScreenshots(app.id, files, setProgress),
        onSuccess: (next) => {
            updated(next);
            message.success(next.draft ? t("review.listing.savedDraft") : t("media.screenshotsAdded"));
        },
        onError,
        onSettled: () => setProgress(null),
    });
    const saveOrder = useMutation({ mutationFn: (urls) => api.setScreenshots(app.id, urls), onSuccess: updated, onError });

    // Upload personnalisé : plusieurs fichiers sélectionnés d'un coup sont envoyés ensemble
    let batch = [];
    const queueShot = (file) => {
        batch.push(file);
        if (batch.length === 1) {
            setTimeout(() => {
                const files = batch;
                batch = [];
                if (shots.length + files.length > MAX_SCREENSHOTS) message.error(t("media.tooMany", { max: MAX_SCREENSHOTS }));
                else addShots.mutate(files);
            });
        }
        return false;
    };

    const onDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const next = arrayMove(shots, shots.indexOf(active.id), shots.indexOf(over.id));
        setShots(next);
        saveOrder.mutate(next);
    };

    return (
        <Row gutter={16}>
            {canWrite && app.status === "published" && !app.draft && (
                <Col xs={24}>
                    <Alert type="info" showIcon title={t("review.listing.liveNotice")} style={{ marginBottom: 16 }} />
                </Col>
            )}
            <Col xs={24} lg={8}>
                <Card title={t("media.icon")}>
                    <Flex vertical align="center" gap={16}>
                        <AppIcon app={{ ...app, name: listing.name, icon_url: listing.icon_url }} size={128} />
{canWrite && (
                        <Upload accept={ACCEPT} showUploadList={false} beforeUpload={(f) => (icon.mutate(f), false)}>
                            <Button icon={<UploadOutlined />} loading={icon.isPending}>
                                {listing.icon_url ? t("media.replaceIcon") : t("media.uploadIcon")}
                            </Button>
                        </Upload>
                        )}
                        <Typography.Text type="secondary" style={{ textAlign: "center", fontSize: 13 }}>
                            {t("media.iconHelp")}
                        </Typography.Text>
                    </Flex>
                </Card>
            </Col>
            <Col xs={24} lg={16}>
                <Card
                    title={t("media.screenshots", { count: shots.length, max: MAX_SCREENSHOTS })}
                    extra={
                        canWrite && <Upload accept={ACCEPT} multiple showUploadList={false} beforeUpload={queueShot} disabled={shots.length >= MAX_SCREENSHOTS}>
                            <Button icon={<UploadOutlined />} loading={addShots.isPending} disabled={shots.length >= MAX_SCREENSHOTS}>
                                {t("media.addScreenshots")}
                            </Button>
                        </Upload>
                    }
                >
                    {progress !== null && <Progress percent={Math.round(progress * 100)} size="small" style={{ marginBottom: 16 }} />}
                    {shots.length ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext items={shots} strategy={rectSortingStrategy}>
                                <Flex gap={16} wrap>
                                    {shots.map((url) => (
                                        <Screenshot
                                            key={url}
                                            url={url}
                                            readOnly={!canWrite}
                                            onDelete={() => {
                                                const next = shots.filter((s) => s !== url);
                                                setShots(next);
                                                saveOrder.mutate(next);
                                            }}
                                        />
                                    ))}
                                </Flex>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <Empty description={t("media.noScreenshots")} />
                    )}
                    <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, fontSize: 13 }}>
                        {t("media.screenshotsHelp")}
                    </Typography.Paragraph>
                </Card>
            </Col>
        </Row>
    );
}
