import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AppLayout } from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import CustomersPage from "@/pages/CustomersPage";
import NotesListPage from "@/pages/NotesListPage";
import NoteEditorPage from "@/pages/NoteEditorPage";
import NotePrintPage from "@/pages/NotePrintPage";
import CustomerHistoryPage from "@/pages/CustomerHistoryPage";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/produtos" element={<ProductsPage />} />
              <Route path="/clientes" element={<CustomersPage />} />
              <Route path="/clientes/:id/historico" element={<CustomerHistoryPage />} />
              <Route path="/notas" element={<NotesListPage />} />
              <Route path="/notas/nova" element={<NoteEditorPage />} />
              <Route path="/notas/:id/editar" element={<NoteEditorPage />} />
              <Route path="/notas/:id/imprimir" element={<NotePrintPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
