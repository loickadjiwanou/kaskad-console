// Effet d'onde Material Design (« ripple ») : cercle qui s'étend depuis le point de pression.
// Un seul écouteur global couvre boutons, menus, onglets, listes et pagination
// (les filtres segmentés gardent le style normal de la console, sans onde).

export const RIPPLE_HOSTS = [
    ".ant-btn",
    ".ant-menu-item",
    ".ant-menu-submenu-title",
    ".ant-tabs-tab",
    ".ant-dropdown-menu-item",
    ".ant-select-item-option",
    ".ant-pagination-item",
    ".ant-pagination-prev",
    ".ant-pagination-next",
    ".ant-card-hoverable",
    ".ant-picker-cell-inner",
    ".md-ripple-host",
].join(",");

function release(ripple) {
    if (ripple.dataset.released) return;
    ripple.dataset.released = "1";
    // Laisse l'onde atteindre sa taille avant de disparaître
    const elapsed = performance.now() - Number(ripple.dataset.start);
    setTimeout(() => {
        ripple.classList.add("md-ripple-out");
        setTimeout(() => ripple.remove(), 300);
    }, Math.max(0, 180 - elapsed));
}

function onPointerDown(event) {
    if (event.button !== 0) return;
    const host = event.target.closest?.(RIPPLE_HOSTS);
    if (!host || host.matches(":disabled, .ant-btn-disabled, .ant-menu-item-disabled, .ant-select-item-option-disabled")) return;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Rayon jusqu'au coin le plus éloigné
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const ripple = document.createElement("span");
    ripple.className = "md-ripple";
    ripple.style.cssText = `left:${x - radius}px;top:${y - radius}px;width:${radius * 2}px;height:${radius * 2}px`;
    ripple.dataset.start = String(performance.now());
    host.appendChild(ripple);
    const up = () => {
        release(ripple);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
}

/** Active l'effet d'onde ; renvoie la fonction de désactivation. */
export function installRipple() {
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
}
