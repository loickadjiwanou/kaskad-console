import { App, Button, Flex, Typography } from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { useI18n } from "@/i18n";

/** Codes de secours affichés une seule fois : copie et téléchargement (.txt). */
export default function RecoveryCodes({ codes = [], email }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const text = `Kaskad Console — ${t("mfa.recoveryTitle")}${email ? ` (${email})` : ""}\n\n${codes.join("\n")}\n`;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            message.success(t("mfa.codesCopied"));
        } catch {
            message.error(t("share.copyFailed"));
        }
    };
    const download = () => {
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: "kaskad-recovery-codes.txt" });
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <div>
            <div className="kaskad-recovery-codes">
                {codes.map((c) => (
                    <Typography.Text key={c} code copyable={false}>
                        {c}
                    </Typography.Text>
                ))}
            </div>
            <Flex gap={8} wrap style={{ marginTop: 12 }}>
                <Button icon={<CopyOutlined />} onClick={copy}>
                    {t("mfa.copyCodes")}
                </Button>
                <Button icon={<DownloadOutlined />} onClick={download}>
                    {t("mfa.downloadCodes")}
                </Button>
            </Flex>
        </div>
    );
}
