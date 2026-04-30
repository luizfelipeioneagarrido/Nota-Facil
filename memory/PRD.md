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

## What's Implemented (Iteration 3 — 30/04/2026)
- ✅ JWT auth (register, login, me, logout) com seed admin
- ✅ Produtos CRUD com 4 níveis de preço + **estoque com decremento automático** (cria/edita/deleta nota ajusta estoque)
- ✅ Clientes CRUD + Contas (débito anterior opcional)
- ✅ Notas CRUD com numeração automática DDMMYY + seq atômico (counter MongoDB com $max sync)
- ✅ **Index único `(user_id, order_number)`** — race condition prevenida no DB
- ✅ Editor de Nota com preview em tempo real
- ✅ Total Geral com débito anterior quando aplicável
- ✅ Página de impressão dual (Térmica 58mm + A4) + download PDF
- ✅ Tier (linha de preço) ocultado na nota impressa
- ✅ Dashboard com filtro de período (Dia/Semana/Mês/Ano)
- ✅ Cards e atalhos clicáveis no dashboard
- ✅ **Filtros na lista de Notas** (status + período Hoje/Semana/Mês/Ano + busca)
- ✅ Status de nota (Pendente/Pago/Cancelada)
- ✅ **Página Histórico do Cliente** (`/clientes/:id/historico`) com 5 cards de stats (total notas, pago, pendente, débito anterior, total em aberto) + tabela de todas as notas

## Testing
- ✅ 26/26 backend tests passando (auth, CRUD, order_number, multi-tenant, dashboard period, stock, account_balance, filters, customer history, unique index)
- ✅ Frontend 100% validado por testing agent
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
