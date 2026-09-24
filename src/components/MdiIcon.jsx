import Icon from "@mdi/react";
import { mdiShapeOutline } from "@mdi/js";
import { ICONS } from "./icons";

/** Icône Material Design par nom (ex. "briefcase-outline"), comme dans l'app mobile. */
export default function MdiIcon({ name, size = 0.9, color = "currentColor", style }) {
    return <Icon path={ICONS[name] ?? mdiShapeOutline} size={size} color={color} style={{ verticalAlign: "-0.2em", ...style }} />;
}
