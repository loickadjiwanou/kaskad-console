import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { usePrompt } from "@/components/review/usePrompt";
import { useI18n } from "@/i18n";
import { useApiError } from "@/lib/useApiError";

/**
 * Actions sur une version, partagées entre l'onglet Versions d'une app et la file de modération :
 * soumission (éditeur), publication = validation et refus motivé (admin complet), archivage, nouvelle analyse, téléchargement.
 */
export function useVersionActions() {
    const { t } = useI18n();
    const { modal, message } = App.useApp();
    const onError = useApiError();
    const prompt = usePrompt();
    const queryClient = useQueryClient();

    const refresh = (v) => {
        queryClient.setQueryData(["version", v.id], v);
        queryClient.invalidateQueries({ queryKey: ["versions", v.app_id] });
        queryClient.invalidateQueries({ queryKey: ["app", v.app_id] });
        queryClient.invalidateQueries({ queryKey: ["moderation"] });
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        queryClient.invalidateQueries({ queryKey: ["overview"] });
        queryClient.invalidateQueries({ queryKey: ["apps"] });
    };

    const mutation = useMutation({
        mutationFn: ({ fn }) => fn(),
        onSuccess: (v, { done }) => {
            refresh(v);
            if (done) message.success(done(v));
        },
        onError,
    });
    // Les erreurs sont affichées par onError : la promesse est toujours résolue (fermeture des boîtes de dialogue)
    const exec = (fn, done) => mutation.mutateAsync({ fn, done }).catch(() => {});

    const confirm = (action, version, fn, { appName, appStatus } = {}) =>
        modal.confirm({
            title: t(`versions.confirm.${action}.title`, { version: version.version_name, app: appName ?? "" }),
            content:
                action === "publish" && appStatus && appStatus !== "published"
                    ? `${t("versions.confirm.publish.content")} ${t("versions.confirm.publish.appHidden")}`
                    : t(`versions.confirm.${action}.content`),
            okText: action === "publish" && isPending(version) ? t("review.approveAndPublish") : t(`versions.actions.${action}`),
            okButtonProps: { danger: action === "archive" },
            onOk: () => exec(fn, (v) => t(`versions.done.${action}`, { version: v.version_name })),
        });

    const download = async (version) => {
        try {
            const { url } = await api.versionDownloadUrl(version.id);
            window.open(url, "_blank", "noopener");
        } catch (e) {
            onError(e);
        }
    };

    return {
        publish: (v, ctx) => confirm("publish", v, () => api.publishVersion(v.id), ctx),
        archive: (v, ctx) => confirm("archive", v, () => api.archiveVersion(v.id), ctx),
        rescan: (v, ctx) => confirm("rescan", v, () => api.rescanVersion(v.id), ctx),
        submit: (v) =>
            prompt({
                title: t("review.version.submitTitle", { version: v.version_name }),
                text: t("review.version.submitText"),
                label: t("review.note"),
                placeholder: t("review.notePlaceholder"),
                okText: t("review.submit"),
                onOk: (note) => exec(() => api.submitVersion(v.id, note), () => t("review.submitted")),
            }),
        reject: (v) =>
            prompt({
                title: t("review.rejectTitle"),
                label: t("review.reason"),
                placeholder: t("review.reasonPlaceholder"),
                required: true,
                danger: true,
                okText: t("review.reject"),
                onOk: (reason) => exec(() => api.rejectVersion(v.id, reason), () => t("review.rejected")),
            }),
        withdraw: (v) => exec(() => api.withdrawVersion(v.id), () => t("review.withdrawn")),
        download,
        pending: mutation.isPending,
    };
}

/** Une version est publiable une fois stockée, validée par l'analyse et encore en brouillon. */
export const canPublish = (v) => v.status === "draft" && v.security_scan_status === "passed" && v.upload_status === "stored";
export const isScanning = (v) => v.security_scan_status === "pending" || v.security_scan_status === "scanning";
export const isPending = (v) => v.review?.state === "pending";
/** Soumission possible par un éditeur : publiable et pas déjà en revue. */
export const canSubmit = (v) => canPublish(v) && !isPending(v);
