import { useState } from "react";
import Icon from "@/components/ui/icon";
import DashboardPage from "@/components/crm/DashboardPage";
import ProjectsPage from "@/components/crm/ProjectsPage";
import ClientsPage from "@/components/crm/ClientsPage";
import TeamPage from "@/components/crm/TeamPage";
import FinancePage from "@/components/crm/FinancePage";
import ContractsPage from "@/components/crm/ContractsPage";
import MarketingPage from "@/components/crm/MarketingPage";
import ChatsPage from "@/components/crm/ChatsPage";

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

export default function CRMLayout({ onLogout }: Props) {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const renderPage = () => {
    switch (active) {
      case "dashboard": return <DashboardPage />;
      case "projects": return <ProjectsPage />;
      case "clients": return <ClientsPage />;
      case "team": return <TeamPage />;
      case "finance": return <FinancePage />;
      case "contracts": return <ContractsPage />;
      case "marketing": return <MarketingPage />;
      case "chats": return <ChatsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-onyx overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-onyx-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-onyx-border">
          {!collapsed && (
            <span className="font-cormorant text-xl font-semibold text-gold tracking-widest">АРЕНА</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-foreground/30 hover:text-foreground transition-colors ml-auto"
          >
            <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                active === item.id ? "active" : "text-foreground/50 hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} fallback="Circle" size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-onyx-border p-4">
          {collapsed ? (
            <button onClick={onLogout} className="text-foreground/30 hover:text-foreground transition-colors">
              <Icon name="LogOut" size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                <span className="text-gold text-xs font-semibold">А</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">Алексей Иванов</p>
                <p className="text-xs text-foreground/40">Дизайнер</p>
              </div>
              <button onClick={onLogout} className="text-foreground/30 hover:text-foreground transition-colors">
                <Icon name="LogOut" size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-onyx-border"
          style={{ background: 'rgba(13,13,15,0.9)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h1 className="font-cormorant text-xl font-medium">
              {NAV_ITEMS.find(n => n.id === active)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-foreground/40 hover:text-foreground transition-colors">
              <Icon name="Bell" size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />
            </button>
            <button className="px-4 py-1.5 bg-gold/10 border border-gold/30 text-gold text-xs hover:bg-gold hover:text-onyx transition-all duration-300 rounded-sm">
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
