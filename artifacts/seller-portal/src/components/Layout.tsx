import { Link, useLocation } from "wouter";
import { logout, type SellerUser } from "@/lib/auth";
import { LayoutDashboard, Car, Receipt, Settings, LogOut } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/voitures", label: "Mes voitures", icon: Car },
  { path: "/ventes", label: "Mes ventes", icon: Receipt },
  { path: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Layout({
  user,
  children,
}: {
  user: SellerUser;
  children: React.ReactNode;
}) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100">
      <aside className="relative w-64 border-r border-white/10 p-4">
        <div className="mb-6 px-2">
          <h2 className="text-lg font-bold text-white">Shawrome</h2>
          <p className="text-xs text-gray-400">Espace vendeur</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 w-56">
          <div className="mb-2 px-2 text-xs text-gray-500">{user.name}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
