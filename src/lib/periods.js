import dayjs from "dayjs";

// Périodes prédéfinies des graphiques : intervalle adapté à la durée
export const PERIODS = {
    "7d": { days: 7, interval: "day" },
    "30d": { days: 30, interval: "day" },
    "90d": { days: 90, interval: "week" },
    "12m": { days: 365, interval: "month" },
};

export function periodRange(key) {
    const p = PERIODS[key];
    return { from: dayjs().subtract(p.days, "day").startOf("day").toISOString(), to: dayjs().toISOString(), interval: p.interval };
}
