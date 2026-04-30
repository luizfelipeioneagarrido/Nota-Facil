import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, brl, formatDateBR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Phone, MapPin, Mail, Eye, FileText, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL = {
  pending: { label: "Pendente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Pago", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelada", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

const StatBox = ({ icon: Icon, label, value, accent = "bg-slate-900", testid }) => (
  <Card className="p-5" data-testid={testid}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-slate-500">{label}</div>
        <div className="mt-1.5 text-2xl font-display font-bold text-slate-900">{value}</div>
      </div>
      <div className={`w-9 h-9 rounded-lg ${accent} text-white flex items-center justify-center`}>
        <Icon size={16} strokeWidth={2} />
      </div>
    </div>
  </Card>
);

export default function CustomerHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}/history`).then(({ data }) => setData(data)).catch(() => {
      toast.error("Cliente não encontrado");
      navigate("/clientes");
    });
  }, [id, navigate]);

  if (!data) return <div className="p-8 text-slate-500">Carregando...</div>;

  const { customer, notes, stats } = data;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <button onClick={() => navigate("/clientes")} className="text-sm text-slate-600 mb-4 inline-flex items-center gap-1 hover:text-slate-900" data-testid="back-btn">
        <ArrowLeft size={16} /> Voltar para Clientes
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-500">Histórico do Cliente</div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 mt-1" data-testid="customer-history-name">{customer.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            {customer.phone && <span className="inline-flex items-center gap-1"><Phone size={14} /> {customer.phone}</span>}
            {customer.email && <span className="inline-flex items-center gap-1"><Mail size={14} /> {customer.email}</span>}
            {customer.address && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {customer.address}</span>}
          </div>
        </div>
        <Link to="/notas/nova" state={{ customerId: customer.id }}>
          <Button className="bg-slate-900 hover:bg-slate-800" data-testid="new-note-for-customer-btn">+ Nova Nota</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatBox icon={FileText} label="Notas" value={stats.total_notes} testid="stat-total-notes" />
        <StatBox icon={DollarSign} label="Total Pago" value={brl(stats.total_paid)} accent="bg-emerald-600" testid="stat-paid" />
        <StatBox icon={AlertCircle} label="Pendente" value={brl(stats.total_pending)} accent="bg-amber-500" testid="stat-pending" />
        <StatBox icon={TrendingUp} label="Débito Anterior" value={brl(stats.account_balance)} accent="bg-orange-600" testid="stat-account-balance" />
        <StatBox icon={DollarSign} label="Total em Aberto" value={brl(stats.total_open)} accent="bg-red-600" testid="stat-total-open" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display font-semibold text-lg">Notas do cliente</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                  Este cliente ainda não possui notas.
                </TableCell>
              </TableRow>
            )}
            {notes.map((n) => {
              const s = STATUS_LABEL[n.status] || STATUS_LABEL.pending;
              return (
                <TableRow key={n.id} data-testid={`history-note-${n.id}`}>
                  <TableCell className="font-mono font-semibold">{n.order_number}</TableCell>
                  <TableCell className="text-sm">{formatDateBR(n.created_at)}</TableCell>
                  <TableCell className="text-sm">{n.items.length}</TableCell>
                  <TableCell className="font-semibold">{brl(n.total)}</TableCell>
                  <TableCell><Badge variant="outline" className={s.cls}>{s.label}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Link to={`/notas/${n.id}/imprimir`}>
                      <Button variant="ghost" size="icon"><Eye size={16} /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
