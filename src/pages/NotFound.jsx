import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";

export default function NotFound() {
    const { t } = useI18n();
    const navigate = useNavigate();
    return <Result status="404" title="404" subTitle={t("common.notFound")} extra={<Button onClick={() => navigate("/")}>{t("nav.dashboard")}</Button>} />;
}
