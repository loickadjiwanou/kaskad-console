import { useState } from "react";
import { Empty, Flex, Segmented, Skeleton, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import ReviewCard from "@/components/ratings/ReviewCard";
import { useReviewActions } from "@/components/ratings/useReviewActions";
import { useI18n } from "@/i18n";

/** Avis des utilisateurs signalés ou masqués (toute la plateforme) : masquer, rétablir, conserver. */
export default function UserReviewsTab() {
    const { t } = useI18n();
    const actions = useReviewActions();
    const [filter, setFilter] = useState("reported");
    const { data, isLoading } = useQuery({
        queryKey: ["userReviews", filter],
        queryFn: () => api.moderationUserReviews(filter),
        refetchInterval: 30000,
        placeholderData: (prev) => prev,
    });

    return (
        <div style={{ padding: 16 }}>
            <Segmented value={filter} onChange={setFilter} options={["reported", "hidden", "all"].map((f) => ({ value: f, label: t(`ratings.moderation.${f}`) }))} />
            <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                {t("ratings.moderation.help")}
            </Typography.Paragraph>
            {isLoading ? (
                <Skeleton active avatar paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
            ) : data?.items.length ? (
                <Flex vertical>
                    {data.items.map((r) => (
                        <ReviewCard key={r.id} review={r} actions={actions} showApp />
                    ))}
                </Flex>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t(`ratings.moderation.empty.${filter}`)} style={{ marginTop: 24 }} />
            )}
        </div>
    );
}
