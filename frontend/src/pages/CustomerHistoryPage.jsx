import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, brl, formatDateBR, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Phone, MapPin, Mail, Eye, FileText, DollarSign,
  AlertCircle, TrendingUp, FileDown, Download, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [settling, setSettling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const exportRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/customers/${id}/history`);
      setData(data);
    } catch {
      toast.error("Cliente não encontrado");
      navigate("/clientes");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleSettle = async () => {
    setSettling(true);
    try {
      const { data: res } = await api.post(`/customers/${id}/settle`);
      if (res.settled_amount > 0) {
        toast.success(`Pagamento recebido: ${brl(res.settled_amount)} (${res.notes_settled} nota(s) marcadas como pagas)`);
      } else {
        toast.info(res.message || "Nenhum valor em aberto");
      }
      setConfirmOpen(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSettling(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const { customer, notes, stats } = data;
    const rows = [];
    rows.push(["Cliente", customer.name]);
    rows.push(["Telefone", customer.phone || ""]);
    rows.push(["Endereço", customer.address || ""]);
    rows.push([]);
    rows.push(["Total de Notas", stats.total_notes]);
    rows.push(["Total Pago", stats.total_paid.toFixed(2)]);
    rows.push(["Total Pendente", stats.total_pending.toFixed(2)]);
    rows.push(["Débito Anterior", stats.account_balance.toFixed(2)]);
    rows.push(["Total em Aberto", stats.total_open.toFixed(2)]);
    rows.push([]);
    rows.push(["Nº Pedido", "Data", "Itens", "Subtotal", "Taxa", "Total", "Status"]);
    for (const n of notes) {
      rows.push([
        n.order_number,
        formatDateBR(n.created_at),
        n.items.length,
        (n.subtotal || 0).toFixed(2),
        (n.delivery_fee || 0).toFixed(2),
        (n.total || 0).toFixed(2),
        STATUS_LABEL[n.status]?.label || n.status,
      ]);
    }
    const csv = rows.map((r) =>
      r.map((cell) => {
        const s = String(cell ?? "");
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(";")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-${customer.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const exportPDF = async () => {
    if (!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`historico-${data.customer.name.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF gerado");
  };

  if (!data) return <div className="p-8 text-slate-500">Carregando...</div>;

  const { customer, notes, stats } = data;
  const hasOpenAmount = stats.total_open > 0;

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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn">
            <FileDown size={16} className="mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} data-testid="export-pdf-btn">
            <Download size={16} className="mr-2" /> PDF
          </Button>
          <Link to="/notas/nova">
            <Button variant="outline" data-testid="new-note-for-customer-btn">+ Nova Nota</Button>
          </Link>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!hasOpenAmount}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            data-testid="settle-btn"
          >
            <Wallet size={16} className="mr-2" /> Receber Pagamento
          </Button>
        </div>
      </div>

      <div ref={exportRef} className="bg-white">
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar recebimento de pagamento</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 mt-2">
                <div>Você está prestes a fechar a conta de <strong>{customer.name}</strong>.</div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Notas pendentes:</span><strong>{brl(stats.total_pending)}</strong></div>
                  <div className="flex justify-between"><span>Débito anterior:</span><strong>{brl(stats.account_balance)}</strong></div>
                  <div className="flex justify-between border-t border-slate-300 pt-1.5 mt-1.5 text-base">
                    <span className="font-semibold">Total a receber:</span>
                    <strong className="text-emerald-700">{brl(stats.total_open)}</strong>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Todas as notas pendentes serão marcadas como <strong>pagas</strong> e o débito anterior será zerado.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="settle-cancel-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSettle}
              disabled={settling}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="settle-confirm-btn"
            >
              {settling ? "Processando..." : "Confirmar Recebimento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
