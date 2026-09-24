import { Card, Flex, Typography } from "antd";

/** Indicateur clé du tableau de bord. */
export default function StatCard({ label, value, icon, color, footer, onClick }) {
    return (
        <Card hoverable={!!onClick} onClick={onClick} styles={{ body: { padding: 20 } }} style={{ height: "100%" }}>
            <Flex justify="space-between" align="flex-start" gap={12}>
                <div>
                    <Typography.Text type="secondary">{label}</Typography.Text>
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, marginTop: 4, lineHeight: 1.15 }}>{value}</div>
                </div>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        background: `${color}1f`,
                        color,
                        fontSize: 20,
                    }}
                >
                    {icon}
                </div>
            </Flex>
            {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
        </Card>
    );
}
