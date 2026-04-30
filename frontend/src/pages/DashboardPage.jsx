import { useEffect, useState } from "react";
import { api, brl } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { FileText, DollarSign, Clock, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Stat = ({ icon: Icon, label, value, accent = "bg-slate-900", testid }) => (
  <Card className="p-6 fade-up" data-testid={testid}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-display font-bold text-slate-900">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${accent} text-white flex items-center justify-center`}>
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Acompanhe seus pedidos e faturamento.</p>
        </div>
        <Link to="/notas/nova">
          <Button className="bg-slate-900 hover:bg-slate-800" data-testid="dashboard-new-note-btn">+ Nova Nota</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Stat icon={FileText} label="Pedidos Hoje" value={stats?.today_orders ?? "—"} testid="stat-today-orders" />
        <Stat icon={DollarSign} label="Faturamento Total" value={stats ? brl(stats.total_revenue) : "—"} accent="bg-emerald-600" testid="stat-revenue" />
        <Stat icon={Clock} label="Notas Pendentes" value={stats?.pending_count ?? "—"} accent="bg-amber-500" testid="stat-pending" />
        <Stat icon={Package} label="Total de Notas" value={stats?.total_notes ?? "—"} accent="bg-blue-600" testid="stat-total-notes" />
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">Faturamento</div>
            <div className="text-xl font-display font-semibold text-slate-900">Últimos 7 dias</div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.daily_revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }}
                formatter={(v) => brl(v)}
              />
              <Bar dataKey="total" fill="#0F172A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
