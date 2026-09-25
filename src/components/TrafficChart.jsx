import { Empty, theme } from "antd";
import dayjs from "dayjs";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { palette } from "@/theme";

/** Vues de fiche et téléchargements sur la même période (séries de /admin/stats/downloads, metric=views|downloads). */
export default function TrafficChart({ views = [], downloads = [], interval = "day", height = 320 }) {
    const { token } = theme.useToken();
    const { t, lang } = useI18n();
    if (!views.length && !downloads.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("stats.noData")} style={{ padding: 40 }} />;
    const fmt = interval === "month" ? "MMM YYYY" : lang === "fr" ? "D MMM" : "MMM D";
    const byDate = new Map();
    const add = (rows, key) => rows.forEach((d) => byDate.set(d.date, { ...(byDate.get(d.date) ?? { date: d.date, views: 0, downloads: 0 }), [key]: d.count }));
    add(views, "views");
    add(downloads, "downloads");
    const rows = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((r) => ({ ...r, label: dayjs(r.date).format(fmt) }));
    const series = [
        { key: "views", color: palette.accent.DEFAULT, label: t("stats.views") },
        { key: "downloads", color: token.colorPrimary, label: t("stats.downloads") },
    ];
    return (
        <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
                <AreaChart data={rows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                        {series.map((s) => (
                            <linearGradient key={s.key} id={`kaskadTraffic-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid vertical={false} stroke={token.colorBorderSecondary} />
                    <XAxis dataKey="label" tick={{ fill: token.colorTextSecondary, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: token.colorTextSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(v, key) => [formatNumber(v), series.find((s) => s.key === key)?.label]}
                        contentStyle={{ background: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 10 }}
                        labelStyle={{ color: token.colorText }}
                    />
                    <Legend formatter={(key) => <span style={{ color: token.colorText }}>{series.find((s) => s.key === key)?.label}</span>} />
                    {series.map((s) => (
                        <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2.5} fill={`url(#kaskadTraffic-${s.key})`} />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
