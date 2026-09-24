import { Empty, theme } from "antd";
import dayjs from "dayjs";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";

/** Téléchargements par période (série renvoyée par /admin/stats/downloads). */
export default function DownloadsChart({ data = [], interval = "day", height = 280 }) {
    const { token } = theme.useToken();
    const { t, lang } = useI18n();
    if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("stats.noData")} style={{ padding: 40 }} />;
    const fmt = interval === "month" ? "MMM YYYY" : lang === "fr" ? "D MMM" : "MMM D";
    const rows = data.map((d) => ({ label: dayjs(d.date).format(fmt), count: d.count }));
    return (
        <div style={{ width: "100%", height }}>
            <ResponsiveContainer>
                <AreaChart data={rows} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                        <linearGradient id="kaskadArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={token.colorPrimary} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={token.colorPrimary} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={token.colorBorderSecondary} />
                    <XAxis dataKey="label" tick={{ fill: token.colorTextSecondary, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: token.colorTextSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(v) => [formatNumber(v), t("stats.downloads")]}
                        contentStyle={{ background: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 10 }}
                        labelStyle={{ color: token.colorText }}
                    />
                    <Area type="monotone" dataKey="count" stroke={token.colorPrimary} strokeWidth={2.5} fill="url(#kaskadArea)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
