# Débitos Técnicos — CheckFlow

> Gerado em: 26/10/2026  
> Escopo: estado final do projeto (todas as branches consideradas integradas)

---

## 1. Comentários desatualizados no `api.ts` — alta visibilidade

**Arquivo:** `frontend/src/api.ts`

Três comentários afirmam que funcionalidades "ainda não foram implementadas no backend", quando já foram:

```ts
// Ainda não retornada pela API; campo previsto em MODELO-DOMINIO.md para quando o backend implementar precificação.
diariaBase?: number;

// Ainda não retornada pela API; campo previsto para quando o backend passar a registrar a data de checkout.
data_checkout?: string;

// Recurso ainda não implementado no backend (MODELO-DOMINIO.md prevê ConsumoMinibar, escopo N2/N3).
export type ConsumoMinibar = { ... }
```

Na realidade: `diaria_base` é retornado por todos os endpoints de quartos, `data_checkout` é registrado no checkout e retornado nas listagens, e os endpoints de consumo de minibar existem e funcionam.

Esses comentários são os mais críticos porque são a documentação inline do contrato frontend-backend — alguém lendo o código vai concluir que essas features não existem.

**Ação:** Remover os três comentários e marcar os tipos como não-opcionais onde aplicável.

---

## 2. Valor a pagar nas reservas nunca é exibido

**Arquivos:** `frontend/src/Reservas.tsx`, `frontend/src/api.ts`

A função `calcularValorAPagar()` depende de `quarto.diariaBase`. O tipo `Quarto` em `api.ts` declara esse campo como `diariaBase?: number`, mas `api.listarQuartos()` faz `GET /quartos` que retorna o campo como `diariaBase` (o backend faz a conversão `diaria_base → diariaBase` via `formatarQuarto()`).

O problema: `calcularValorAPagar` recebe a lista `quartos` do estado do componente, que veio de `api.listarQuartos()`. Se o campo chega corretamente, o cálculo funciona. Mas `api.criarReserva()` não envia `data_checkout`, então reservas recém-criadas não têm data de saída até o checkout real ser feito — o que é correto para o fluxo, mas significa que "Valor a pagar" só aparece para reservas `Em andamento` (usando a data de hoje como checkout estimado) ou `Finalizado` com `data_checkout` preenchido.

O débito real aqui é que o **filtro de reservas não tem campo de status** — o backend aceita `?status=` mas o frontend não expõe esse filtro, então não há como filtrar somente reservas "Em andamento" para ver os valores em aberto.

**Ação:** Adicionar o campo status no formulário de filtro de Reservas.tsx e chamar `api.listarReservas()` passando os filtros como query params ao servidor em vez de filtrar client-side.

---

## 3. Todos os filtros são client-side

**Arquivos:** `frontend/src/Quartos.tsx`, `frontend/src/Reservas.tsx`

O backend implementa filtros server-side via query params em `/quartos` e `/reservas`. O frontend ignora isso completamente: sempre busca a lista toda e filtra em memória com JavaScript.

Para o escopo atual (trabalho acadêmico, dados limitados) isso funciona. O débito é de consistência: se o servidor tem a capacidade e o frontend tem o formulário de filtro, faz sentido usá-los — especialmente para evitar buscar dados desnecessários.

**Ação (baixa urgência):** Passar os valores do formulário como query params nas chamadas de `listarQuartos()` e `listarReservas()`.

---

## 4. `Quartos.tsx` não usa `diaria_base` da API — dupla fonte de verdade

**Arquivos:** `frontend/src/Quartos.tsx`, `frontend/src/precos.ts`, `backend/src/utils/precos.ts`

O componente `Quartos.tsx` calcula e exibe a diária usando `valorDiaria(q.tipo)` de `precos.ts` (tabela local no frontend), ignorando o campo `diariaBase` que vem da API. O backend por sua vez tem sua própria tabela em `utils/precos.ts`.

Isso cria duas fontes de verdade separadas: se alguém criar um quarto com diária personalizada via API (o campo `diaria_base` aceita valor customizado), o frontend vai continuar exibindo o valor padrão por tipo, não o valor real cadastrado.

Além disso, `criarQuarto()` em `api.ts` não envia `diaria_base` — sempre cria com a diária padrão do backend, descartando qualquer intenção de valor customizado pela UI.

**Ação:** Em `Quartos.tsx`, usar `q.diariaBase ?? valorDiaria(q.tipo)` em vez de só `valorDiaria(q.tipo)`. Avaliar se faz sentido expor um campo de diária no formulário de criação de quarto.

---

## 5. Edição de quarto não existe no frontend

**Arquivo:** `frontend/src/Quartos.tsx`

O backend tem `PUT /quartos/:id` que permite editar número, tipo e `diaria_base`. O frontend não expõe nenhum botão de edição — só criação, finalização de limpeza e exclusão.

**Ação:** Adicionar edição de quarto em `Quartos.tsx` (similar ao padrão já implementado em `Hospedes.tsx`).

---

## 6. Edição de consumo de minibar não existe no frontend

**Arquivo:** `frontend/src/Minibar.tsx`

O backend tem `PUT /consumos/:id` com regra de negócio (bloqueia edição se reserva finalizada). O frontend só lança e exclui consumos — sem botão editar.

**Ação:** Adicionar edição inline de consumo em `Minibar.tsx`.

---

## 7. Campo `tipo_documento` retornado mas ignorado pelo frontend

**Arquivos:** `backend/src/routes/hospedes.ts`, `frontend/src/Hospedes.tsx`, `frontend/src/api.ts`

O backend adiciona `tipo_documento` ao banco quando valida CPF/RG, e retorna esse campo em todas as listagens. O frontend não exibe nem usa essa informação em nenhum lugar — nem na tabela de hóspedes, nem no formulário.

O tipo `Hospede` em `api.ts` também não declara o campo, então TypeScript sequer sabe que ele existe.

**Ação:** Adicionar `tipo_documento?: string` ao tipo `Hospede` em `api.ts` e exibir o tipo na tabela de hóspedes (ex: badge "CPF" / "RG").

---

## 8. Conflito de reserva só valida `data_checkin` exata

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

## 9. `errorHandler` usa `console.log` em vez de `console.error`

**Arquivo:** `backend/src/routes/errorhandler.ts`

O middleware de erro usa `console.log` para registrar exceções inesperadas. Em produção isso torna mais difícil filtrar erros reais de logs normais.

**Ação:** Substituir por `console.error`.

---

## 10. `confirm()` nativo para exclusões

**Arquivos:** `frontend/src/Hospedes.tsx`, `frontend/src/Quartos.tsx`, `frontend/src/Reservas.tsx`

Confirmações de exclusão usam `window.confirm()` — bloqueante, não estilizável, sem acessibilidade e com comportamento inconsistente entre browsers (alguns blocos em iframe).

**Ação:** Substituir por um modal de confirmação dentro da UI (ou no mínimo um botão de confirmação inline no card).

---

## 11. Sem paginação em nenhum endpoint

**Arquivos:** `backend/src/routes/*.ts`

Todos os endpoints de listagem retornam todos os registros sem limite. Para um trabalho acadêmico é aceitável, mas deve ser mencionado como limitação consciente.

---

## 12. Sem autenticação

Nenhum endpoint tem proteção de autenticação ou autorização. Qualquer pessoa com acesso à rede pode criar, editar e excluir dados. Para o escopo do trabalho (intranet de pousada) é uma decisão válida se explicitada, mas deve constar como limitação.

---

## Resumo priorizado

| Prioridade | Débito | Arquivo(s) |
|---|---|---|
| 🟠 Alto | Valor a pagar nunca exibido por falta do filtro de status | `Reservas.tsx` |
| 🟠 Alto | Dupla fonte de verdade para diária do quarto | `Quartos.tsx`, `precos.ts` |
| 🟠 Alto | Conflito de reserva não detecta sobreposição de datas | `reservas.ts` |
| 🟡 Médio | Edição de quarto ausente no frontend | `Quartos.tsx` |
| 🟡 Médio | Edição de consumo ausente no frontend | `Minibar.tsx` |
| 🟡 Médio | `tipo_documento` ignorado pelo frontend | `Hospedes.tsx`, `api.ts` |
| 🟡 Médio | Filtros client-side ignorando capacidade do servidor | `Quartos.tsx`, `Reservas.tsx` |
| 🟢 Baixo | `confirm()` nativo para exclusões | vários |
| 🟢 Baixo | `console.log` no error handler | `errorhandler.ts` |
| 🟢 Baixo | Sem paginação | backend routes |
| 🟢 Baixo | Sem autenticação | backend |
