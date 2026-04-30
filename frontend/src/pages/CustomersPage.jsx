import { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const empty = { name: "", address: "", phone: "", email: "", account_balance: 0 };

export default function CustomersPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const { data } = await api.get("/customers");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setOpen(true); };
  const openEdit = (c) => {
    setForm({ name: c.name, address: c.address || "", phone: c.phone || "", email: c.email || "", account_balance: c.account_balance ?? 0 });
    setEditingId(c.id);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      account_balance: parseFloat(form.account_balance) || 0,
    };
    try {
      if (editingId) await api.put(`/customers/${editingId}`, payload);
      else await api.post("/customers", payload);
      toast.success(editingId ? "Cliente atualizado" : "Cliente criado");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir este cliente?")) return;
    await api.delete(`/customers/${id}`);
    toast.success("Cliente excluído");
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">Gerencie seus clientes recorrentes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800" data-testid="new-customer-btn">
              <Plus size={16} className="mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4" data-testid="customer-form">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="customer-name-input" />
              </div>
              <div>
                <Label>Endereço</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} data-testid="customer-address-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="customer-phone-input" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="customer-email-input" />
                </div>
              </div>
              <div>
                <Label>Contas (débito anterior em aberto)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.account_balance}
                  onChange={(e) => setForm({ ...form, account_balance: e.target.value })}
                  data-testid="customer-account-balance-input"
                  placeholder="0,00"
                />
                <p className="text-xs text-slate-500 mt-1">Opcional. Se &gt; 0, será exibido na nota impressa.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-customer-btn">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[120px]">Contas</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-12">Nenhum cliente cadastrado.</TableCell>
              </TableRow>
            )}
            {items.map((c) => {
              const bal = c.account_balance ?? 0;
              return (
              <TableRow key={c.id} data-testid={`customer-row-${c.id}`}>
                <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                <TableCell className="text-sm text-slate-600 max-w-xs truncate">{c.address}</TableCell>
                <TableCell className="text-sm">{c.phone}</TableCell>
                <TableCell className="text-sm">{c.email}</TableCell>
                <TableCell className="text-sm">
                  {bal > 0 ? (
                    <span className="px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium">
                      {bal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} data-testid={`edit-customer-${c.id}`}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)} data-testid={`delete-customer-${c.id}`}>
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
