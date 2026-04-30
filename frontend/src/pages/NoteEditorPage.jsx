import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, brl, TIERS, tierMeta, formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingNote, setLoadingNote] = useState(isEdit);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([]); // {product_id, product_name, quantity, unit_price, tier}
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderNumberPreview, setOrderNumberPreview] = useState("");

  // load product/customer lists
  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data));
    api.get("/customers").then(({ data }) => setCustomers(data));
    if (!isEdit) {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      setOrderNumberPreview(`${dd}${mm}${yy}xx`);
    }
  }, [isEdit]);

  // load existing note
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/notes/${id}`).then(({ data }) => {
      setCustomerId(data.customer_id || "");
      setCustomerName(data.customer_name);
      setCustomerAddress(data.customer_address || "");
      setCustomerPhone(data.customer_phone || "");
      setItems(data.items || []);
      setDeliveryFee(data.delivery_fee || 0);
      setNotes(data.notes || "");
      setStatus(data.status || "pending");
      setOrderNumberPreview(data.order_number);
      setLoadingNote(false);
    }).catch(() => {
      toast.error("Nota não encontrada");
      navigate("/notas");
    });
  }, [id, isEdit, navigate]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0),
    [items]
  );
  const total = subtotal + (parseFloat(deliveryFee) || 0);

  const onPickCustomer = (cid) => {
    setCustomerId(cid);
    const c = customers.find((x) => x.id === cid);
    if (c) {
      setCustomerName(c.name);
      setCustomerAddress(c.address || "");
      setCustomerPhone(c.phone || "");
    }
  };

  const addProduct = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: p.id,
        product_name: p.name,
        quantity: 1,
        unit_price: p.price_blue || 0,
        tier: "blue",
      },
    ]);
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const changeTier = (idx, tier) => {
    const it = items[idx];
    const p = products.find((x) => x.id === it.product_id);
    const tm = tierMeta(tier);
    const price = p ? p[tm.priceField] : it.unit_price;
    updateItem(idx, { tier, unit_price: price });
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!customerName) return toast.error("Informe o nome do cliente");
    if (items.length === 0) return toast.error("Adicione ao menos um produto");
    const payload = {
      customer_id: customerId || null,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_phone: customerPhone,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: parseFloat(i.quantity) || 0,
        unit_price: parseFloat(i.unit_price) || 0,
        tier: i.tier,
      })),
      delivery_fee: parseFloat(deliveryFee) || 0,
      notes,
      status,
    };
    try {
      const res = isEdit
        ? await api.put(`/notes/${id}`, payload)
        : await api.post("/notes", payload);
      toast.success(isEdit ? "Nota atualizada" : "Nota criada");
      navigate(`/notas/${res.data.id}/imprimir`);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  if (loadingNote) return <div className="p-8 text-slate-500">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <button onClick={() => navigate("/notas")} className="text-sm text-slate-600 mb-4 inline-flex items-center gap-1 hover:text-slate-900" data-testid="back-btn">
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900">
            {isEdit ? "Editar Nota" : "Nova Nota"}
          </h1>
          <p className="text-slate-600 mt-1">
            Nº Pedido: <span className="font-mono font-semibold">{orderNumberPreview}</span>
          </p>
        </div>
        <Button onClick={save} className="bg-slate-900 hover:bg-slate-800" data-testid="save-note-btn">
          <Save size={16} className="mr-2" /> Salvar Nota
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Cliente</h2>
            <div className="space-y-3">
              <div>
                <Label>Cliente cadastrado (opcional)</Label>
                <Select value={customerId || "__none"} onValueChange={(v) => v === "__none" ? setCustomerId("") : onPickCustomer(v)}>
                  <SelectTrigger data-testid="customer-select">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Digitar manualmente —</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} data-testid="note-customer-name" />
              </div>
              <div>
                <Label>Endereço</Label>
                <Textarea rows={2} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} data-testid="note-customer-address" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} data-testid="note-customer-phone" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Itens</h2>
              <Select value="" onValueChange={addProduct}>
                <SelectTrigger className="w-[220px]" data-testid="add-product-select">
                  <SelectValue placeholder="+ Adicionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">Cadastre produtos primeiro.</div>}
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <div className="text-center text-slate-500 py-8 border border-dashed rounded-lg">
                  Nenhum item adicionado.
                </div>
              )}
              {items.map((it, idx) => {
                const product = products.find((p) => p.id === it.product_id);
                return (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3" data-testid={`item-row-${idx}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-slate-900">{it.product_name}</div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} data-testid={`remove-item-${idx}`}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {TIERS.map((t) => {
                        const isActive = it.tier === t.key;
                        const tierPrice = product ? product[t.priceField] : 0;
                        return (
                          <button
                            type="button"
                            key={t.key}
                            onClick={() => changeTier(idx, t.key)}
                            data-testid={`item-${idx}-tier-${t.key}`}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                              isActive ? `${t.className} ring-2 ring-offset-1 ring-slate-900` : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${t.dotClass}`} />
                              {t.label} · {brl(tierPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Qtd.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                          data-testid={`item-${idx}-qty`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Preço Unit.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={it.unit_price}
                          onChange={(e) => updateItem(idx, { unit_price: e.target.value })}
                          data-testid={`item-${idx}-price`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Subtotal</Label>
                        <div className="h-10 flex items-center px-3 rounded-md bg-slate-50 border border-slate-200 font-semibold text-slate-900">
                          {brl((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Resumo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taxa de Entrega</Label>
                <Input type="number" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} data-testid="note-delivery-fee" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="note-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <Label>Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="note-observations" />
            </div>
          </Card>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:sticky lg:top-6 self-start">
          <Card className="p-6 bg-white">
            <div className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-500 mb-2">Visualização</div>
            <div className="border-t border-b border-slate-900 py-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-2xl">NOTA NÃO FISCAL</h2>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Pedido</div>
                  <div className="font-mono font-bold text-lg">{orderNumberPreview}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Cliente</div>
                <div className="font-medium">{customerName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Telefone</div>
                <div>{customerPhone || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Endereço</div>
                <div>{customerAddress || "—"}</div>
              </div>
            </div>

            <table className="w-full text-sm border-t border-slate-200">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center w-12">Qtd</th>
                  <th className="py-2 text-right w-24">Unit.</th>
                  <th className="py-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">— sem itens —</td></tr>
                )}
                {items.map((it, idx) => {
                  const tm = tierMeta(it.tier);
                  return (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2">
                        <div className="font-medium">{it.product_name}</div>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded border text-[10px] font-medium ${tm.className}`}>
                          {tm.label}
                        </span>
                      </td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">{brl(it.unit_price)}</td>
                      <td className="py-2 text-right font-medium">{brl((parseFloat(it.quantity)||0) * (parseFloat(it.unit_price)||0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{brl(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Taxa de Entrega</span><span>{brl(parseFloat(deliveryFee)||0)}</span></div>
              <div className="flex justify-between border-t border-slate-900 pt-2 mt-2 font-display font-bold text-lg">
                <span>TOTAL</span><span data-testid="preview-total">{brl(total)}</span>
              </div>
            </div>

            {notes && (
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Observações</div>
                {notes}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
