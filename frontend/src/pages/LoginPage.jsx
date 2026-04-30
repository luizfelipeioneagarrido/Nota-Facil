import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiErrorDetail } from "@/lib/api";
import { Receipt } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@notas.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Bem-vindo de volta!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erro ao entrar");
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

          <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900">Entrar</h1>
          <p className="mt-2 text-slate-600">Acesse sua conta para gerenciar pedidos e notas.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={submitting} data-testid="login-submit-btn">
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Não tem conta?{" "}
            <Link to="/register" className="font-medium text-slate-900 underline" data-testid="goto-register-link">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      <div
        className="hidden lg:block bg-slate-100 relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1763303775599-08d20753a9ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHdoaXRlJTIwYXJjaGl0ZWN0dXJhbCUyMGdlb21ldHJ5fGVufDB8fHx8MTc3NzUyMzk3MXww&ixlib=rb-4.1.0&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2">Para pequenos negócios</div>
          <div className="text-3xl font-display font-semibold leading-tight max-w-md">
            Crie, organize e imprima notas não fiscais em segundos.
          </div>
        </div>
      </div>
    </div>
  );
}
