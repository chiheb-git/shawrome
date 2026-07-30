import { useState } from "react";
import { Link, useLocation } from "wouter";
import { logout, type SellerUser } from "@/lib/auth";
import { LayoutDashboard, Car, Receipt, Settings, LogOut, Menu, X } from "lucide-react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
      {/* Bouton hamburger, visible uniquement sur mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white"
      >
        <Menu size={20} />
      </button>

      {/* Overlay sombre derriere le menu quand il est ouvert sur mobile */}
      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar : cachee par defaut sur mobile, coulisse depuis la gauche */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0a0a0f] p-4
          transition-transform duration-200
          md:relative md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <div>
            <h2 className="text-lg font-bold text-white">Shawrome</h2>
            <p className="text-xs text-gray-400">Espace vendeur</p>
          </div>
          <button onClick={closeMobile} className="md:hidden text-gray-400">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobile}
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

      {/* Contenu principal : marge en haut sur mobile pour laisser la place au bouton hamburger */}
      <main className="flex-1 overflow-y-auto p-6 pt-16 md:pt-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
