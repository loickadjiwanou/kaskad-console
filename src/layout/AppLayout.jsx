import { useState } from "react";
import { Avatar, Badge, Button, Dropdown, Flex, Grid, Layout, Menu, Segmented, Tooltip, Typography } from "antd";
import {
    AppstoreOutlined,
    BarChartOutlined,
    DashboardOutlined,
    FolderOutlined,
    HistoryOutlined,
    LogoutOutlined,
    MenuOutlined,
    MoonOutlined,
    SafetyCertificateOutlined,
    SunOutlined,
    TeamOutlined,
    UserOutlined,
    DesktopOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { useThemeMode } from "@/theme";

const { Sider, Header, Content } = Layout;

export default function AppLayout() {
    const { t, lang, setLang } = useI18n();
    const { mode, setMode } = useThemeMode();
    const { admin, isFullAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const [collapsed, setCollapsed] = useState(false);
    const mobile = !screens.lg;

    // Nombre de versions en attente (badge du menu Modération)
    const { data: overview } = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 30_000 });
    // Admin complet : demandes à valider ; éditeur : versions en attente (analyse ou soumission)
    const pending = (isFullAdmin ? overview?.reviews_pending : overview?.versions_pending_review) ?? 0;

    const items = [
        { key: "/", icon: <DashboardOutlined />, label: t("nav.dashboard") },
        { key: "/apps", icon: <AppstoreOutlined />, label: t("nav.apps") },
        {
            key: "/moderation",
            icon: <SafetyCertificateOutlined />,
            label: (
                <Flex justify="space-between" align="center">
                    {t("nav.moderation")}
                    {pending > 0 && <Badge count={pending} size="small" />}
                </Flex>
            ),
        },
        { key: "/categories", icon: <FolderOutlined />, label: t("nav.categories") },
        { key: "/stats", icon: <BarChartOutlined />, label: t("nav.stats") },
        { key: "/activity", icon: <HistoryOutlined />, label: t("nav.activity") },
        ...(isFullAdmin ? [{ key: "/team", icon: <TeamOutlined />, label: t("nav.team") }] : []),
    ];
    const selected = items.map((i) => i.key).filter((k) => (k === "/" ? location.pathname === "/" : location.pathname.startsWith(k)));

    const go = ({ key }) => {
        navigate(key);
        if (mobile) setCollapsed(true);
    };

    const userMenu = {
        items: [
            { key: "account", icon: <UserOutlined />, label: t("nav.account") },
            { type: "divider" },
            { key: "logout", icon: <LogoutOutlined />, label: t("nav.logout"), danger: true },
        ],
        onClick: async ({ key }) => {
            if (key === "account") navigate("/account");
            if (key === "logout") {
                await logout();
                navigate("/login");
            }
        },
    };

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                width={248}
                breakpoint="lg"
                collapsedWidth={mobile ? 0 : 76}
                collapsed={mobile ? collapsed : collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                style={{ position: "sticky", top: 0, height: "100vh", borderRight: "1px solid var(--ant-color-border-secondary)", zIndex: 20 }}
            >
                <Flex align="center" gap={10} style={{ height: 64, padding: collapsed ? "0 22px" : "0 20px" }}>
                    <img src="/logo.png" alt="" width={32} height={32} />
                    {!collapsed && (
                        <div style={{ lineHeight: 1.1 }}>
                            <Typography.Text strong style={{ fontSize: 17, letterSpacing: -0.3 }}>
                                Kaskad
                            </Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 0.6 }}>
                                CONSOLE
                            </Typography.Text>
                        </div>
                    )}
                </Flex>
                <Menu mode="inline" items={items} selectedKeys={selected} onClick={go} style={{ borderInlineEnd: "none", padding: "8px 10px" }} />
            </Sider>
            <Layout>
                <Header
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        padding: "0 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        borderBottom: "1px solid var(--ant-color-border-secondary)",
                    }}
                >
                    <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(!collapsed)} aria-label="menu" />
                    <div style={{ flex: 1 }} />
                    <Segmented
                        size="small"
                        value={mode}
                        onChange={setMode}
                        options={[
                            { value: "light", icon: <Tooltip title={t("theme.light")}><SunOutlined /></Tooltip> },
                            { value: "system", icon: <Tooltip title={t("theme.system")}><DesktopOutlined /></Tooltip> },
                            { value: "dark", icon: <Tooltip title={t("theme.dark")}><MoonOutlined /></Tooltip> },
                        ]}
                    />
                    <Segmented size="small" value={lang} onChange={setLang} options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }]} />
                    <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                        <Button type="text" style={{ height: 44 }}>
                            <Flex align="center" gap={10}>
                                <Avatar style={{ background: "var(--ant-color-primary)" }}>{(admin?.name || admin?.email || "?")[0].toUpperCase()}</Avatar>
                                {screens.md && (
                                    <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                                        <div style={{ fontWeight: 600 }}>{admin?.name}</div>
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            {t(`roles.${admin?.role}`)}
                                        </Typography.Text>
                                    </div>
                                )}
                            </Flex>
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{ padding: mobile ? 16 : 28 }}>
                    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
