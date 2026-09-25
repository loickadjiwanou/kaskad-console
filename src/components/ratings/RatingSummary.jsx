import { Flex, Progress, Rate, Typography } from "antd";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";

/** Note moyenne (étoiles) : « 4,3 ★ » compact, pour les listes. */
export function RatingValue({ average, count }) {
    const { t, lang } = useI18n();
    if (!count) return <Typography.Text type="secondary">—</Typography.Text>;
    return (
        <Typography.Text style={{ whiteSpace: "nowrap" }}>
            <span style={{ color: "#fadb14" }}>★</span> {average.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {" "}
                · {t("ratings.count", { count, formatted: formatNumber(count) })}
            </Typography.Text>
        </Typography.Text>
    );
}

/** Note d'une app : moyenne, étoiles, nombre de notes et répartition de 5 à 1 étoiles. */
export default function RatingSummary({ average, count, distribution, onPick, picked }) {
    const { t, lang } = useI18n();
    const max = Math.max(1, ...Object.values(distribution ?? {}));
    return (
        <Flex gap={24} align="center" wrap>
            <div style={{ textAlign: "center", minWidth: 110 }}>
                <Typography.Title level={1} style={{ margin: 0, lineHeight: 1.1 }}>
                    {count ? average.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
                </Typography.Title>
                <Rate disabled allowHalf value={count ? Math.round(average * 2) / 2 : 0} style={{ fontSize: 14 }} />
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 2 }}>
                    {count ? t("ratings.count", { count, formatted: formatNumber(count) }) : t("ratings.noRatings")}
                </Typography.Text>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
                {[5, 4, 3, 2, 1].map((n) => {
                    const value = distribution?.[String(n)] ?? 0;
                    return (
                        <Flex
                            key={n}
                            align="center"
                            gap={10}
                            onClick={onPick ? () => onPick(picked === n ? null : n) : undefined}
                            style={{ cursor: onPick ? "pointer" : undefined, opacity: picked && picked !== n ? 0.45 : 1, transition: "opacity .2s" }}
                        >
                            <Typography.Text type="secondary" style={{ width: 12, fontSize: 12 }}>
                                {n}
                            </Typography.Text>
                            <Progress percent={(value / max) * 100} showInfo={false} size="small" strokeColor="#fadb14" style={{ flex: 1, margin: 0 }} />
                            <Typography.Text type="secondary" style={{ width: 36, fontSize: 12, textAlign: "right" }}>
                                {formatNumber(value)}
                            </Typography.Text>
                        </Flex>
                    );
                })}
            </div>
        </Flex>
    );
}
