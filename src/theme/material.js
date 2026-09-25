// Material Design 3 : rôles de couleur générés à partir du bleu Kaskad (schéma « Fidelity » :
// la couleur de marque est conservée) et thème Ant Design correspondant (formes, typographie, états).
import { argbFromHex, hexFromArgb, Hct, MaterialDynamicColors as D, SchemeFidelity, SchemeTonalSpot } from "@material/material-color-utilities";
import palette from "./palette";
import { alpha, mix } from "./colors";

const SOURCE = palette.primary.DEFAULT;

const ROLES = [
    "primary",
    "onPrimary",
    "primaryContainer",
    "onPrimaryContainer",
    "secondary",
    "onSecondary",
    "secondaryContainer",
    "onSecondaryContainer",
    "tertiary",
    "tertiaryContainer",
    "onTertiaryContainer",
    "error",
    "onError",
    "errorContainer",
    "onErrorContainer",
    "surface",
    "surfaceDim",
    "surfaceBright",
    "surfaceContainerLowest",
    "surfaceContainerLow",
    "surfaceContainer",
    "surfaceContainerHigh",
    "surfaceContainerHighest",
    "onSurface",
    "onSurfaceVariant",
    "outline",
    "outlineVariant",
    "inverseSurface",
    "inverseOnSurface",
    "inversePrimary",
    "scrim",
    "shadow",
];

const cache = {};

/** Rôles de couleur Material 3 pour « light », « dark » ou « black » (sombre sur noir pur). */
export function materialColors(scheme) {
    if (cache[scheme]) return cache[scheme];
    const dark = scheme !== "light";
    const source = Hct.fromInt(argbFromHex(SOURCE));
    const s = new SchemeFidelity(source, dark, 0);
    const c = Object.fromEntries(ROLES.map((r) => [r, hexFromArgb(D[r].getArgb(s))]));
    // Rôles secondaires du schéma tonal de référence : indicateurs de sélection plus doux que ceux du schéma « Fidelity »
    const tonal = new SchemeTonalSpot(source, dark, 0);
    for (const r of ["secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer"]) c[r] = hexFromArgb(D[r].getArgb(tonal));
    if (scheme === "black") {
        // Surfaces sur fond noir : tons les plus bas de la palette neutre (légèrement teintés)
        const n = (tone) => hexFromArgb(s.neutralPalette.tone(tone));
        Object.assign(c, {
            surface: "#000000",
            surfaceDim: "#000000",
            surfaceContainerLowest: "#000000",
            surfaceContainerLow: n(4),
            surfaceContainer: n(6),
            surfaceContainerHigh: n(10),
            surfaceContainerHighest: n(17),
            outlineVariant: n(22),
        });
    }
    // Couleurs de statut (non définies par Material 3) harmonisées avec la luminosité du schéma
    c.success = dark ? "#7FD89A" : "#1B7F3B";
    c.successContainer = dark ? "#0F3D1E" : "#C8F2D2";
    c.warning = dark ? "#FFB95C" : "#8A5100";
    c.warningContainer = dark ? "#4A2A00" : "#FFDDB4";
    // Calques d'état (hover 8 %, focus/pression 10 %)
    c.stateHover = alpha(c.onSurface, 0.08);
    c.statePressed = alpha(c.onSurface, 0.1);
    cache[scheme] = c;
    return c;
}

// Élévations Material 3 (ombres des niveaux 1 à 3)
export const ELEVATION = {
    1: "0 1px 2px 0 rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)",
    2: "0 1px 2px 0 rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)",
    3: "0 1px 3px 0 rgba(0,0,0,.30), 0 4px 8px 3px rgba(0,0,0,.15)",
};

/** Thème Ant Design « Material Design 3 ». */
export function materialAntdTheme(scheme, algorithm) {
    const c = materialColors(scheme);
    const hover = c.stateHover;
    const primaryHover = mix(c.primary, c.onPrimary, 0.08);
    return {
        algorithm,
        token: {
            colorPrimary: c.primary,
            colorPrimaryHover: c.primary,
            colorPrimaryActive: c.primary,
            colorPrimaryBg: c.secondaryContainer,
            colorPrimaryBgHover: c.secondaryContainer,
            colorLink: c.primary,
            colorLinkHover: c.primary,
            colorInfo: c.primary,
            colorSuccess: c.success,
            colorWarning: c.warning,
            colorError: c.error,
            colorErrorBg: c.errorContainer,
            colorBgBase: c.surface,
            colorBgLayout: c.surface,
            colorBgContainer: c.surfaceContainerLow,
            colorBgElevated: c.surfaceContainer,
            colorBgSpotlight: c.inverseSurface,
            colorBgMask: alpha(c.scrim, 0.32),
            colorTextBase: c.onSurface,
            colorText: c.onSurface,
            colorTextSecondary: c.onSurfaceVariant,
            colorTextTertiary: alpha(c.onSurfaceVariant, 0.8),
            colorTextLightSolid: c.onPrimary,
            colorBorder: c.outline,
            colorBorderSecondary: c.outlineVariant,
            colorSplit: c.outlineVariant,
            colorFillSecondary: hover,
            colorFillTertiary: alpha(c.onSurface, 0.05),
            colorFillQuaternary: alpha(c.onSurface, 0.03),
            controlItemBgHover: hover,
            controlItemBgActive: c.secondaryContainer,
            controlItemBgActiveHover: c.secondaryContainer,
            controlOutline: alpha(c.primary, 0.24),
            fontFamily: "Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif",
            fontSize: 14,
            fontWeightStrong: 500,
            borderRadius: 4, // coins « extra-small » (champs, menus)
            borderRadiusSM: 4,
            borderRadiusLG: 12, // cartes
            borderRadiusXS: 2,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            boxShadow: ELEVATION[2],
            boxShadowSecondary: ELEVATION[2],
            boxShadowTertiary: ELEVATION[1],
            motionDurationMid: "0.2s",
            motionEaseInOut: "cubic-bezier(0.2, 0, 0, 1)", // courbe « emphasized » simplifiée
        },
        components: {
            Layout: { siderBg: c.surfaceContainerLow, headerBg: c.surface, bodyBg: c.surface, headerHeight: 64 },
            Menu: {
                itemBg: "transparent",
                subMenuItemBg: "transparent",
                itemHeight: 56,
                itemBorderRadius: 28,
                itemMarginInline: 12,
                itemColor: c.onSurfaceVariant,
                itemHoverColor: c.onSurface,
                itemHoverBg: hover,
                itemSelectedBg: c.secondaryContainer,
                itemSelectedColor: c.onSecondaryContainer,
                itemActiveBg: c.statePressed,
                iconSize: 20,
                collapsedIconSize: 20,
                iconMarginInlineEnd: 12,
                fontSize: 14,
            },
            Button: {
                borderRadius: 20,
                borderRadiusSM: 16,
                borderRadiusLG: 24,
                fontWeight: 500,
                paddingInline: 24,
                paddingInlineSM: 16,
                primaryShadow: "none",
                defaultShadow: "none",
                dangerShadow: "none",
                colorPrimaryHover: primaryHover,
                colorPrimaryActive: mix(c.primary, c.onPrimary, 0.1),
                defaultColor: c.primary,
                defaultBorderColor: c.outline,
                defaultBg: "transparent",
                defaultHoverBg: alpha(c.primary, 0.08),
                defaultHoverColor: c.primary,
                defaultHoverBorderColor: c.outline,
                defaultActiveBg: alpha(c.primary, 0.1),
                defaultActiveColor: c.primary,
                defaultActiveBorderColor: c.outline,
                textTextColor: c.primary,
                textHoverBg: alpha(c.primary, 0.08),
                textTextHoverColor: c.primary,
                textTextActiveColor: c.primary,
                colorBgTextActive: alpha(c.primary, 0.1),
            },
            Card: {
                headerFontSize: 16,
                headerHeight: 56,
                colorBorderSecondary: "transparent",
                boxShadowTertiary: ELEVATION[1],
            },
            Table: {
                headerBg: "transparent",
                headerColor: c.onSurfaceVariant,
                headerSplitColor: "transparent",
                rowHoverBg: hover,
                rowSelectedBg: c.secondaryContainer,
                borderColor: c.outlineVariant,
                headerBorderRadius: 0,
            },
            Tabs: {
                inkBarColor: c.primary,
                itemColor: c.onSurfaceVariant,
                itemHoverColor: c.onSurface,
                itemSelectedColor: c.primary,
                itemActiveColor: c.primary,
                titleFontSize: 14,
                horizontalItemPadding: "14px 16px",
                horizontalItemGutter: 0,
            },
            // Filtres segmentés : même apparence que le mode normal de la console, aux couleurs Material
            Segmented: {
                trackBg: c.surfaceContainerHigh,
                trackPadding: 2,
                itemColor: c.onSurfaceVariant,
                itemHoverColor: c.onSurface,
                itemHoverBg: hover,
                itemActiveBg: c.statePressed,
                itemSelectedBg: scheme === "light" ? c.surfaceContainerLowest : c.surfaceBright,
                itemSelectedColor: c.onSurface,
                borderRadius: 10,
                borderRadiusSM: 8,
                borderRadiusXS: 6,
            },
            Input: { activeShadow: `0 0 0 1px ${c.primary}`, hoverBorderColor: c.onSurface, activeBorderColor: c.primary, paddingBlock: 8 },
            InputNumber: { activeShadow: `0 0 0 1px ${c.primary}`, hoverBorderColor: c.onSurface, activeBorderColor: c.primary },
            Select: {
                activeOutlineColor: c.primary,
                hoverBorderColor: c.onSurface,
                activeBorderColor: c.primary,
                optionSelectedBg: c.secondaryContainer,
                optionSelectedColor: c.onSecondaryContainer,
                optionActiveBg: hover,
                optionHeight: 40,
                optionPadding: "10px 12px",
                multipleItemBg: "transparent",
                multipleItemBorderColor: c.outline,
            },
            DatePicker: { activeShadow: `0 0 0 1px ${c.primary}`, hoverBorderColor: c.onSurface, activeBorderColor: c.primary, cellActiveWithRangeBg: c.secondaryContainer },
            Dropdown: { controlItemBgHover: hover, paddingBlock: 10 },
            Modal: {
                contentBg: c.surfaceContainerHigh,
                headerBg: c.surfaceContainerHigh,
                footerBg: "transparent",
                titleFontSize: 24,
                titleLineHeight: 1.33,
                borderRadiusLG: 28,
            },
            Drawer: { colorBgElevated: c.surfaceContainerLow },
            Popover: { colorBgElevated: c.surfaceContainerHigh, borderRadiusLG: 12 },
            Tooltip: { colorBgSpotlight: c.inverseSurface, colorTextLightSolid: c.inverseOnSurface, borderRadius: 4 },
            Message: { contentBg: c.inverseSurface, colorText: c.inverseOnSurface, borderRadiusLG: 4, contentPadding: "14px 16px" },
            Switch: {
                trackHeight: 32,
                trackMinWidth: 52,
                handleSize: 24,
                trackPadding: 4,
                trackHeightSM: 24,
                trackMinWidthSM: 40,
                handleSizeSM: 16,
                colorPrimary: c.primary,
                colorPrimaryHover: c.primary,
                handleBg: c.onPrimary,
            },
            Checkbox: { borderRadiusSM: 2, controlInteractiveSize: 18, colorBorder: c.onSurfaceVariant },
            Radio: { radioSize: 20, dotSize: 10, colorBorder: c.onSurfaceVariant },
            Tag: { defaultBg: "transparent", defaultColor: c.onSurfaceVariant, borderRadiusSM: 8 },
            Alert: { withDescriptionPadding: "16px 20px" },
            Progress: { defaultColor: c.primary, remainingColor: c.secondaryContainer, lineBorderRadius: 2 },
            Pagination: { itemActiveBg: c.secondaryContainer, itemSize: 40, borderRadius: 20 },
            Descriptions: { labelBg: c.surfaceContainer, labelColor: c.onSurfaceVariant },
            Badge: { colorError: c.error },
            Skeleton: { gradientFromColor: c.surfaceContainerHigh, gradientToColor: c.surfaceContainerHighest },
            Typography: { titleMarginBottom: "0.4em" },
        },
    };
}
