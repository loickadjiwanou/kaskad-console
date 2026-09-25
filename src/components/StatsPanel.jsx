import { useMemo, useState } from "react";
import { App, Button, Card, Col, DatePicker, Flex, Progress, Row, Segmented, Select, Table, Tag, Typography } from "antd";
import { CloudDownloadOutlined, DownloadOutlined, EyeOutlined, FunnelPlotOutlined, TeamOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AppIcon from "./AppIcon";
import BreakdownChart from "./BreakdownChart";
import StatCard from "./StatCard";
import TrafficChart from "./TrafficChart";
import { PlatformTag } from "./Tags";
import { useI18n } from "@/i18n";
import { countryFlag, countryName, formatLabel, formatNumber, formatPercent, platformOf } from "@/lib/format";
import { palette } from "@/theme";
import { PERIODS, periodRange } from "@/lib/periods";
import { useApiError } from "@/lib/useApiError";

/**
 * Statistiques détaillées : par période (prédéfinie ou personnalisée), par app et par version, export CSV.
 * `appId` fixe l'app (onglet Statistiques d'une fiche) ; sinon un sélecteur d'app est proposé.
 */
export default function StatsPanel({ appId: fixedAppId }) {
    const { t } = useI18n();
    const { isFullAdmin } = useAuth();
    // Administrateur de la plateforme : toute la plateforme ou un compte développeur ; membres : leur compte (côté API)
    const [accountId, setAccountId] = useState(null);
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
    const base = { from: range.from, to: range.to, account_id: fixedAppId ? undefined : (accountId ?? undefined) };

    const { data: apps } = useQuery({
        queryKey: ["apps", "all-names", accountId],
        queryFn: () => api.apps({ limit: 200, account_id: accountId ?? undefined }),
        enabled: !fixedAppId,
    });
    const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: api.accounts, enabled: isFullAdmin && !fixedAppId });
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
    // Vues de fiche, conversion, pays, sources et versions installées
    const [countryMetric, setCountryMetric] = useState("downloads");
    const { data: viewSeries = [] } = useQuery({
        queryKey: ["views", base, effectiveInterval, appId],
        queryFn: () => api.downloads({ ...base, interval: effectiveInterval, app_id: appId, metric: "views" }),
    });
    const { data: funnel } = useQuery({ queryKey: ["funnel", base, appId], queryFn: () => api.funnel({ ...base, app_id: appId }) });
    const { data: byCountry = [] } = useQuery({
        queryKey: ["breakdown", "country", countryMetric, base, appId],
        queryFn: () => api.breakdown({ ...base, by: "country", metric: countryMetric, app_id: appId }),
    });
    const { data: bySource = [] } = useQuery({
        queryKey: ["breakdown", "source", base, appId],
        queryFn: () => api.breakdown({ ...base, by: "source", metric: "views", app_id: appId }),
    });
    const { data: installed } = useQuery({
        queryKey: ["installed", base.account_id, appId],
        queryFn: () => api.installed({ account_id: base.account_id, app_id: appId }),
    });
    const countryTotal = byCountry.reduce((n, r) => n + r.count, 0);

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
                        {isFullAdmin && !fixedAppId && (
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder={t("stats.allAccounts")}
                                value={accountId}
                                onChange={(id) => {
                                    setAccountId(id ?? null);
                                    setAppId(null);
                                    setVersionId(null);
                                }}
                                style={{ minWidth: 200 }}
                                options={(accounts ?? []).map((a) => ({ value: a.id, label: a.name }))}
                            />
                        )}
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

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <StatCard label={t("stats.views")} value={formatNumber(funnel?.views)} icon={<EyeOutlined />} color={palette.accent.DEFAULT} footer={<Typography.Text type="secondary">{t("stats.viewsHelp")}</Typography.Text>} />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <StatCard label={t("stats.visitors")} value={formatNumber(funnel?.visitors)} icon={<TeamOutlined />} color={palette.tertiary.DEFAULT} footer={<Typography.Text type="secondary">{t("stats.visitorsHelp")}</Typography.Text>} />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <StatCard label={t("stats.downloads")} value={formatNumber(funnel?.downloads)} icon={<CloudDownloadOutlined />} color={palette.primary.DEFAULT} footer={<Typography.Text type="secondary">{t("stats.totalPeriod", { count: total, formatted: formatNumber(total) })}</Typography.Text>} />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <StatCard label={t("stats.conversion")} value={formatPercent(funnel?.conversion)} icon={<FunnelPlotOutlined />} color={palette.semantic.success} footer={<Typography.Text type="secondary">{t("stats.conversionHelp")}</Typography.Text>} />
                </Col>
            </Row>

            <Card title={t("stats.trafficOverTime")}>
                <TrafficChart views={viewSeries} downloads={series} interval={effectiveInterval} height={320} />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card
                        title={t("stats.byCountry")}
                        style={{ height: "100%" }}
                        extra={
                            <Segmented
                                size="small"
                                value={countryMetric}
                                onChange={setCountryMetric}
                                options={[
                                    { value: "downloads", label: t("stats.downloads") },
                                    { value: "views", label: t("stats.views") },
                                ]}
                            />
                        }
                        styles={{ body: { padding: 0 } }}
                    >
                        <Table
                            rowKey={(r) => r.key ?? "unknown"}
                            size="middle"
                            pagination={byCountry.length > 10 ? { pageSize: 10, size: "small" } : false}
                            dataSource={byCountry}
                            locale={{ emptyText: t("stats.noData") }}
                            columns={[
                                {
                                    title: t("stats.country"),
                                    dataIndex: "key",
                                    render: (code) => (
                                        <Flex gap={8} align="center">
                                            <span style={{ fontSize: 18 }}>{countryFlag(code)}</span>
                                            {code ? countryName(code) : <Typography.Text type="secondary">{t("stats.unknownCountry")}</Typography.Text>}
                                        </Flex>
                                    ),
                                },
                                { title: t(`stats.${countryMetric}`), dataIndex: "count", align: "right", width: 140, render: formatNumber },
                                {
                                    title: t("stats.share"),
                                    dataIndex: "count",
                                    width: 200,
                                    render: (n) => <Progress percent={countryTotal ? Math.round((n / countryTotal) * 100) : 0} size="small" />,
                                },
                            ]}
                        />
                        <Typography.Paragraph type="secondary" style={{ margin: 0, padding: "12px 16px", fontSize: 12 }}>
                            {t("stats.countryHelp")}
                        </Typography.Paragraph>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title={t("stats.viewSources")} style={{ height: "100%" }}>
                        <BreakdownChart rows={bySource.map((r) => ({ label: t(`stats.sources.${r.key ?? "app"}`), count: r.count }))} />
                        <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0", fontSize: 12 }}>
                            {t("stats.viewSourcesHelp")}
                        </Typography.Paragraph>
                    </Card>
                </Col>
            </Row>

            <Card
                title={t("stats.installed")}
                extra={
                    installed && (
                        <Typography.Text type="secondary">
                            {appId && installed.total
                                ? t("stats.installedSummary", { count: installed.total, formatted: formatNumber(installed.total), percent: formatPercent(installed.on_latest / installed.total, 0) })
                                : t("stats.installedTotal", { count: installed.total, formatted: formatNumber(installed.total) })}
                        </Typography.Text>
                    )
                }
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    rowKey={(r) => (appId ? `${r.version_code}-${r.platform}` : r.app_id)}
                    size="middle"
                    pagination={false}
                    dataSource={installed?.items ?? []}
                    locale={{ emptyText: t("stats.installedEmpty") }}
                    rowClassName={appId ? undefined : "kaskad-clickable-row"}
                    onRow={(r) => (appId ? {} : { onClick: () => setAppId(r.app_id) })}
                    columns={
                        appId
                            ? [
                                  {
                                      title: t("versions.columns.version"),
                                      key: "version",
                                      render: (_, r) => (
                                          <Flex gap={8} align="center">
                                              v{r.version_name}
                                              {r.latest && <Tag color="green">{t("stats.latestVersion")}</Tag>}
                                          </Flex>
                                      ),
                                  },
                                  { title: t("versions.columns.platform"), dataIndex: "platform", render: (p) => (p ? <PlatformTag platform={p} /> : "—") },
                                  { title: t("stats.devices"), dataIndex: "count", align: "right", render: formatNumber },
                                  {
                                      title: t("stats.share"),
                                      dataIndex: "count",
                                      width: 200,
                                      render: (n) => <Progress percent={installed?.total ? Math.round((n / installed.total) * 100) : 0} size="small" />,
                                  },
                              ]
                            : [
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
                                  { title: t("stats.devices"), dataIndex: "count", align: "right", render: formatNumber },
                              ]
                    }
                />
                <Typography.Paragraph type="secondary" style={{ margin: 0, padding: "12px 16px", fontSize: 12 }}>
                    {t("stats.installedHelp")}
                </Typography.Paragraph>
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
                                    { title: t("stats.views"), dataIndex: "views", align: "right", render: formatNumber },
                                    { title: t("stats.downloads"), dataIndex: "downloads", align: "right", render: formatNumber },
                                    { title: t("stats.conversion"), dataIndex: "conversion", align: "right", render: (c) => formatPercent(c) },
                                ]}
                            />
                        </Card>
                    )}
                </Col>
            </Row>
        </Flex>
    );
}
