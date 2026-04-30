import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, brl, formatDateBR, tierMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export default function NotePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    api.get(`/notes/${id}`).then(({ data }) => setNote(data)).catch(() => {
      toast.error("Nota não encontrada");
      navigate("/notas");
    });
  }, [id, navigate]);

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`nota-${note.order_number}.pdf`);
  };

  if (!note) return <div className="p-8 text-slate-500">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="no-print flex items-center justify-between mb-6">
        <button onClick={() => navigate("/notas")} className="text-sm text-slate-600 inline-flex items-center gap-1 hover:text-slate-900" data-testid="back-btn">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/notas/${id}/editar`)} data-testid="edit-note-btn">
            <Pencil size={16} className="mr-2" /> Editar
          </Button>
          <Button variant="outline" onClick={handlePDF} data-testid="download-pdf-btn">
            <Download size={16} className="mr-2" /> Baixar PDF
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800" data-testid="print-btn">
            <Printer size={16} className="mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print-area bg-white border border-slate-200 rounded-xl p-8 md:p-10 shadow-sm">
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
            {note.items.map((it, idx) => {
              const tm = tierMeta(it.tier);
              return (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-3">
                    <div className="font-medium text-slate-900">{it.product_name}</div>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded border text-[10px] font-medium ${tm.className}`}>
                      {tm.label}
                    </span>
                  </td>
                  <td className="py-3 text-center">{it.quantity}</td>
                  <td className="py-3 text-right">{brl(it.unit_price)}</td>
                  <td className="py-3 text-right font-semibold">{brl(it.quantity * it.unit_price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{brl(note.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Taxa de Entrega</span>
            <span>{brl(note.delivery_fee)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-2 font-display font-bold text-xl">
            <span>TOTAL</span>
            <span data-testid="print-total">{brl(note.total)}</span>
          </div>
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
    </div>
  );
}
