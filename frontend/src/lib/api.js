import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const TIERS = [
  { key: "blue", label: "Linha Azul", priceField: "price_blue", className: "tier-blue", dotClass: "bg-blue-500" },
  { key: "green", label: "Linha Verde", priceField: "price_green", className: "tier-green", dotClass: "bg-green-500" },
  { key: "yellow", label: "Linha Amarela", priceField: "price_yellow", className: "tier-yellow", dotClass: "bg-yellow-500" },
  { key: "red", label: "Linha Vermelha", priceField: "price_red", className: "tier-red", dotClass: "bg-red-500" },
];

export function tierMeta(key) {
  return TIERS.find((t) => t.key === key) || TIERS[0];
}

export function brl(value) {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}
