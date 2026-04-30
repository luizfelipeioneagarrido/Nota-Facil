# NotaFácil — Gerador de Notas Não Fiscais

## Original Problem
"Crie um aplicativo gerador de notas não fiscais, que eu possa criar e editar notas com numero do pedido, nome do cliente, endereço, produtos, quantidade e valor, alem de taxa de entrega e valor total. Produtos com integração às notas. Cada produto precisa de 4 opções de preço: linha azul, verde, amarela, vermelha."

## User Choices
- Auth: JWT (email/senha)
- Export: Imprimir + PDF
- Clientes recorrentes
- Numeração: DDMMYY + sequencial (ex: 30042601)
- Visual: clean/profissional

## Architecture
- Backend: FastAPI + MongoDB (Motor) + bcrypt + PyJWT
- Frontend: React 19 + React Router + Shadcn UI + Tailwind + Recharts + jsPDF + html2canvas
- Auth: JWT 7d em httpOnly cookie + Authorization Bearer (localStorage)
- Multi-tenant: cada user só vê seus próprios dados (filtrado por user_id)

## What's Implemented (30/04/2026)
- ✅ JWT auth (register, login, me, logout) com seed admin
- ✅ Produtos CRUD com 4 níveis de preço (azul/verde/amarela/vermelha)
- ✅ Clientes CRUD (nome, endereço, telefone, email)
- ✅ Notas CRUD com numeração automática DDMMYY + seq 2 dígitos
- ✅ Editor de Nota com preview em tempo real, seleção de cliente cadastrado, troca de tier atualiza preço unitário
- ✅ Cálculo automático de subtotal, taxa de entrega, total
- ✅ Página de impressão com layout limpo (@media print) + download PDF
- ✅ Dashboard com stats e gráfico 7 dias (Recharts)
- ✅ Status de nota (Pendente/Pago/Cancelada)

## Testing
- ✅ 12/12 backend tests (auth, CRUD, order_number format, multi-tenant, dashboard)
- ✅ Frontend smoke (login, sidebar, produtos, clientes, notas)
- Test file: `/app/backend/tests/backend_test.py`

## Test Credentials
- admin@notas.com / admin123

## Backlog (P1/P2)
- P1: Logo/marca da empresa na nota (upload em settings)
- P1: Filtro de notas por status e período
- P1: Index único em (user_id, order_number) e contador atômico (race condition)
- P2: Compartilhar nota via WhatsApp (link)
- P2: Relatório mensal CSV
- P2: Templates de nota personalizáveis
- P2: Histórico de preços por cliente
