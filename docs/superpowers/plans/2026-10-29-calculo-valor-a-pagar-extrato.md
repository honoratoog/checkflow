# Implementação do Cálculo de Valor a Pagar ao Fim da Estadia e Extrato de Check-out

**Goal:** Implementar o cálculo completo do valor a pagar ao fim da estadia `(diária * dias hospedado) + consumos minibar`, expondo os dados calculados no backend e refletindo o total na coluna da tabela de reservas, com um modal de confirmação de check-out exibindo o extrato detalhado.

**Architecture:** 
- No backend, criar módulo utilitário de cálculo financeiro da estadia, expor a rota `GET /reservas/:id/extrato` e enriquecer a listagem `GET /reservas` com os valores calculados (`total_consumos`, `subtotal_diarias`, `valor_total`).
- No frontend, atualizar os tipos da API, refletir o valor total na tabela e adicionar o modal de confirmação com extrato detalhado ao acionar o check-out.

**Tech Stack:** Node.js / Express, TypeScript, Better-SQLite3, React, Tailwind CSS.

---

### Task 1: Módulo de Cálculo Financeiro e Rota de Extrato no Backend

- **Deliverable:** Função utilitária pura de cálculo da estadia (`calcularExtratoReserva`) com testes automatizados, e endpoint `GET /reservas/:id/extrato` retornando o resumo detalhado da estadia e consumos.
- **Files:**
  - Create: `backend/src/utils/estadia.ts`
  - Create: `backend/src/utils/estadia.test.ts`
  - Modify: `backend/src/routes/reservas.ts`
- **Steps:**
  1. Escrever testes em `backend/src/utils/estadia.test.ts` cobrindo cenários com diária, quantidade de dias (mínimo 1), múltiplos consumos de frigobar e reserva sem consumos.
  2. Implementar `calcularExtratoReserva` em `backend/src/utils/estadia.ts` com a fórmula `(diaria * dias_hospedado) + consumos_minibar`.
  3. Adicionar a rota `GET /reservas/:id/extrato` em `backend/src/routes/reservas.ts`.
  4. Executar os testes via `tsx backend/src/utils/estadia.test.ts` e certificar que todos passam.

---

### Task 2: Enriquecer Listagem de Reservas no Backend com Totais

- **Deliverable:** Rota `GET /reservas` e `GET /reservas/:id` retornando `total_consumos`, `subtotal_diarias` e `valor_total` para que a listagem de reservas já traga o total calculado.
- **Files:**
  - Modify: `backend/src/routes/reservas.ts`
- **Steps:**
  1. Alterar a query SQL e mapeamento em `GET /reservas` para incluir `diaria_base` do quarto e a soma de consumos da reserva.
  2. Aplicar o cálculo de `valor_total` para cada reserva retornada.
  3. Validar a compilação do backend com `npm run build` na pasta `backend`.

---

### Task 3: Integração no Frontend (Tipos e Chamada de API)

- **Deliverable:** Atualização das tipagens em `frontend/src/api.ts` para suportar `ExtratoReserva` e os novos campos de `Reserva`, além do método `api.obterExtrato(id)`.
- **Files:**
  - Modify: `frontend/src/api.ts`
- **Steps:**
  1. Definir a interface `ExtratoReserva` e `ItemConsumoExtrato` em `frontend/src/api.ts`.
  2. Atualizar a interface `Reserva` com `valor_total?: number`, `total_consumos?: number`, `subtotal_diarias?: number`.
  3. Adicionar o método `api.obterExtrato(id: number): Promise<ExtratoReserva>`.

---

### Task 4: Atualização da Tabela de Reservas e Modal de Extrato de Check-out

- **Deliverable:** Coluna "Valor a pagar" exibindo o total completo na tabela de reservas, e modal de confirmação de check-out exibindo o extrato discriminado (diárias, consumos do minibar e total) com botões de Cancelar e Confirmar.
- **Files:**
  - Modify: `frontend/src/Reservas.tsx`
- **Steps:**
  1. Atualizar a coluna "Valor a pagar" para exibir o total vindo da API (ou calculado com consumos).
  2. Interceptar o clique em "Check-out" para abrir o modal de confirmação com carregamento do extrato via `api.obterExtrato`.
  3. Desenhar o modal com Tailwind seguindo o padrão visual do sistema (diárias calculadas, itens de minibar, subtotais e valor total destacado).
  4. Conectar o botão "Confirmar Check-out" do modal à execução real de `fazerCheckout`, fechando o modal e atualizando a listagem.
  5. Validar a compilação do frontend com `npm run build` na pasta `frontend`.

---

### Task 5: Verificação Integrada e Testes End-to-End

- **Deliverable:** Testes automatizados executados com sucesso e verificação de integridade de ponta a ponta sem erros de build.
- **Steps:**
  1. Executar os testes unitários do backend.
  2. Rodar `npm run build` no backend e no frontend.
  3. Confirmar que a pipeline CI local passa sem pendências.

