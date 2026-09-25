import { Button, Tooltip } from "antd";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { canPublish, canSubmit, isLiveBeta, isPending, isScanning } from "./useVersionActions";

/**
 * Action principale d'une version selon son état et le rôle :
 * - validée par l'analyse : administrateur → publier (maintenant ou à une date) ; développeur → soumettre ;
 * - programmée : administrateur → publier maintenant ; développeur → annuler la programmation ;
 * - bêta en ligne : administrateur → passer en production ; développeur → demander le passage en production.
 */
export default function VersionPrimaryAction({ version: v, actions, ctx, size = "small" }) {
    const { t } = useI18n();
    const { isFullAdmin, canWrite } = useAuth();
    if (!canWrite) return null;

    if (v.status === "scheduled") {
        return (
            <>
                <Button size={size} onClick={() => actions.unschedule(v)}>
                    {t("release.unschedule")}
                </Button>
                {isFullAdmin && (
                    <Button size={size} type="primary" onClick={() => actions.publishNow(v)}>
                        {t("release.publishNow")}
                    </Button>
                )}
            </>
        );
    }

    if (isLiveBeta(v)) {
        if (isFullAdmin) {
            return (
                <>
                    {isPending(v) && (
                        <Button size={size} danger onClick={() => actions.reject(v)}>
                            {t("review.reject")}
                        </Button>
                    )}
                    <Button size={size} type="primary" onClick={() => actions.promote(v, ctx)}>
                        {isPending(v) ? t("review.approveAndPublish") : t("release.promote")}
                    </Button>
                </>
            );
        }
        return isPending(v) ? (
            <Button size={size} onClick={() => actions.withdraw(v)}>
                {t("review.withdraw")}
            </Button>
        ) : (
            <Button size={size} onClick={() => actions.submit(v, ctx)}>
                {t("release.requestPromotion")}
            </Button>
        );
    }

    if (v.status !== "draft") return null;

    // Bêta : au moins N testeurs requis pour la soumettre ou la publier
    if (canPublish(v) && v.channel === "beta" && ctx?.minTesters && ctx.testers < ctx.minTesters) {
        return (
            <Tooltip title={t("release.minTesters", { min: ctx.minTesters, count: ctx.testers })}>
                <Button size={size} disabled>
                    {isFullAdmin ? t("versions.actions.publish") : t("review.submit")}
                </Button>
            </Tooltip>
        );
    }

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
