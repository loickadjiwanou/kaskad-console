import { useState } from "react";
import { App, Button, Checkbox, Empty, Flex, Input, Segmented, Table, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api";
import { AppStatusTag } from "@/components/Tags";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

const REASON_COLORS = { malware: "red", abusive: "volcano", copyright: "purple", misleading: "orange", broken: "blue", other: "default" };

function ReasonTag({ reason }) {
    const { t } = useI18n();
    return <Tag color={REASON_COLORS[reason]}>{t(`ratings.reasons.${reason}`)}</Tag>;
}

/** Signalements d'apps envoyés depuis l'app client : classer sans suite ou traiter (avec dépublication possible). */
export default function ReportsTab() {
    const { t } = useI18n();
    const { modal, message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState("open");
    const { data, isLoading } = useQuery({
        queryKey: ["reports", status],
        queryFn: () => api.moderationReports(status),
        refetchInterval: 30000,
        placeholderData: (prev) => prev,
    });
    const resolve = useMutation({
        mutationFn: ({ id, body }) => api.resolveReport(id, body),
        onSuccess: (_, { body }) => {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            queryClient.invalidateQueries({ queryKey: ["overview"] });
            queryClient.invalidateQueries({ queryKey: ["apps"] });
            message.success(body.unpublish ? t("reports.doneUnpublished") : t(`reports.done.${body.resolution}`));
        },
        onError,
    });

    // Boîte de dialogue : note interne facultative et, pour « Traiter », dépublication de l'app
    const open = (report, resolution) => {
        const canUnpublish = resolution === "resolved" && report.app_status === "published";
        let note = "";
        let unpublish = canUnpublish;
        modal.confirm({
            title: t(`reports.${resolution}Title`, { name: report.app_name }),
            icon: null,
            width: 520,
            okText: t(`reports.${resolution}`),
            okButtonProps: { danger: resolution === "resolved" },
            content: (
                <div style={{ marginTop: 8 }}>
                    <Typography.Paragraph type="secondary">{t(`reports.${resolution}Text`)}</Typography.Paragraph>
                    <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                        {t("reports.note")} <Typography.Text type="secondary">({t("review.optional")})</Typography.Text>
                    </Typography.Text>
                    <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} maxLength={2000} onChange={(e) => (note = e.target.value)} />
                    {canUnpublish && (
                        <Checkbox defaultChecked style={{ marginTop: 12 }} onChange={(e) => (unpublish = e.target.checked)}>
                            {t("reports.unpublish")}
                        </Checkbox>
                    )}
                </div>
            ),
            onOk: () => resolve.mutateAsync({ id: report.id, body: { resolution, note, unpublish } }).catch(() => {}),
        });
    };

    const columns = [
        {
            title: t("reports.columns.app"),
            key: "app",
            render: (_, r) => (
                <Flex vertical gap={4} align="flex-start">
                    <Link to={`/apps/${r.app_id}`}>
                        <Typography.Text strong>{r.app_name ?? "—"}</Typography.Text>
                    </Link>
                    {r.app_status && <AppStatusTag status={r.app_status} />}
                </Flex>
            ),
        },
        {
            title: t("reports.columns.reason"),
            key: "reason",
            render: (_, r) => (
                <div style={{ maxWidth: 380 }}>
                    <ReasonTag reason={r.reason} />
                    {r.details && (
                        <Typography.Paragraph style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }} ellipsis={{ rows: 3, expandable: true, symbol: t("reports.readMore") }}>
                            {r.details}
                        </Typography.Paragraph>
                    )}
                </div>
            ),
        },
        {
            title: t("reports.columns.reporter"),
            key: "reporter",
            render: (_, r) => (
                <div>
                    <Typography.Text>{r.user_email ?? t("reports.anonymous")}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {formatDateTime(r.created_at)}
                    </Typography.Text>
                </div>
            ),
        },
        status === "open"
            ? {
                  key: "actions",
                  align: "right",
                  render: (_, r) => (
                      <Flex gap={6} justify="flex-end" wrap>
                          <Button size="small" onClick={() => open(r, "dismissed")}>
                              {t("reports.dismissed")}
                          </Button>
                          <Button size="small" type="primary" danger onClick={() => open(r, "resolved")}>
                              {t("reports.resolved")}
                          </Button>
                      </Flex>
                  ),
              }
            : {
                  title: t("reports.columns.outcome"),
                  key: "outcome",
                  render: (_, r) => (
                      <div style={{ maxWidth: 300 }}>
                          <Tag color={r.resolution === "resolved" ? "green" : "default"}>{t(`reports.resolution.${r.resolution}`)}</Tag>
                          <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                              {r.resolved_by_name} · {formatDateTime(r.resolved_at)}
                          </Typography.Text>
                          {r.resolution_note && (
                              <Typography.Text type="secondary" italic ellipsis={{ tooltip: r.resolution_note }} style={{ display: "block", fontSize: 12 }}>
                                  « {r.resolution_note} »
                              </Typography.Text>
                          )}
                      </div>
                  ),
              },
    ];

    return (
        <>
            <div style={{ padding: 16 }}>
                <Segmented value={status} onChange={setStatus} options={["open", "closed"].map((s) => ({ value: s, label: t(`reports.filters.${s}`) }))} />
                <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                    {t("reports.help")}
                </Typography.Paragraph>
            </div>
            <Table
                rowKey="id"
                loading={isLoading}
                dataSource={data?.items ?? []}
                columns={columns}
                pagination={false}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t(`reports.empty.${status}`)} /> }}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}
