import { Navigate, Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Package, Users, FileText, LogOut, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500" data-testid="loading-screen">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/notas", label: "Notas", icon: FileText, testid: "nav-notes" },
  { to: "/produtos", label: "Produtos", icon: Package, testid: "nav-products" },
  { to: "/clientes", label: "Clientes", icon: Users, testid: "nav-customers" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="no-print w-64 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
        <div className="px-6 py-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Receipt size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 leading-tight">NotaFácil</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Notas Não Fiscais</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium text-slate-900 truncate" data-testid="user-name">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout} data-testid="logout-btn">
            <LogOut size={16} className="mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
