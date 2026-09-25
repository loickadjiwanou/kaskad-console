import { Form, Input, Tabs, Tag } from "antd";
import { useI18n } from "@/i18n";

export const LANGS = ["fr", "en"];

/** Notes de version en français et en anglais (champs `changelog_fr` / `changelog_en`). */
export default function LocalizedChangelog({ baseLang = "fr" }) {
    const { t } = useI18n();
    return (
        <Tabs
            size="small"
            items={LANGS.map((l) => ({
                key: l,
                forceRender: true,
                label: (
                    <span>
                        {t(`release.lang.${l}`)}
                        {l === baseLang && (
                            <Tag style={{ marginInlineStart: 6 }} bordered={false}>
                                {t("release.primary")}
                            </Tag>
                        )}
                    </span>
                ),
                children: (
                    <Form.Item name={`changelog_${l}`} style={{ marginBottom: 0 }} extra={l === baseLang ? null : t("release.translationHelp")}>
                        <Input.TextArea autoSize={{ minRows: 4, maxRows: 14 }} maxLength={20000} showCount placeholder={t("versions.upload.changelogPlaceholder")} />
                    </Form.Item>
                ),
            }))}
        />
    );
}

/** Valeurs du formulaire à partir d'une version (texte principal + traductions). */
export function changelogToForm(v) {
    const base = v.changelog_lang || "fr";
    return Object.fromEntries(LANGS.map((l) => [`changelog_${l}`, l === base ? v.changelog || "" : v.changelog_translations?.[l] || ""]));
}

/** Corps de mise à jour d'une version à partir du formulaire. */
export function changelogFromForm(values, base = "fr") {
    const other = base === "fr" ? "en" : "fr";
    return { changelog: values[`changelog_${base}`] || "", changelog_translations: { [other]: values[`changelog_${other}`] || "" } };
}
