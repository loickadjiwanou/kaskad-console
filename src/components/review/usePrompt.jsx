import { App, DatePicker, Input, Typography } from "antd";
import dayjs from "dayjs";
import { useI18n } from "@/i18n";

/**
 * Boîte de dialogue de saisie : note facultative (soumission), motif obligatoire (refus),
 * et, en option, une date de publication (`withDate`, laissée vide = publication immédiate).
 * `value` : texte initial (modification), `extra` : contenu ajouté sous le texte.
 * Renvoie une fonction `prompt(options)` ; l'action reçoit `onOk(text, date)` (date ISO ou null).
 */
export function usePrompt() {
    const { modal } = App.useApp();
    const { t } = useI18n();

    return ({ title, text, label, placeholder, required = false, okText, danger = false, withText = true, withDate = false, date: initialDate, value: initialValue = "", extra, onOk }) => {
        let value = initialValue;
        let date = initialDate ? dayjs(initialDate) : null;
        const valid = () => !required || value.trim().length >= 3;
        const instance = modal.confirm({
            title,
            icon: null,
            width: 520,
            okText,
            // Motif obligatoire : bouton de validation actif à partir de 3 caractères
            okButtonProps: { danger, disabled: !valid() },
            content: (
                <div style={{ marginTop: 8 }}>
                    {text && <Typography.Paragraph type="secondary">{text}</Typography.Paragraph>}
                    {withText && (
                        <>
                            <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                                {label}
                                <Typography.Text type="secondary"> ({required ? t("review.reasonRequired") : t("review.optional")})</Typography.Text>
                            </Typography.Text>
                            <Input.TextArea
                                autoFocus
                                autoSize={{ minRows: 3, maxRows: 8 }}
                                maxLength={2000}
                                defaultValue={initialValue}
                                placeholder={placeholder}
                                onChange={(e) => {
                                    value = e.target.value;
                                    if (required) instance.update({ okButtonProps: { danger, disabled: !valid() } });
                                }}
                            />
                        </>
                    )}
                    {extra}
                    {withDate && (
                        <div style={{ marginTop: withText ? 16 : 0 }}>
                            <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                                {t("release.publishAt")}
                                <Typography.Text type="secondary"> ({t("release.publishAtHelp")})</Typography.Text>
                            </Typography.Text>
                            <DatePicker
                                showTime={{ format: "HH:mm", minuteStep: 5 }}
                                format="DD/MM/YYYY HH:mm"
                                defaultValue={date}
                                style={{ width: "100%" }}
                                placeholder={t("release.now")}
                                disabledDate={(d) => d.isBefore(dayjs(), "day")}
                                onChange={(d) => (date = d)}
                            />
                        </div>
                    )}
                </div>
            ),
            // En cas d'erreur API, le message d'erreur est affiché par l'action et la boîte se ferme
            onOk: () => onOk(value.trim(), date && date.isAfter(dayjs()) ? date.toISOString() : null).catch(() => {}),
        });
    };
}
