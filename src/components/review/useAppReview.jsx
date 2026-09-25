import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { useApiError } from "@/lib/useApiError";
import { usePrompt } from "./usePrompt";

/**
 * Actions du circuit de validation au niveau d'une app :
 * statut (changement direct par un admin complet, demande par un éditeur) et brouillon de fiche.
 */
export function useAppReview() {
    const { t } = useI18n();
    const { modal, message } = App.useApp();
    const { isFullAdmin } = useAuth();
    const onError = useApiError();
    const prompt = usePrompt();
    const queryClient = useQueryClient();

    const done = (app, text) => {
        queryClient.setQueryData(["app", app.id], app);
        queryClient.invalidateQueries({ queryKey: ["apps"] });
        queryClient.invalidateQueries({ queryKey: ["overview"] });
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        queryClient.invalidateQueries({ queryKey: ["preview", app.id] });
        if (text) message.success(text);
    };
    const run = useMutation({ mutationFn: ({ fn }) => fn(), onSuccess: (app, { success }) => done(app, success), onError });
    // Les erreurs sont affichées par onError : la promesse est toujours résolue (fermeture des boîtes de dialogue)
    const exec = (fn, success) => run.mutateAsync({ fn, success }).catch(() => {});

    return {
        pending: run.isPending,

        // Statut
        changeStatus: (app, status) => {
            if (isFullAdmin) {
                const noVersion = status === "published" && !app.latest_version_name;
                modal.confirm({
                    title: t(`apps.confirmStatus.${status}.title`),
                    content: noVersion ? t("apps.confirmStatus.noVersion") : t(`apps.confirmStatus.${status}.content`),
                    okText: t(`apps.actions.${status}`),
                    okButtonProps: { danger: status === "archived" },
                    onOk: () => exec(() => api.setAppStatus(app.id, status), t(`apps.statusChanged.${status}`)),
                });
            } else {
                prompt({
                    title: t(`review.status.requestTitle.${status}`),
                    text: t("review.status.requestText"),
                    label: t("review.note"),
                    placeholder: t("review.notePlaceholder"),
                    okText: t("review.submit"),
                    onOk: (note) => exec(() => api.requestStatus(app.id, status, note), t("review.status.requested")),
                });
            }
        },
        approveStatus: (app) =>
            modal.confirm({
                title: t(`review.status.approveTitle.${app.status_request.status}`),
                // Publication d'une app sans version téléchargeable : l'administrateur est averti
                content:
                    app.status_request.status === "published" && !app.latest_version_name
                        ? t("apps.confirmStatus.noVersion")
                        : t(`apps.confirmStatus.${app.status_request.status}.content`),
                okText: t("review.approve"),
                onOk: () => exec(() => api.approveStatusRequest(app.id), t(`apps.statusChanged.${app.status_request.status}`)),
            }),
        rejectStatus: (app) =>
            prompt({
                title: t("review.rejectTitle"),
                label: t("review.reason"),
                placeholder: t("review.reasonPlaceholder"),
                required: true,
                danger: true,
                okText: t("review.reject"),
                onOk: (reason) => exec(() => api.rejectStatusRequest(app.id, reason), t("review.rejected")),
            }),
        withdrawStatus: (app) => exec(() => api.withdrawStatusRequest(app.id)),

        // Brouillon de fiche
        submitListing: (app) =>
            prompt({
                title: t("review.listing.submitTitle"),
                text: t("review.listing.submitText"),
                label: t("review.note"),
                placeholder: t("review.notePlaceholder"),
                okText: t("review.submit"),
                onOk: (note) => exec(() => api.submitListing(app.id, note), t("review.submitted")),
            }),
        publishListing: (app) =>
            modal.confirm({
                title: t("review.listing.publishTitle"),
                content: t("review.listing.publishText"),
                okText: t("review.listing.publish"),
                onOk: () => exec(() => api.publishListing(app.id), t("review.listing.published")),
            }),
        rejectListing: (app) =>
            prompt({
                title: t("review.rejectTitle"),
                label: t("review.reason"),
                placeholder: t("review.reasonPlaceholder"),
                required: true,
                danger: true,
                okText: t("review.reject"),
                onOk: (reason) => exec(() => api.rejectListing(app.id, reason), t("review.rejected")),
            }),
        withdrawListing: (app) => exec(() => api.withdrawListingReview(app.id), t("review.withdrawn")),
        discardListing: (app) =>
            modal.confirm({
                title: t("review.listing.discardTitle"),
                content: t("review.listing.discardText"),
                okText: t("review.listing.discard"),
                okButtonProps: { danger: true },
                onOk: () => exec(() => api.discardListing(app.id), t("review.listing.discarded")),
            }),
    };
}
