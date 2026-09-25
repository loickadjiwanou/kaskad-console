import { useState } from "react";
import { Card, Col, Empty, Flex, Pagination, Row, Segmented, Select, Skeleton, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import RatingSummary from "@/components/ratings/RatingSummary";
import ReviewCard from "@/components/ratings/ReviewCard";
import { useReviewActions } from "@/components/ratings/useReviewActions";
import PublicLinkCard from "@/components/ratings/PublicLinkCard";
import { useI18n } from "@/i18n";

const PAGE_SIZE = 20;

/** Notes et avis d'une app : répartition des notes, avis filtrables, réponses du développeur, modération. */
export default function AppReviews({ app }) {
    const { t } = useI18n();
    const actions = useReviewActions();
    const [rating, setRating] = useState(null);
    const [replied, setReplied] = useState("all");
    const [page, setPage] = useState(1);

    const params = { rating: rating ?? undefined, replied: replied === "all" ? undefined : replied === "answered", page, limit: PAGE_SIZE };
    const { data, isLoading } = useQuery({
        queryKey: ["appReviews", app.id, params],
        queryFn: () => api.appReviews(app.id, params),
        placeholderData: (prev) => prev,
    });
    const summary = data?.rating ?? { average: app.rating_average, count: app.rating_count, distribution: app.rating_distribution };
    const pick = (fn) => (value) => {
        fn(value);
        setPage(1);
    };

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} xl={8}>
                <Flex vertical gap={16}>
                    <Card title={t("ratings.title")}>
                        <RatingSummary {...summary} picked={rating} onPick={pick(setRating)} />
                        <Typography.Paragraph type="secondary" style={{ margin: "16px 0 0", fontSize: 13 }}>
                            {t("ratings.help")}
                        </Typography.Paragraph>
                    </Card>
                    <PublicLinkCard app={app} />
                </Flex>
            </Col>
            <Col xs={24} xl={16}>
                <Card
                    title={t("ratings.reviews")}
                    extra={
                        <Flex gap={8} wrap>
                            <Segmented
                                value={replied}
                                onChange={pick(setReplied)}
                                options={["all", "unanswered", "answered"].map((v) => ({ value: v, label: t(`ratings.filters.${v}`) }))}
                            />
                            <Select
                                value={rating}
                                onChange={pick(setRating)}
                                style={{ width: 150 }}
                                options={[
                                    { value: null, label: t("ratings.allRatings") },
                                    ...[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${"★".repeat(n)} ${t("ratings.stars", { count: n })}` })),
                                ]}
                            />
                        </Flex>
                    }
                >
                    {isLoading ? (
                        <Skeleton active avatar paragraph={{ rows: 4 }} />
                    ) : data?.items.length ? (
                        <>
                            {data.items.map((r) => (
                                <ReviewCard key={r.id} review={r} actions={actions} />
                            ))}
                            {data.total > PAGE_SIZE && (
                                <Pagination align="end" current={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} showSizeChanger={false} style={{ marginTop: 16 }} />
                            )}
                        </>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={summary.count ? t("ratings.empty") : t("ratings.emptyApp")} />
                    )}
                </Card>
            </Col>
        </Row>
    );
}
