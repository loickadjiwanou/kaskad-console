import { Alert, Descriptions, Empty, Flex, List, Tag, Typography } from "antd";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { ScanTag } from "./Tags";

const ENGINE_COLOR = { clean: "success", infected: "error", suspicious: "warning", error: "default" };

/** Rapport détaillé de l'analyse de sécurité d'une version. */
export default function ScanReport({ version }) {
    const { t } = useI18n();
    const report = version?.scan_report;
    if (!report) return <Empty description={t("versions.scanPending")} />;
    const apk = report.static?.apk;
    const auth = report.static?.authenticode;
    return (
        <Flex vertical gap={16}>
            <Flex gap={8} align="center" wrap>
                <ScanTag status={version.security_scan_status} />
                <Typography.Text type="secondary">
                    {t("versions.scannedAt", { date: formatDateTime(report.finished_at || report.started_at) })}
                </Typography.Text>
            </Flex>
            {report.errors?.length > 0 && (
                <Alert type="error" showIcon title={t("versions.scanErrors")} description={<List size="small" dataSource={report.errors} renderItem={(e) => <List.Item>{e}</List.Item>} />} />
            )}
            {report.warnings?.length > 0 && (
                <Alert type="warning" showIcon title={t("versions.scanWarnings")} description={<List size="small" dataSource={report.warnings} renderItem={(w) => <List.Item>{w}</List.Item>} />} />
            )}
            <Descriptions size="small" column={1} bordered title={t("versions.engines")}>
                {Object.keys(report.engines ?? {}).length === 0 && <Descriptions.Item label={t("versions.antivirus")}>{t("versions.noAntivirus")}</Descriptions.Item>}
                {Object.entries(report.engines ?? {}).map(([name, res]) => (
                    <Descriptions.Item key={name} label={name === "clamav" ? "ClamAV" : "VirusTotal"}>
                        <Tag color={ENGINE_COLOR[res.status]}>{t(`versions.engineStatus.${res.status}`)}</Tag>
                        {res.threat && <Typography.Text type="danger">{res.threat}</Typography.Text>}
                    </Descriptions.Item>
                ))}
                {report.static?.format_check && (
                    <Descriptions.Item label={t("versions.formatCheck")}>
                        <Tag color={report.static.format_check.ok ? "success" : "error"}>{report.static.format_check.expected}</Tag>
                    </Descriptions.Item>
                )}
            </Descriptions>
            {apk && (
                <Descriptions size="small" column={1} bordered title="APK">
                    <Descriptions.Item label={t("versions.apk.package")}>{apk.package}</Descriptions.Item>
                    <Descriptions.Item label={t("versions.apk.version")}>
                        {apk.version_name} ({apk.version_code})
                    </Descriptions.Item>
                    <Descriptions.Item label="SDK">
                        min {apk.min_sdk} · target {apk.target_sdk}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("versions.apk.certificate")}>
                        {(apk.cert_sha256 ?? []).map((c) => (
                            <Typography.Text key={c} code copyable style={{ fontSize: 12 }}>
                                {c}
                            </Typography.Text>
                        ))}
                        {apk.same_certificate_as && <Tag color="success">{t("versions.apk.sameCert", { version: apk.same_certificate_as })}</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label={t("versions.apk.permissions")}>
                        <Flex gap={4} wrap>
                            {(apk.permissions ?? []).map((p) => (
                                <Tag key={p} style={{ fontSize: 11 }}>
                                    {p.replace("android.permission.", "")}
                                </Tag>
                            ))}
                        </Flex>
                    </Descriptions.Item>
                </Descriptions>
            )}
            {auth && (
                <Descriptions size="small" column={1} bordered title="Authenticode">
                    <Descriptions.Item label={t("versions.auth.signed")}>{auth.signed ? t("common.yes") : t("common.no")}</Descriptions.Item>
                    {auth.verdict && <Descriptions.Item label={t("versions.auth.verdict")}>{t(`versions.auth.verdicts.${auth.verdict}`)}</Descriptions.Item>}
                    {auth.issuer && <Descriptions.Item label={t("versions.auth.issuer")}>{auth.issuer}</Descriptions.Item>}
                </Descriptions>
            )}
        </Flex>
    );
}
