import { useEffect, useState } from "react";
import { Alert, App, Button, Card, Empty, Flex, Form, Input, Modal, Select, Skeleton, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import MdiIcon from "@/components/MdiIcon";
import PageHeader from "@/components/PageHeader";
import { CATEGORY_ICONS } from "@/components/icons";
import { useI18n } from "@/i18n";
import { useApiError } from "@/lib/useApiError";

function IconPicker({ value, onChange }) {
    return (
        <Flex wrap gap={6}>
            {CATEGORY_ICONS.map((name) => (
                <Tooltip key={name} title={name}>
                    <Button
                        type={value === name ? "primary" : "default"}
                        icon={<MdiIcon name={name} size={0.8} />}
                        onClick={() => onChange(name)}
                        aria-label={name}
                        aria-pressed={value === name}
                    />
                </Tooltip>
            ))}
        </Flex>
    );
}

function CategoryRow({ category, onEdit, onDelete, onReassign }) {
    const { t } = useI18n();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                position: "relative",
                zIndex: isDragging ? 2 : undefined,
                boxShadow: isDragging ? "0 10px 30px -10px rgba(0,0,0,.35)" : undefined,
                background: "var(--ant-color-bg-container)",
                borderBottom: "1px solid var(--ant-color-border-secondary)",
                padding: "12px 16px",
            }}
        >
            <Flex align="center" gap={14}>
                <Button type="text" icon={<HolderOutlined />} {...attributes} {...listeners} style={{ cursor: "grab" }} aria-label={t("categories.reorder")} />
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        background: "var(--ant-color-primary-bg)",
                        color: "var(--ant-color-primary)",
                    }}
                >
                    <MdiIcon name={category.icon} size={0.9} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong>{category.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {t("categories.appsCount", { count: category.apps_count })}
                    </Typography.Text>
                </div>
                <Flex gap={4}>
                    <Tooltip title={t("categories.reassign")}>
                        <Button type="text" icon={<SwapOutlined />} disabled={!category.apps_count} onClick={onReassign} aria-label={t("categories.reassign")} />
                    </Tooltip>
                    <Tooltip title={t("common.edit")}>
                        <Button type="text" icon={<EditOutlined />} onClick={onEdit} aria-label={t("common.edit")} />
                    </Tooltip>
                    <Tooltip title={t("common.delete")}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={onDelete} aria-label={t("common.delete")} />
                    </Tooltip>
                </Flex>
            </Flex>
        </div>
    );
}

/** Création / modification d'une catégorie (nom + icône). */
function CategoryModal({ category, open, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) form.setFieldsValue(category ? { name: category.name, icon: category.icon } : { name: "", icon: "shape-outline" });
    }, [open, category, form]);

    const save = useMutation({
        mutationFn: (values) => (category ? api.updateCategory(category.id, values) : api.createCategory(values)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            message.success(category ? t("common.saved") : t("categories.created"));
            onClose();
        },
        onError,
    });

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={category ? t("categories.edit") : t("categories.new")}
            okText={category ? t("common.save") : t("common.create")}
            onOk={() => form.submit()}
            confirmLoading={save.isPending}
            destroyOnHidden
            width={560}
        >
            <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} style={{ marginTop: 16 }}>
                <Form.Item name="name" label={t("categories.fields.name")} rules={[{ required: true, whitespace: true }]}>
                    <Input maxLength={80} autoFocus />
                </Form.Item>
                <Form.Item name="icon" label={t("categories.fields.icon")}>
                    <IconPicker />
                </Form.Item>
            </Form>
        </Modal>
    );
}

/** Suppression (avec réaffectation obligatoire si utilisée) ou simple réaffectation des apps. */
function MoveModal({ category, mode, categories, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [target, setTarget] = useState(null);
    useEffect(() => setTarget(null), [category]);

    const needsTarget = mode === "reassign" || category?.apps_count > 0;
    const run = useMutation({
        mutationFn: () => (mode === "delete" ? api.deleteCategory(category.id, target) : api.reassignCategory(category.id, target)),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["apps"] });
            message.success(mode === "delete" ? t("categories.deleted") : t("categories.moved", { count: res?.moved ?? 0 }));
            onClose();
        },
        onError,
    });

    return (
        <Modal
            open={!!category}
            onCancel={onClose}
            title={category && t(mode === "delete" ? "categories.deleteTitle" : "categories.reassignTitle", { name: category.name })}
            okText={mode === "delete" ? t("common.delete") : t("categories.reassign")}
            okButtonProps={{ danger: mode === "delete", disabled: needsTarget && !target }}
            onOk={() => run.mutate()}
            confirmLoading={run.isPending}
            destroyOnHidden
        >
            {category && (
                <Flex vertical gap={16} style={{ marginTop: 12 }}>
                    {mode === "delete" && (
                        <Typography.Paragraph style={{ margin: 0 }}>
                            {category.apps_count ? t("categories.deleteInUse", { count: category.apps_count }) : t("categories.deleteConfirm")}
                        </Typography.Paragraph>
                    )}
                    {mode === "reassign" && (
                        <Typography.Paragraph style={{ margin: 0 }}>{t("categories.reassignText", { count: category.apps_count })}</Typography.Paragraph>
                    )}
                    {needsTarget && (
                        <Select
                            placeholder={t("categories.target")}
                            value={target}
                            onChange={setTarget}
                            options={categories
                                .filter((c) => c.id !== category.id)
                                .map((c) => ({
                                    value: c.id,
                                    label: (
                                        <Flex align="center" gap={8}>
                                            <MdiIcon name={c.icon} size={0.7} /> {c.name}
                                        </Flex>
                                    ),
                                }))}
                        />
                    )}
                </Flex>
            )}
        </Modal>
    );
}

export default function Categories() {
    const { t } = useI18n();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(null); // null fermé, {} nouvelle, catégorie sinon
    const [moving, setMoving] = useState(null); // { category, mode }
    const { data: categories, isLoading } = useQuery({ queryKey: ["categories"], queryFn: api.categories });
    const [order, setOrder] = useState([]);
    useEffect(() => setOrder(categories ?? []), [categories]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const reorder = useMutation({
        mutationFn: (ids) => api.reorderCategories(ids),
        onSuccess: (list) => queryClient.setQueryData(["categories"], list),
        onError: (e) => {
            setOrder(categories ?? []);
            onError(e);
        },
    });

    const onDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const ids = order.map((c) => c.id);
        const next = arrayMove(order, ids.indexOf(active.id), ids.indexOf(over.id));
        setOrder(next);
        reorder.mutate(next.map((c) => c.id));
    };

    return (
        <>
            <PageHeader
                title={t("categories.title")}
                subtitle={t("categories.subtitle")}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
                        {t("categories.new")}
                    </Button>
                }
            />
            <Alert type="info" showIcon title={t("categories.orderHelp")} style={{ marginBottom: 16 }} />
            <Card styles={{ body: { padding: 0, overflow: "hidden" } }}>
                {isLoading ? (
                    <Skeleton active style={{ padding: 24 }} />
                ) : order.length ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
                        <SortableContext items={order.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                            {order.map((c) => (
                                <CategoryRow
                                    key={c.id}
                                    category={c}
                                    onEdit={() => setEditing(c)}
                                    onDelete={() => setMoving({ category: c, mode: "delete" })}
                                    onReassign={() => setMoving({ category: c, mode: "reassign" })}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Empty style={{ padding: 40 }} description={t("categories.empty")} />
                )}
            </Card>
            <CategoryModal open={!!editing} category={editing?.id ? editing : null} onClose={() => setEditing(null)} />
            <MoveModal category={moving?.category} mode={moving?.mode} categories={order} onClose={() => setMoving(null)} />
        </>
    );
}
