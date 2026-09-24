import { useMemo, useState } from "react";
import { App, Button, Card, Col, DatePicker, Flex, Row, Segmented, Select, Table, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "@/api";
import AppIcon from "./AppIcon";
import BreakdownChart from "./BreakdownChart";
import DownloadsChart from "./DownloadsChart";
import { PlatformTag } from "./Tags";
import { useI18n } from "@/i18n";
import { formatLabel, formatNumber, platformOf } from "@/lib/format";
import { PERIODS, periodRange } from "@/lib/periods";
import { useApiError } from "@/lib/useApiError";

/**
 * Statistiques détaillées : par période (prédéfinie ou personnalisée), par app et par version, export CSV.
 * `appId` fixe l'app (onglet Statistiques d'une fiche) ; sinon un sélecteur d'app est proposé.
 */
export default function StatsPanel({ appId: fixedAppId }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const [period, setPeriod] = useState("30d");
    const [custom, setCustom] = useState(null);
    const [interval, setIntervalKey] = useState(null);
    const [appId, setAppId] = useState(fixedAppId ?? null);
    const [versionId, setVersionId] = useState(null);
    const [exporting, setExporting] = useState(false);

    const range = useMemo(() => {
        if (period === "custom" && custom) {
            const days = custom[1].diff(custom[0], "day");
            return {
                from: custom[0].startOf("day").toISOString(),
                to: custom[1].endOf("day").toISOString(),
                interval: days > 180 ? "month" : days > 60 ? "week" : "day",
            };
        }
        return periodRange(period === "custom" ? "30d" : period);
    }, [period, custom]);
    const effectiveInterval = interval ?? range.interval;
    const base = { from: range.from, to: range.to };

    const { data: apps } = useQuery({ queryKey: ["apps", "all-names"], queryFn: () => api.apps({ limit: 100 }), enabled: !fixedAppId });
    const { data: versions = [] } = useQuery({ queryKey: ["versions", appId], queryFn: () => api.versions(appId), enabled: !!appId });
    const versionNames = Object.fromEntries(versions.map((v) => [v.id, v]));

    const { data: series = [] } = useQuery({
        queryKey: ["downloads", base, effectiveInterval, appId, versionId],
        queryFn: () => api.downloads({ ...base, interval: effectiveInterval, app_id: appId, version_id: versionId }),
    });
    const { data: byPlatform = [] } = useQuery({
        queryKey: ["breakdown", "platform", base, appId],
        queryFn: () => api.breakdown({ ...base, by: "platform", app_id: appId }),
    });
    const { data: byFormat = [] } = useQuery({
        queryKey: ["breakdown", "file_format", base, appId],
        queryFn: () => api.breakdown({ ...base, by: "file_format", app_id: appId }),
    });
    const byVersion = useQuery({
        queryKey: ["breakdown", "version_id", base, appId],
        queryFn: () => api.breakdown({ ...base, by: "version_id", app_id: appId }),
        enabled: !!appId,
    }).data;
    const { data: top = [] } = useQuery({ queryKey: ["top-apps", base], queryFn: () => api.topApps({ ...base, limit: 10 }), enabled: !appId });

    const total = series.reduce((n, d) => n + d.count, 0);

    const exportCsv = async () => {
        setExporting(true);
        try {
            await api.exportCsv({ ...base, app_id: appId });
            message.success(t("stats.exported"));
        } catch (e) {
            onError(e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Flex vertical gap={16}>
            <Card styles={{ body: { padding: 16 } }}>
                <Flex gap={12} wrap align="center" justify="space-between">
                    <Flex gap={12} wrap align="center">
                        <Segmented
                            value={period}
                            onChange={(p) => {
                                setPeriod(p);
                                setIntervalKey(null);
                            }}
                            options={[...Object.keys(PERIODS).map((k) => ({ value: k, label: t(`periods.${k}`) })), { value: "custom", label: t("periods.custom") }]}
                        />
                        {period === "custom" && (
                            <DatePicker.RangePicker
                                value={custom}
                                onChange={(v) => {
                                    setCustom(v);
                                    setIntervalKey(null);
                                }}
                                disabledDate={(d) => d.isAfter(dayjs(), "day")}
                                allowClear={false}
                            />
                        )}
                        <Select
                            value={effectiveInterval}
                            onChange={setIntervalKey}
                            style={{ width: 150 }}
                            options={["day", "week", "month"].map((i) => ({ value: i, label: t(`stats.interval.${i}`) }))}
                        />
                        {!fixedAppId && (
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder={t("stats.allApps")}
                                value={appId}
                                onChange={(id) => {
                                    setAppId(id ?? null);
                                    setVersionId(null);
                                }}
                                style={{ minWidth: 220 }}
                                options={(apps?.items ?? []).map((a) => ({ value: a.id, label: a.name }))}
                            />
                        )}
                        {appId && (
                            <Select
                                allowClear
                                placeholder={t("stats.allVersions")}
                                value={versionId}
                                onChange={(id) => setVersionId(id ?? null)}
                                style={{ minWidth: 220 }}
                                options={versions.map((v) => ({
                                    value: v.id,
                                    label: `v${v.version_name} · ${platformOf(v.platform)?.label} ${formatLabel(v.file_format)}`,
                                }))}
                            />
                        )}
                    </Flex>
                    <Button icon={<DownloadOutlined />} onClick={exportCsv} loading={exporting}>
                        {t("stats.exportCsv")}
                    </Button>
                </Flex>
            </Card>

            <Card
                title={t("stats.downloadsOverTime")}
                extra={
                    <Typography.Text type="secondary">
                        {t("stats.totalPeriod", { count: total, formatted: formatNumber(total) })}
                    </Typography.Text>
                }
            >
                <DownloadsChart data={series} interval={effectiveInterval} height={320} />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card title={t("stats.byPlatform")} style={{ height: "100%" }}>
                        <BreakdownChart rows={byPlatform.map((r) => ({ label: platformOf(r.key)?.label ?? r.key ?? "—", count: r.count }))} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title={t("stats.byFormat")} style={{ height: "100%" }}>
                        <BreakdownChart rows={byFormat.map((r) => ({ label: formatLabel(r.key) || "—", count: r.count }))} />
                    </Card>
                </Col>
                <Col xs={24}>
                    {appId ? (
                        <Card title={t("stats.byVersion")} styles={{ body: { padding: 0 } }}>
                            <Table
                                rowKey="key"
                                size="middle"
                                pagination={false}
                                dataSource={byVersion ?? []}
                                locale={{ emptyText: t("stats.noData") }}
                                rowClassName="kaskad-clickable-row"
                                onRow={(r) => ({ onClick: () => setVersionId(r.key === versionId ? null : r.key) })}
                                columns={[
                                    {
                                        title: t("versions.columns.version"),
                                        dataIndex: "key",
                                        render: (id) =>
                                            versionNames[id] ? (
                                                <Typography.Text strong={id === versionId}>v{versionNames[id].version_name}</Typography.Text>
                                            ) : (
                                                "—"
                                            ),
                                    },
                                    {
                                        title: t("versions.columns.platform"),
                                        dataIndex: "key",
                                        render: (id) => versionNames[id] && <PlatformTag platform={versionNames[id].platform} format={versionNames[id].file_format} />,
                                    },
                                    { title: t("stats.downloads"), dataIndex: "count", align: "right", render: formatNumber },
                                    {
                                        title: t("stats.share"),
                                        dataIndex: "count",
                                        align: "right",
                                        render: (n) => {
                                            const sum = (byVersion ?? []).reduce((s, r) => s + r.count, 0);
                                            return `${sum ? Math.round((n / sum) * 100) : 0} %`;
                                        },
                                    },
                                ]}
                            />
                        </Card>
                    ) : (
                        <Card title={t("stats.topApps")} styles={{ body: { padding: 0 } }}>
                            <Table
                                rowKey="app_id"
                                size="middle"
                                pagination={false}
                                dataSource={top}
                                locale={{ emptyText: t("stats.noData") }}
                                rowClassName="kaskad-clickable-row"
                                onRow={(r) => ({ onClick: () => setAppId(r.app_id) })}
                                columns={[
                                    { title: "#", key: "rank", width: 48, render: (_, __, i) => i + 1 },
                                    {
                                        title: t("apps.columns.app"),
                                        dataIndex: "name",
                                        render: (name, r) => (
                                            <Flex align="center" gap={10}>
                                                <AppIcon app={{ id: r.app_id, name, icon_url: apps?.items?.find((a) => a.id === r.app_id)?.icon_url }} size={28} />
                                                {name ?? "—"}
                                            </Flex>
                                        ),
                                    },
                                    { title: t("stats.downloads"), dataIndex: "downloads", align: "right", render: formatNumber },
                                ]}
                            />
                        </Card>
                    )}
                </Col>
            </Row>
        </Flex>
    );
}
