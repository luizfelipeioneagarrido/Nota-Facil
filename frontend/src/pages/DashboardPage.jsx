import { useEffect, useState } from "react";
import { api, brl } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { FileText, DollarSign, Clock, Package, Users, ArrowRight, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PERIOD_LABEL = {
  day: "Hoje",
  week: "Últimos 7 dias",
  month: "Últimos 30 dias",
  year: "Este ano",
};

const ShortcutCard = ({ icon: Icon, label, value, accent = "bg-slate-900", to, testid, hint }) => (
  <Link to={to} className="group block fade-up" data-testid={testid}>
    <Card className="p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-display font-bold text-slate-900 truncate">{value}</div>
          {hint && (
            <div className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1 group-hover:text-slate-900 transition-colors">
              {hint} <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${accent} text-white flex items-center justify-center shrink-0`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </Card>
  </Link>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    api.get(`/dashboard/stats?period=${period}`).then(({ data }) => setStats(data));
  }, [period]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Acompanhe seus pedidos e faturamento.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Link to="/notas/nova">
            <Button className="bg-slate-900 hover:bg-slate-800" data-testid="dashboard-new-note-btn">
              <Plus size={16} className="mr-1.5" /> Nova Nota
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">Período</div>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v)}
          className="bg-white border border-slate-200 rounded-lg p-1"
          data-testid="period-toggle"
        >
          <ToggleGroupItem value="day" data-testid="period-day" className="text-xs px-4 data-[state=on]:bg-slate-900 data-[state=on]:text-white">Dia</ToggleGroupItem>
          <ToggleGroupItem value="week" data-testid="period-week" className="text-xs px-4 data-[state=on]:bg-slate-900 data-[state=on]:text-white">Semana</ToggleGroupItem>
          <ToggleGroupItem value="month" data-testid="period-month" className="text-xs px-4 data-[state=on]:bg-slate-900 data-[state=on]:text-white">Mês</ToggleGroupItem>
          <ToggleGroupItem value="year" data-testid="period-year" className="text-xs px-4 data-[state=on]:bg-slate-900 data-[state=on]:text-white">Ano</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <ShortcutCard
          icon={FileText}
          label={period === "day" ? "Pedidos Hoje" : "Pedidos no período"}
          value={period === "day" ? (stats?.today_orders ?? "—") : (stats?.period_orders ?? "—")}
          to="/notas"
          hint="Ver todas as notas"
          testid="stat-orders"
        />
        <ShortcutCard
          icon={DollarSign}
          label="Faturamento (Pago)"
          value={stats ? brl(stats.total_revenue) : "—"}
          accent="bg-emerald-600"
          to="/notas"
          hint="Ver notas pagas"
          testid="stat-revenue"
        />
        <ShortcutCard
          icon={Clock}
          label="Notas Pendentes"
          value={stats?.pending_count ?? "—"}
          accent="bg-amber-500"
          to="/notas"
          hint="Ver pendentes"
          testid="stat-pending"
        />
        <ShortcutCard
          icon={Package}
          label="Total de Notas"
          value={stats?.total_notes ?? "—"}
          accent="bg-blue-600"
          to="/notas"
          hint="Ver todas"
          testid="stat-total-notes"
        />
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">Faturamento</div>
            <div className="text-xl font-display font-semibold text-slate-900">{PERIOD_LABEL[period]}</div>
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/notas/nova" className="group" data-testid="shortcut-new-note">
          <Card className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center"><Plus size={18} /></div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Nova Nota</div>
                <div className="text-xs text-slate-500">Criar pedido rapidamente</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </div>
          </Card>
        </Link>
        <Link to="/produtos" className="group" data-testid="shortcut-products">
          <Card className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Package size={18} /></div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Produtos</div>
                <div className="text-xs text-slate-500">Gerenciar catálogo</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </div>
          </Card>
        </Link>
        <Link to="/clientes" className="group" data-testid="shortcut-customers">
          <Card className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><Users size={18} /></div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">Clientes</div>
                <div className="text-xs text-slate-500">Cadastros recorrentes</div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
