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
- ✅ Produtos CRUD com 4 níveis de preço (azul/verde/amarela/vermelha) + **estoque (controle de quantidade)**
- ✅ Clientes CRUD (nome, endereço, telefone, email) + **Contas (débito anterior opcional)**
- ✅ Notas CRUD com numeração automática DDMMYY + seq 2 dígitos
- ✅ Editor de Nota com preview em tempo real, seleção de cliente cadastrado (auto-preenche contas), troca de tier atualiza preço unitário
- ✅ Cálculo automático de subtotal, taxa de entrega, total + **Total Geral com débito anterior quando aplicável**
- ✅ Página de impressão com **layout dual: Térmica 58mm e A4** + download PDF
- ✅ **Tier (Linha Azul/Verde/Amarela/Vermelha) ocultado na nota impressa** (visível apenas no editor)
- ✅ Dashboard com **filtro de período (Dia/Semana/Mês/Ano)** e gráfico dinâmico
- ✅ **Cards e atalhos clicáveis** no dashboard para navegação rápida
- ✅ Status de nota (Pendente/Pago/Cancelada)

## Testing
- ✅ 19/19 backend tests passando (auth, CRUD, order_number, multi-tenant, dashboard period, stock, account_balance)
- ✅ Frontend smoke completo (login, sidebar, todas as páginas, fluxo de notas, impressão térmica/A4)
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
