import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import DashboardPage from "@/components/crm/DashboardPage";
import ProjectsPage from "@/components/crm/ProjectsPage";
import ClientsPage from "@/components/crm/ClientsPage";
import TeamPage from "@/components/crm/TeamPage";
import FinancePage from "@/components/crm/FinancePage";
import ContractsPage from "@/components/crm/ContractsPage";
import MarketingPage from "@/components/crm/MarketingPage";
import ChatsPage from "@/components/crm/ChatsPage";
import ProfilePage from "@/components/crm/ProfilePage";
import CompanyPage from "@/components/crm/CompanyPage";

interface Props {
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "projects", label: "Проекты", icon: "FolderKanban" },
  { id: "clients", label: "Клиенты", icon: "Users" },
  { id: "team", label: "Команда", icon: "UserSquare2" },
  { id: "finance", label: "Финансы", icon: "TrendingUp" },
  { id: "contracts", label: "Договоры", icon: "FileText" },
  { id: "marketing", label: "Маркетинг", icon: "Megaphone" },
  { id: "chats", label: "Чаты", icon: "MessageSquare" },
];

const BOTTOM_NAV = [
  { id: "profile", label: "Профиль", icon: "UserCircle" },
  { id: "company", label: "Компания", icon: "Building2" },
];

const SETTINGS_API = "https://functions.poehali.dev/1e1d2ff7-8833-4400-a59e-564cb2ac887b";

export default function CRMLayout({ onLogout }: Props) {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPosition, setUserPosition] = useState("");
  const [openProjectId, setOpenProjectId] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const r = await fetch(`${SETTINGS_API}?action=profile`);
      const data = await r.json();
      if (data.ok) {
        setUserName(data.profile.full_name || "");
        setUserPosition(data.profile.position || "");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (active === "profile") loadProfile(); }, [active, loadProfile]);

  const renderPage = () => {
    switch (active) {
      case "dashboard": return <DashboardPage />;
      case "projects": return <ProjectsPage openProjectId={openProjectId} onClearProject={() => setOpenProjectId(null)} />;
      case "clients": return <ClientsPage onOpenProject={(id: number) => { setOpenProjectId(id); setActive("projects"); }} />;
      case "team": return <TeamPage />;
      case "finance": return <FinancePage />;
      case "contracts": return <ContractsPage />;
      case "marketing": return <MarketingPage />;
      case "chats": return <ChatsPage />;
      case "profile": return <ProfilePage />;
      case "company": return <CompanyPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-snow font-body overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-snow-dark transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-snow-dark">
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight">Арена</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-ink-faint hover:text-ink transition-colors ml-auto"
          >
            <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={16} />
          </button>
        </div>

        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setOpenProjectId(null); }}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 ${
                active === item.id ? "active" : "text-ink-muted hover:text-ink hover:bg-snow"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-snow-dark py-2 px-2">
          {BOTTOM_NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-0.5 ${
                active === item.id ? "active" : "text-ink-muted hover:text-ink hover:bg-snow"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="border-t border-snow-dark p-3">
          {collapsed ? (
            <button onClick={onLogout} className="text-ink-faint hover:text-ink transition-colors mx-auto block">
              <Icon name="LogOut" size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setActive("profile")} className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shrink-0 hover:bg-ink-light transition-colors">
                <span className="text-white text-xs font-semibold">
                  {userName ? userName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?"}
                </span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{userName || "Заполните профиль"}</p>
                <p className="text-xs text-ink-faint">{userPosition || "—"}</p>
              </div>
              <button onClick={onLogout} className="text-ink-faint hover:text-ink transition-colors">
                <Icon name="LogOut" size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 h-16 bg-white/80 backdrop-blur-lg border-b border-snow-dark">
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {[...NAV_ITEMS, ...BOTTOM_NAV].find(n => n.id === active)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <button className="relative text-ink-faint hover:text-ink transition-colors">
              <Icon name="Bell" size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-ink rounded-full" />
            </button>
            <button onClick={() => { setOpenProjectId(null); setActive("clients"); }}
              className="h-9 px-5 bg-ink text-white text-sm font-medium rounded-full hover:bg-ink-light transition-colors">
              + Новый проект
            </button>
          </div>
        </div>

        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}