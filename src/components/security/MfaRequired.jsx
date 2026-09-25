import { Button, Card, Flex, Typography } from "antd";
import { LogoutOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import MfaSetupWizard from "./MfaSetupWizard";

/** Double authentification obligatoire (administrateur de la plateforme, ou exigée par le propriétaire du compte). */
export default function MfaRequired() {
    const { t } = useI18n();
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    return (
        <Flex align="center" justify="center" style={{ minHeight: "100vh", padding: 16, background: "var(--ant-color-bg-layout)" }}>
            <Card style={{ width: "100%", maxWidth: 620 }}>
                <Flex gap={14} align="flex-start" style={{ marginBottom: 20 }}>
                    <SafetyCertificateOutlined style={{ fontSize: 32, color: "var(--ant-color-primary)", marginTop: 4 }} />
                    <div>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            {t("mfa.requiredTitle")}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            {admin?.role === "admin" ? t("mfa.requiredAdmin") : t("mfa.requiredAccount", { account: admin?.account?.name ?? "" })}
                        </Typography.Text>
                    </div>
                </Flex>
                <MfaSetupWizard onDone={() => navigate("/", { replace: true })} />
                <Flex justify="center" style={{ marginTop: 16 }}>
                    <Button
                        type="link"
                        icon={<LogoutOutlined />}
                        onClick={async () => {
                            await logout();
                            navigate("/login");
                        }}
                    >
                        {t("nav.logout")}
                    </Button>
                </Flex>
            </Card>
        </Flex>
    );
}
