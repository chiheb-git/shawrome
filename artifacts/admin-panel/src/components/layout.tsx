import { Link, useLocation } from "wouter";
import { LayoutDashboard, Car, History, LineChart, Users, LogOut, Search, Settings } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

export function Sidebar() {
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

  const navItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
    { icon: Car, label: "Voitures", href: "/cars" },
    { icon: History, label: "Historique des prix", href: "/price-history" },
    { icon: LineChart, label: "Ventes", href: "/sales" },
    { icon: Users, label: "Vendeurs", href: "/sellers" },
    { icon: Settings, label: "Paramètres", href: "/settings" },
  ];

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 shrink-0 shadow-lg z-10">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="font-sans font-bold text-xl tracking-wider text-foreground flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-primary-foreground text-sm">S</span>
          </div>
          SHAWROME
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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
  );
}

export function Topbar() {
  return (
    <div className="h-16 bg-background border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          type="search"
          placeholder="Rechercher VIN, modèle, ou client..."
          className="w-full bg-secondary/50 border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
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
  if (location === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
