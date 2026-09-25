import { App, Button, Card, Input, Space, Typography } from "antd";
import { CopyOutlined, ExportOutlined } from "@ant-design/icons";
import { useI18n } from "@/i18n";

/** Page web publique de l'app : lien partageable qui ouvre l'app dans Kaskad quand Kaskad est installé. */
export default function PublicLinkCard({ app, bordered = true }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const live = app.status === "published";
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(app.share_url);
            message.success(t("share.copied"));
        } catch {
            message.error(t("share.copyFailed"));
        }
    };
    const body = (
        <>
            <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                {live ? t("share.help") : t("share.notPublished")}
            </Typography.Paragraph>
            <Space.Compact style={{ width: "100%" }}>
                <Input readOnly value={app.share_url} disabled={!live} onFocus={(e) => e.target.select()} />
                <Button icon={<CopyOutlined />} disabled={!live} onClick={copy} aria-label={t("share.copy")} />
                <Button icon={<ExportOutlined />} disabled={!live} href={app.share_url} target="_blank" aria-label={t("share.open")} />
            </Space.Compact>
        </>
    );
    if (!bordered) return <div style={{ width: 360, maxWidth: "80vw" }}>{body}</div>;
    return (
        <Card title={t("share.title")}>
            {body}
        </Card>
    );
}
