import { App, Input, Typography } from "antd";
import { useI18n } from "@/i18n";

/**
 * Boîte de dialogue avec zone de texte : note facultative (soumission) ou motif obligatoire (refus).
 * Renvoie une fonction `prompt(options)` → promesse résolue par l'action `onOk(text)`.
 */
export function usePrompt() {
    const { modal } = App.useApp();
    const { t } = useI18n();

    return ({ title, text, label, placeholder, required = false, okText, danger = false, onOk }) => {
        let value = "";
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
                    <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
                        {label}
                        <Typography.Text type="secondary"> ({required ? t("review.reasonRequired") : t("review.optional")})</Typography.Text>
                    </Typography.Text>
                    <Input.TextArea
                        autoFocus
                        autoSize={{ minRows: 3, maxRows: 8 }}
                        maxLength={2000}
                        placeholder={placeholder}
                        onChange={(e) => {
                            value = e.target.value;
                            if (required) instance.update({ okButtonProps: { danger, disabled: !valid() } });
                        }}
                    />
                </div>
            ),
            // En cas d'erreur API, le message d'erreur est affiché par l'action et la boîte se ferme
            onOk: () => onOk(value.trim()).catch(() => {}),
        });
    };
}
