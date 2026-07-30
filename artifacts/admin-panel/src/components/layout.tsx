import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Car, History, LineChart, Users, LogOut, Search, Settings, Menu, X } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
  { icon: Car, label: "Voitures", href: "/cars" },
  { icon: History, label: "Historique des prix", href: "/price-history" },
  { icon: LineChart, label: "Ventes", href: "/sales" },
  { icon: Users, label: "Vendeurs", href: "/sellers" },
  { icon: Settings, label: "Paramètres", href: "/settings" },
];

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("shawrome_token");
        setLocation("/login");
      }
    });
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <div
        className={`
          flex flex-col w-64 bg-card border-r border-border h-screen shrink-0 shadow-lg
          fixed inset-y-0 left-0 z-50 transition-transform duration-200
          md:sticky md:top-0 md:translate-x-0 md:z-10
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="font-sans font-bold text-xl tracking-wider text-foreground flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-sm">S</span>
            </div>
            SHAWROME
          </div>
          <button onClick={onClose} className="md:hidden text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  location.startsWith(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} className={location.startsWith(item.href) ? "text-primary" : "text-muted-foreground"} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground shrink-0"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative ml-2 md:ml-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="search"
          placeholder="Rechercher VIN, modèle, ou client..."
          className="w-full bg-secondary/50 border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
        />
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium">Admin</div>
          <div className="text-xs text-muted-foreground font-mono">Direction</div>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          A
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (location === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}