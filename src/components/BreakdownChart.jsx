import { Empty, theme } from "antd";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { palette } from "@/theme";

const COLORS = [palette.primary.DEFAULT, palette.accent.DEFAULT, palette.tertiary.DEFAULT, palette.primary.light, palette.accent.dark, palette.tertiary.light];

/** Répartition des téléchargements (barres horizontales). rows: [{ label, count }] */
export default function BreakdownChart({ rows = [], height }) {
    const { token } = theme.useToken();
    const { t } = useI18n();
    if (!rows.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("stats.noData")} />;
    return (
        <div style={{ width: "100%", height: height ?? Math.max(120, rows.length * 44) }}>
            <ResponsiveContainer>
                <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis type="category" dataKey="label" width={130} tick={{ fill: token.colorText, fontSize: 13 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        cursor={{ fill: token.colorFillTertiary }}
                        formatter={(v) => [formatNumber(v), t("stats.downloads")]}
                        contentStyle={{ background: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 10 }}
                        labelStyle={{ color: token.colorText }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22} label={{ position: "right", fill: token.colorTextSecondary, fontSize: 12 }}>
                        {rows.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
