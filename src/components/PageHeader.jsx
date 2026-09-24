import { Flex, Typography } from "antd";

export default function PageHeader({ title, subtitle, extra, icon }) {
    return (
        <Flex align="center" justify="space-between" wrap gap={16} style={{ marginBottom: 24 }}>
            <Flex align="center" gap={14} style={{ minWidth: 0 }}>
                {icon}
                <div style={{ minWidth: 0 }}>
                    <Typography.Title level={3} style={{ margin: 0, letterSpacing: -0.4 }} ellipsis>
                        {title}
                    </Typography.Title>
                    {subtitle && (
                        <Typography.Text type="secondary" style={{ display: "block", marginTop: 2 }}>
                            {subtitle}
                        </Typography.Text>
                    )}
                </div>
            </Flex>
            {extra && (
                <Flex gap={8} wrap>
                    {extra}
                </Flex>
            )}
        </Flex>
    );
}
