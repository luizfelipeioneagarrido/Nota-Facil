import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiErrorDetail } from "@/lib/api";
import { Receipt } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(name, email, password);
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md fade-up">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <div className="font-display font-bold text-xl">NotaFácil</div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Gerador de Notas</div>
            </div>
          </div>

          <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900">Criar conta</h1>
          <p className="mt-2 text-slate-600">Comece em poucos segundos.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" data-testid="register-form">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" data-testid="register-name-input" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" data-testid="register-email-input" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" data-testid="register-password-input" />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting} data-testid="register-submit-btn">
              {submitting ? "Criando..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-slate-900 underline" data-testid="goto-login-link">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div
        className="hidden lg:block bg-slate-100 relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1763303775599-08d20753a9ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHdoaXRlJTIwYXJjaGl0ZWN0dXJhbCUyMGdlb21ldHJ5fGVufDB8fHx8MTc3NzUyMzk3MXww&ixlib=rb-4.1.0&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
}
