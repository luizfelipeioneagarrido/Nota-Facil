import { useEffect, useState } from "react";
import { api, brl, formatDateBR, tierMeta } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL = {
  pending: { label: "Pendente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Pago", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelada", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function NotesListPage() {
  const [notes, setNotes] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await api.get("/notes");
    setNotes(data);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Excluir esta nota?")) return;
    await api.delete(`/notes/${id}`);
    toast.success("Nota excluída");
    load();
  };

  const filtered = notes.filter((n) => {
    const term = q.toLowerCase();
    return !term || n.order_number.includes(term) || n.customer_name.toLowerCase().includes(term);
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Notas</h1>
          <p className="text-slate-600 mt-1">Todas as suas notas não fiscais.</p>
        </div>
        <Link to="/notas/nova">
          <Button className="bg-slate-900 hover:bg-slate-800" data-testid="new-note-btn">
            <Plus size={16} className="mr-2" /> Nova Nota
          </Button>
        </Link>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por número ou cliente..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
          data-testid="notes-search-input"
        />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[180px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500 py-12">Nenhuma nota encontrada.</TableCell>
              </TableRow>
            )}
            {filtered.map((n) => {
              const s = STATUS_LABEL[n.status] || STATUS_LABEL.pending;
              const tiers = [...new Set(n.items.map((i) => i.tier))];
              return (
                <TableRow key={n.id} data-testid={`note-row-${n.id}`}>
                  <TableCell className="font-mono font-semibold">{n.order_number}</TableCell>
                  <TableCell className="text-sm">{formatDateBR(n.created_at)}</TableCell>
                  <TableCell className="text-slate-900">{n.customer_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-600">{n.items.length}</span>
                      <div className="flex gap-1">
                        {tiers.map((t) => (
                          <span key={t} className={`w-2 h-2 rounded-full ${tierMeta(t).dotClass}`} />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{brl(n.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.cls}>{s.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/notas/${n.id}/imprimir`}>
                      <Button variant="ghost" size="icon" data-testid={`view-note-${n.id}`}><Eye size={16} /></Button>
                    </Link>
                    <Link to={`/notas/${n.id}/editar`}>
                      <Button variant="ghost" size="icon" data-testid={`edit-note-${n.id}`}><Pencil size={16} /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => remove(n.id)} data-testid={`delete-note-${n.id}`}>
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
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
