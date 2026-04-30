import { useEffect, useState } from "react";
import { api, brl, TIERS, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const empty = { name: "", description: "", price_blue: "", price_green: "", price_yellow: "", price_red: "" };

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const { data } = await api.get("/products");
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(empty);
    setEditingId(null);
    setOpen(true);
  };
  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || "",
      price_blue: p.price_blue, price_green: p.price_green,
      price_yellow: p.price_yellow, price_red: p.price_red,
    });
    setEditingId(p.id);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price_blue: parseFloat(form.price_blue) || 0,
      price_green: parseFloat(form.price_green) || 0,
      price_yellow: parseFloat(form.price_yellow) || 0,
      price_red: parseFloat(form.price_red) || 0,
    };
    try {
      if (editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post("/products", payload);
      toast.success(editingId ? "Produto atualizado" : "Produto criado");
      setOpen(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir este produto?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Produto excluído");
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">Produtos</h1>
          <p className="text-slate-600 mt-1">Cadastre produtos com 4 níveis de preço.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800" data-testid="new-product-btn">
              <Plus size={16} className="mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="product-dialog-title">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={save} className="space-y-4" data-testid="product-form">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="product-name-input" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="product-desc-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {TIERS.map((t) => (
                  <div key={t.key}>
                    <Label className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${t.dotClass}`} />
                      {t.label}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form[t.priceField]}
                      onChange={(e) => setForm({ ...form, [t.priceField]: e.target.value })}
                      data-testid={`product-${t.key}-price-input`}
                      placeholder="0,00"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" data-testid="save-product-btn">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Linha Azul</TableHead>
              <TableHead>Linha Verde</TableHead>
              <TableHead>Linha Amarela</TableHead>
              <TableHead>Linha Vermelha</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                  Nenhum produto cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
            {items.map((p) => (
              <TableRow key={p.id} data-testid={`product-row-${p.id}`}>
                <TableCell>
                  <div className="font-medium text-slate-900">{p.name}</div>
                  {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
                </TableCell>
                <TableCell><span className="px-2 py-1 rounded border tier-blue">{brl(p.price_blue)}</span></TableCell>
                <TableCell><span className="px-2 py-1 rounded border tier-green">{brl(p.price_green)}</span></TableCell>
                <TableCell><span className="px-2 py-1 rounded border tier-yellow">{brl(p.price_yellow)}</span></TableCell>
                <TableCell><span className="px-2 py-1 rounded border tier-red">{brl(p.price_red)}</span></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)} data-testid={`delete-product-${p.id}`}>
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
