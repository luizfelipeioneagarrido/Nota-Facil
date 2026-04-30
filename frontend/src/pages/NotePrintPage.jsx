import { useEffect, useRef, useState, forwardRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, brl, formatDateBR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ThermalReceipt = forwardRef(function ThermalReceipt({ note }, ref) {
  return (
    <div
      ref={ref}
      className="thermal-receipt mx-auto bg-white text-black"
      style={{ width: "58mm", padding: "3mm", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: "10px", lineHeight: 1.35 }}
    >
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
        Nota Não Fiscal
      </div>
      <div style={{ textAlign: "center", fontSize: "9px" }}>Sem valor fiscal</div>
      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Pedido</span>
        <strong data-testid="thermal-order-number">{note.order_number}</strong>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Data</span>
        <span>{formatDateBR(note.created_at)}</span>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
      <div style={{ fontWeight: 700 }}>CLIENTE</div>
      <div data-testid="thermal-customer-name">{note.customer_name}</div>
      {note.customer_phone && <div>Tel: {note.customer_phone}</div>}
      {note.customer_address && (
        <div style={{ whiteSpace: "pre-line", fontSize: "9px" }}>{note.customer_address}</div>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
      <div style={{ fontWeight: 700 }}>ITENS</div>
      {note.items.map((it, idx) => {
        const lineTotal = it.quantity * it.unit_price;
        return (
          <div key={idx} style={{ marginTop: "3px" }}>
            <div style={{ fontWeight: 600, fontSize: "10px" }}>{it.product_name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px" }}>
              <span>{it.quantity} x {brl(it.unit_price)}</span>
              <strong>{brl(lineTotal)}</strong>
            </div>
          </div>
        );
      })}

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Subtotal</span><span>{brl(note.subtotal)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Taxa Entrega</span><span>{brl(note.delivery_fee)}</span>
      </div>
      <div style={{ borderTop: "1px solid #000", margin: "3px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800 }}>
        <span>TOTAL</span><span data-testid="thermal-total">{brl(note.total)}</span>
      </div>

      {(note.customer_account_balance || 0) > 0 && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
          <div style={{ fontWeight: 700, textAlign: "center", fontSize: "10px" }}>CONTAS EM ABERTO</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700 }} data-testid="thermal-account-balance">
            <span>Débito Anterior</span>
            <span>{brl(note.customer_account_balance)}</span>
          </div>
          <div style={{ borderTop: "1px solid #000", margin: "3px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800 }}>
            <span>TOTAL GERAL</span>
            <span>{brl(note.total + note.customer_account_balance)}</span>
          </div>
        </>
      )}

      {note.notes && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
          <div style={{ fontSize: "9px", whiteSpace: "pre-line" }}>{note.notes}</div>
        </>
      )}

      <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
      <div style={{ textAlign: "center", fontSize: "9px" }}>Obrigado pela preferência!</div>
    </div>
  );
});

const A4Receipt = forwardRef(function A4Receipt({ note }, ref) {
  return (
    <div ref={ref} className="bg-white border border-slate-200 rounded-xl p-8 md:p-10 shadow-sm">
      <div className="border-t-2 border-b-2 border-slate-900 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl tracking-tight">NOTA NÃO FISCAL</h1>
            <div className="text-sm text-slate-600 mt-1">Documento sem valor fiscal</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Nº Pedido</div>
            <div className="font-mono font-bold text-2xl" data-testid="print-order-number">{note.order_number}</div>
            <div className="text-xs text-slate-600 mt-1">{formatDateBR(note.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Cliente</div>
          <div className="font-semibold text-slate-900" data-testid="print-customer-name">{note.customer_name}</div>
          {note.customer_address && <div className="text-sm text-slate-700 mt-1 whitespace-pre-line">{note.customer_address}</div>}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Contato</div>
          <div className="text-sm">{note.customer_phone || "—"}</div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="text-left py-2 text-[10px] uppercase tracking-widest text-slate-700">Item</th>
            <th className="text-center py-2 w-16 text-[10px] uppercase tracking-widest text-slate-700">Qtd</th>
            <th className="text-right py-2 w-28 text-[10px] uppercase tracking-widest text-slate-700">Unitário</th>
            <th className="text-right py-2 w-28 text-[10px] uppercase tracking-widest text-slate-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {note.items.map((it, idx) => (
            <tr key={idx} className="border-b border-slate-200">
              <td className="py-3 font-medium text-slate-900">{it.product_name}</td>
              <td className="py-3 text-center">{it.quantity}</td>
              <td className="py-3 text-right">{brl(it.unit_price)}</td>
              <td className="py-3 text-right font-semibold">{brl(it.quantity * it.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{brl(note.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Taxa de Entrega</span><span>{brl(note.delivery_fee)}</span></div>
        <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-2 font-display font-bold text-xl">
          <span>TOTAL</span><span data-testid="print-total">{brl(note.total)}</span>
        </div>
        {(note.customer_account_balance || 0) > 0 && (
          <div className="mt-4 pt-3 border-t border-amber-300" data-testid="print-account-balance">
            <div className="text-[10px] uppercase tracking-widest text-amber-700 mb-1">Contas em aberto</div>
            <div className="flex justify-between text-amber-800 font-medium">
              <span>Débito Anterior</span>
              <span>{brl(note.customer_account_balance)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-2 mt-2 font-display font-bold text-lg">
              <span>TOTAL GERAL</span>
              <span>{brl(note.total + note.customer_account_balance)}</span>
            </div>
          </div>
        )}
      </div>

      {note.notes && (
        <div className="mt-8 pt-4 border-t border-slate-300">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Observações</div>
          <div className="text-sm text-slate-700 whitespace-pre-line">{note.notes}</div>
        </div>
      )}

      <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[10px] uppercase tracking-widest text-slate-500">
        Obrigado pela preferência
      </div>
    </div>
  );
});

export default function NotePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [layout, setLayout] = useState("thermal");
  const printRef = useRef(null);

  useEffect(() => {
    api.get(`/notes/${id}`).then(({ data }) => setNote(data)).catch(() => {
      toast.error("Nota não encontrada");
      navigate("/notas");
    });
  }, [id, navigate]);

  // Toggle body class + dynamic @page for print sizing
  useEffect(() => {
    document.body.classList.toggle("print-thermal-mode", layout === "thermal");
    document.body.classList.toggle("print-a4-mode", layout === "a4");
    let styleEl = document.getElementById("dynamic-print-page-rule");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-page-rule";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = layout === "thermal"
      ? "@page { size: 58mm auto; margin: 0; }"
      : "@page { size: A4; margin: 12mm; }";
    return () => {
      document.body.classList.remove("print-thermal-mode", "print-a4-mode");
    };
  }, [layout]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const isThermal = layout === "thermal";
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: isThermal ? [58, 200] : "a4",
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`nota-${note.order_number}.pdf`);
  };

  if (!note) return <div className="p-8 text-slate-500">Carregando...</div>;

  return (
    <div className={`p-6 md:p-8 ${layout === "thermal" ? "max-w-2xl" : "max-w-4xl"} mx-auto`}>
      <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate("/notas")} className="text-sm text-slate-600 inline-flex items-center gap-1 hover:text-slate-900" data-testid="back-btn">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={(v) => v && setLayout(v)}
            className="bg-white border border-slate-200 rounded-lg p-1"
          >
            <ToggleGroupItem value="thermal" data-testid="layout-thermal-btn" className="text-xs px-3 data-[state=on]:bg-slate-900 data-[state=on]:text-white">
              Térmica 58mm
            </ToggleGroupItem>
            <ToggleGroupItem value="a4" data-testid="layout-a4-btn" className="text-xs px-3 data-[state=on]:bg-slate-900 data-[state=on]:text-white">
              A4
            </ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={() => navigate(`/notas/${id}/editar`)} data-testid="edit-note-btn">
            <Pencil size={16} className="mr-2" /> Editar
          </Button>
          <Button variant="outline" onClick={handlePDF} data-testid="download-pdf-btn">
            <Download size={16} className="mr-2" /> PDF
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800" data-testid="print-btn">
            <Printer size={16} className="mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="print-area mx-auto bg-white">
        {layout === "thermal" ? (
          <ThermalReceipt ref={printRef} note={note} />
        ) : (
          <A4Receipt ref={printRef} note={note} />
        )}
      </div>
    </div>
  );
}
