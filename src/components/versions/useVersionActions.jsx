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

    // Publication par l'administrateur : maintenant, ou à une date (pré-remplie avec la date demandée par le développeur)
    const publish = (v, { appName, appStatus } = {}) =>
        prompt({
            title: t("versions.confirm.publish.title", { version: v.version_name, app: appName ?? "" }),
            text:
                appStatus && appStatus !== "published"
                    ? `${t("versions.confirm.publish.content")} ${t("versions.confirm.publish.appHidden")}`
                    : t("versions.confirm.publish.content"),
            withText: false,
            withDate: true,
            date: isPending(v) ? v.review.publish_at : null,
            okText: isPending(v) ? t("review.approveAndPublish") : t("versions.actions.publish"),
            onOk: (_, date) =>
                exec(
                    () => api.publishVersion(v.id, date),
                    (res) => (res.status === "scheduled" ? t("release.scheduledDone", { version: res.version_name }) : t("versions.done.publish", { version: res.version_name })),
                ),
        });

    return {
        publish,
        // Bêta en ligne → production (administrateur), ou version programmée → mise en ligne immédiate
        promote: (v, { appName } = {}) =>
            modal.confirm({
                title: t("release.promoteTitle", { version: v.version_name, app: appName ?? "" }),
                content: t("release.promoteText"),
                okText: isPending(v) ? t("review.approveAndPublish") : t("release.promote"),
                onOk: () => exec(() => api.publishVersion(v.id), (res) => t("release.promoted", { version: res.version_name })),
            }),
        publishNow: (v) =>
            modal.confirm({
                title: t("release.publishNowTitle", { version: v.version_name }),
                content: t("release.publishNowText"),
                okText: t("release.publishNow"),
                onOk: () => exec(() => api.publishVersion(v.id), (res) => t("versions.done.publish", { version: res.version_name })),
            }),
        unschedule: (v) =>
            modal.confirm({
                title: t("release.unscheduleTitle", { version: v.version_name }),
                content: t("release.unscheduleText"),
                okText: t("release.unschedule"),
                okButtonProps: { danger: true },
                onOk: () => exec(() => api.unscheduleVersion(v.id), () => t("release.unscheduled")),
            }),
        archive: (v, ctx) => confirm("archive", v, () => api.archiveVersion(v.id), ctx),
        rescan: (v, ctx) => confirm("rescan", v, () => api.rescanVersion(v.id), ctx),
        // Soumission : note et date de mise en ligne souhaitée ; bêta en ligne → demande de passage en production
        submit: (v) =>
            v.status === "published"
                ? prompt({
                      title: t("release.requestPromotionTitle", { version: v.version_name }),
                      text: t("release.requestPromotionText"),
                      label: t("review.note"),
                      placeholder: t("review.notePlaceholder"),
                      okText: t("review.submit"),
                      onOk: (note) => exec(() => api.submitVersion(v.id, note), () => t("review.submitted")),
                  })
                : prompt({
                      title: t("review.version.submitTitle", { version: v.version_name }),
                      text: t("review.version.submitText"),
                      label: t("review.note"),
                      placeholder: t("review.notePlaceholder"),
                      okText: t("review.submit"),
                      withDate: true,
                      onOk: (note, date) => exec(() => api.submitVersion(v.id, note, date), () => t("review.submitted")),
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
export const isBeta = (v) => v.channel === "beta";
/** Bêta en ligne : peut passer en production. */
export const isLiveBeta = (v) => v.status === "published" && isBeta(v);
