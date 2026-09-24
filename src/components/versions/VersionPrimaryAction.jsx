import { Button, Tooltip } from "antd";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { canPublish, canSubmit, isPending, isScanning } from "./useVersionActions";

/**
 * Action principale d'une version selon le rôle :
 * admin complet → publier (valide la demande si soumise) ; éditeur → soumettre pour validation.
 */
export default function VersionPrimaryAction({ version: v, actions, ctx, size = "small" }) {
    const { t } = useI18n();
    const { isFullAdmin } = useAuth();
    if (v.status !== "draft") return null;

    if (!canPublish(v)) {
        return (
            <Tooltip title={isScanning(v) ? t("versions.waitScan") : t("versions.scanRejected")}>
                <Button size={size} disabled>
                    {isFullAdmin ? t("versions.actions.publish") : t("review.submit")}
                </Button>
            </Tooltip>
        );
    }
    if (isFullAdmin) {
        return (
            <>
                {isPending(v) && (
                    <Button size={size} danger onClick={() => actions.reject(v)}>
                        {t("review.reject")}
                    </Button>
                )}
                <Button size={size} type="primary" onClick={() => actions.publish(v, ctx)}>
                    {isPending(v) ? t("review.approveAndPublish") : t("versions.actions.publish")}
                </Button>
            </>
        );
    }
    if (isPending(v)) {
        return (
            <Button size={size} onClick={() => actions.withdraw(v)}>
                {t("review.withdraw")}
            </Button>
        );
    }
    return (
        <Button size={size} type="primary" disabled={!canSubmit(v)} onClick={() => actions.submit(v)}>
            {v.review?.state === "rejected" ? t("review.resubmit") : t("review.submit")}
        </Button>
    );
}
