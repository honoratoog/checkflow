# Débitos Técnicos — CheckFlow

> Gerado em: 26/10/2026  
> Escopo: estado final do projeto (todas as branches consideradas integradas)

---

## 1. Conflito de reserva só valida `data_checkin` exata

**Arquivo:** `backend/src/routes/reservas.ts`

A verificação de conflito ao criar reserva é:

```sql
SELECT id FROM reservas
WHERE quarto_id = ? AND data_checkin = ? AND status != 'Finalizado'
```

Isso rejeita duas reservas com o mesmo check-in no mesmo quarto, mas **não detecta sobreposição de intervalos**. Exemplo: reserva A (check-in 10/11, checkout 15/11) e reserva B (check-in 12/11) no mesmo quarto — B passa pela validação normalmente, mesmo o quarto estando ocupado nessa data.

Para o fluxo atual (check-in manual que altera o status do quarto para "Ocupado") o bug fica parcialmente mitigado pelo status, mas reservas com status "Reservado" futuras ainda podem ser criadas para o mesmo quarto em datas sobrepostas.

**Ação:** Verificar sobreposição de intervalos (`data_checkin` de B < `data_checkout` de A e `data_checkout` de B > `data_checkin` de A).

---

## 2. `errorHandler` usa `console.log` em vez de `console.error`

**Arquivo:** `backend/src/routes/errorhandler.ts`

O middleware de erro usa `console.log` para registrar exceções inesperadas. Em produção isso torna mais difícil filtrar erros reais de logs normais.

**Ação:** Substituir por `console.error`.

---

## 3. `confirm()` nativo para exclusões

**Arquivos:** `frontend/src/Hospedes.tsx`, `frontend/src/Quartos.tsx`, `frontend/src/Reservas.tsx`

Confirmações de exclusão usam `window.confirm()` — bloqueante, não estilizável, sem acessibilidade e com comportamento inconsistente entre browsers (alguns blocos em iframe).

**Ação:** Substituir por um modal de confirmação dentro da UI (ou no mínimo um botão de confirmação inline no card).

---

## 4. Sem paginação em nenhum endpoint

**Arquivos:** `backend/src/routes/*.ts`

Todos os endpoints de listagem retornam todos os registros sem limite. 

---

## 5. Sem autenticação

Nenhum endpoint tem proteção de autenticação ou autorização. Qualquer pessoa com acesso à rede pode criar, editar e excluir dados. Para o escopo do trabalho (intranet de pousada) é uma decisão válida se explicitada, mas deve constar como limitação.

---

## Resumo priorizado

| Prioridade | Débito | Arquivo(s) |
|---|---|---
| 🟠 Alto | Conflito de reserva não detecta sobreposição de datas | `reservas.ts` |
| 🟢 Baixo | `confirm()` nativo para exclusões | vários |
| 🟢 Baixo | `console.log` no error handler | `errorhandler.ts` |
| 🟢 Baixo | Sem paginação | backend routes |
| 🟢 Baixo | Sem autenticação | backend |
