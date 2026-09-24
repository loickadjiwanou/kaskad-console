import StatsPanel from "@/components/StatsPanel";

export default function AppStats({ app }) {
    return <StatsPanel appId={app.id} />;
}
