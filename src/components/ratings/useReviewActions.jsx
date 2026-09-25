import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { usePrompt } from "@/components/review/usePrompt";
import { useI18n } from "@/i18n";
import { useApiError } from "@/lib/useApiError";

/** Actions sur les avis : réponse du développeur, masquage / rétablissement (administrateur de la plateforme). */
export function useReviewActions() {
    const { t } = useI18n();
    const { modal, message } = App.useApp();
    const onError = useApiError();
    const prompt = usePrompt();
    const queryClient = useQueryClient();

    const run = useMutation({
        mutationFn: ({ fn }) => fn(),
        onSuccess: (_, { success, appId }) => {
            queryClient.invalidateQueries({ queryKey: ["appReviews"] });
            queryClient.invalidateQueries({ queryKey: ["userReviews"] });
            queryClient.invalidateQueries({ queryKey: ["overview"] });
            if (appId) queryClient.invalidateQueries({ queryKey: ["app", appId] });
            queryClient.invalidateQueries({ queryKey: ["apps"] });
            if (success) message.success(success);
        },
        onError,
    });
    const exec = (fn, success, appId) => run.mutateAsync({ fn, success, appId });

    return {
        pending: run.isPending,
        reply: (review) =>
            prompt({
                title: review.reply ? t("ratings.editReply") : t("ratings.replyTitle", { name: review.author_name }),
                text: t("ratings.replyHelp"),
                label: t("ratings.replyLabel"),
                placeholder: t("ratings.replyPlaceholder"),
                value: review.reply?.body ?? "",
                required: true,
                okText: t("ratings.publishReply"),
                onOk: (body) => exec(() => api.replyReview(review.id, body), t("ratings.replied")),
            }),
        deleteReply: (review) =>
            modal.confirm({
                title: t("ratings.deleteReplyConfirm"),
                okText: t("ratings.deleteReply"),
                okButtonProps: { danger: true },
                onOk: () => exec(() => api.deleteReply(review.id), t("ratings.replyDeleted")).catch(() => {}),
            }),
        hide: (review) =>
            prompt({
                title: t("ratings.hideTitle"),
                text: t("ratings.hideText"),
                label: t("review.reason"),
                okText: t("ratings.hide"),
                danger: true,
                onOk: (reason) => exec(() => api.hideReview(review.id, reason), t("ratings.hidden"), review.app_id),
            }),
        restore: (review) =>
            exec(() => api.restoreReview(review.id), review.hidden ? t("ratings.restored") : t("ratings.reportsDismissed"), review.app_id).catch(() => {}),
    };
}
