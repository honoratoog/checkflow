# Especificação de Requisitos — Sistema de Gestão de Hospedagem

**Projeto:** Gestão de Hospedagem de Pequenos Hotéis/Pousadas
**Grupo:** CHECKFLOW
**Disciplina:** Manutenção e Melhoria de Software — Prof. Rogério Elias da Cunha
**Versão:** 1.0 (Entrega N1) — atualizado com o backlog da Entrega N2

---

## 1. Introdução

Este documento especifica os requisitos do sistema de gestão de hospedagem de uma pousada de praia familiar. O objetivo principal é automatizar o processo de check-in e check-out, eliminando a falha de comunicação com a governança que faz com que quartos liberados fiquem sem limpeza.

Cada requisito recebe um identificador único (RF, RNF, RN ou RI) para rastreabilidade ao longo das entregas N1, N2 e N3.

A coluna **Feito?** indica se o requisito já foi implementado pela equipe atual (N2). Deve ser atualizada por cada integrante conforme os itens sob sua responsabilidade forem concluídos.

## 2. Requisitos Funcionais (RF)

### Cadastros — N1

| ID   | Requisito                                                                                                                                          | Prioridade |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------| ---------- |
| RF01 | O sistema deve permitir cadastrar, editar, listar e remover **quartos**, contendo no mínimo: número/identificador, tipo, capacidade e diária base. | Alta       |
| RF02 | O sistema deve permitir cadastrar, editar, listar e remover **hóspedes**, contendo no mínimo: nome, documento e contato.                           | Alta       |
| RF03 | O sistema deve associar cada quarto a um **estado atual** entre: `Livre`, `Ocupado` e `Limpeza Pendente`.                                          | Alta       |

### Reservas e estadias — N1

| ID   | Requisito                                                                                                                                       | Prioridade |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------| ---------- |
| RF04 | O sistema deve permitir registrar uma **reserva de estadia**, vinculando um hóspede a um quarto com data de entrada e data de saída previstas. | Alta       |
| RF05 | O sistema deve impedir a reserva de um quarto para um período que já possua reserva ou ocupação conflitante.                                   | Alta       |
| RF06 | O sistema deve permitir **cancelar** uma reserva antes da realização do check-in.                                                               | Média      |

### Check-in e check-out — N1

| ID   | Requisito                                                                                                                                                                 | Prioridade |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| RF07 | O sistema deve permitir realizar o **check-in** de uma reserva, alterando o estado do quarto para `Ocupado`.                                                             | Alta       |
| RF08 | O sistema deve permitir realizar o **check-out** de uma estadia, alterando o estado do quarto para `Limpeza Pendente`.                                                   | Alta       |
| RF09 | O sistema deve permitir que a governança registre a **conclusão da limpeza**, alterando o estado do quarto de `Limpeza Pendente` para `Livre`.                          | Alta       |
| RF10 | O sistema deve exibir um **painel/lista de quartos** com o estado atual de cada um, permitindo à governança identificar rapidamente os que estão em `Limpeza Pendente`. | Alta       |

### Evolução — N2/N3 (escopo original do README)

| ID   | Requisito                                                                                                                | Prioridade |
| ---- | ------------------------------------------------------------------------------------------------------------------------| ---------- |
| RF11 | O sistema deve permitir **lançar consumos de minibar** vinculados à estadia, compondo o extrato do quarto.               | N2/N3      |
| RF12 | O sistema deve gerar o **extrato de consumo** da estadia no momento do check-out, somando diárias e consumos do minibar. | N2/N3      |
| RF13 | O sistema deve aplicar **precificação dinâmica** da diária conforme o período (alta/baixa temporada).                    | N2/N3      |

### Backlog N2 — Melhorias solicitadas pelo PO (Trello)

Requisitos levantados a partir das issues criadas pelo PO no Trello para a Entrega N2.

| ID   | Requisito                                                                                                                                                                                                                                 | Prioridade | Feito? |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------ |
| RF14 | O sistema deve informar, na rota de listagem de quartos (`GET`), a quantidade de quartos livres no momento da consulta.                                                                                                                  | Média      | Não    |
| RF15 | O sistema deve exibir na tela inicial (painel) um indicador ("big number") com a quantidade de quartos livres no hotel, além dos números já existentes. *(depende de RF14)*                                                             | Média      | Não    |
| RF16 | O sistema deve corrigir a busca/filtro de quartos, adaptando o `SELECT` para permitir a filtragem simultânea por mais de uma propriedade (**número do quarto**, **tipo** e **status**), com suporte a correspondência parcial.           | Alta       | Não    |
| RF17 | O sistema deve oferecer, na tela de Quartos, uma busca avançada que permita filtrar por um ou mais campos ao mesmo tempo. *(depende da correção de RF16)*                                                                               | Média      | Não    |
| RF18 | O sistema deve validar o CPF informado no cadastro de hóspede junto a uma API de validação de CPF. Caso a validação de RG não seja viável de forma integrada, o sistema deve permitir que o usuário escolha entre CPF ou RG e validar de acordo com a escolha. | Média      | Não    |
| RF19 | O sistema deve oferecer, na tela de Reservas, uma busca avançada com campos para **hóspede**, **quarto**, **check-in** e/ou **check-out**, com botão de pesquisa.                                                                        | Média      | Não    |
| RF20 | O sistema deve expor uma rota de busca avançada de reservas, permitindo filtrar por quarto, hóspede, data de check-in e/ou data de check-out. *(pré-requisito de RF19)*                                                                  | Média      | Não    |
| RF21 | O sistema deve utilizar um componente de busca/lookup para seleção de **Quartos** e **Hóspedes** nas telas de reservas, em substituição ao componente `Select` atual.                                                                    | Baixa      | Não    |
| RF22 | O sistema deve oferecer um método de busca dos dados cadastrais de um hóspede específico.                                                                                                                                                 | Média      | Não    |
| RF23 | O sistema deve oferecer um método de edição dos dados cadastrais de um hóspede. *(pré-requisito de RF24)*                                                                                                                                 | Média      | Não    |
| RF24 | O sistema deve permitir, pela interface, editar os dados cadastrais de um hóspede já cadastrado.                                                                                                                                          | Média      | Não    |

## 3. Regras de Negócio (RN)

| ID                   | Regra                                                                                                  | Requisitos afetados |
| -------------------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| **RN01** *(crítica)* | Um quarto **não pode** ter check-in realizado se o seu status atual for `Limpeza Pendente`.            | RF07                 |
| RN02                 | O check-out só pode ser realizado para um quarto que esteja `Ocupado`.                                 | RF08                 |
| RN03                 | A transição para `Livre` só ocorre a partir de `Limpeza Pendente`, mediante confirmação da governança. | RF09                 |
| RN04                 | O check-in só pode ser realizado a partir de uma reserva válida e dentro do período previsto.          | RF07                 |
| RN05                 | Consumos de minibar só podem ser lançados enquanto a estadia estiver ativa (quarto `Ocupado`).         | RF11                 |
| RN06                 | A diária aplicada é definida pela temporada vigente na data da estadia (alta/baixa).                   | RF13                 |

## 4. Requisitos Não Funcionais (RNF)

| ID    | Requisito                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF01 | O sistema deve manter a **consistência do estado do quarto**: nenhuma operação pode deixar um quarto em estado inválido ou permitir transições fora da máquina de estados definida. |
| RNF02 | As operações de cadastro e mudança de estado devem responder em tempo adequado ao uso de balcão (percepção imediata pelo recepcionista).                                            |
| RNF03 | A interface deve ser simples e clara o bastante para uso por funcionários da pousada sem treinamento técnico.                                                                       |
| RNF04 | O sistema deve ser mantível e evolutivo, permitindo a adição dos módulos N2/N3 sem reescrita do núcleo de N1.                                                                       |

## 5. Requisitos de Infraestrutura e Processo (RI)

Itens de organização do repositório e do fluxo de desenvolvimento da equipe para a Entrega N2, também levantados a partir das issues do Trello.

| ID   | Requisito                                                                                                                                                                                | Prioridade | Feito? |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------ |
| RI01 | A equipe deve criar e configurar o repositório do projeto (estrutura de pastas e configurações iniciais).                                                                                | Alta       | Não    |
| RI02 | A equipe deve documentar o padrão de versionamento adotado: nomenclatura de branches (`main`, `dev`, `feature/`, `fix/`, `docs/`, `refactor/`) e padrão de mensagens de commit.          | Alta       | Não    |
| RI03 | O repositório deve possuir uma pipeline (CI) que execute testes unitários automaticamente (quando existentes), tente compilar o frontend e o backend, e bloqueie a conclusão do PR caso alguma dessas etapas falhe. | Média      | Não    |

## 6. Rastreabilidade Problema → Solução

| Problema de negócio                                                             | Requisito(s) que resolve     |
| -------------------------------------------------------------------------------- | ----------------------------- |
| Quartos liberados ficam sem limpeza por falta de comunicação com a governança.  | RF08, RF09, RF10, RN02, RN03 |
| Quarto ocupado sem estar pronto (sujo).                                          | RN01, RF07                   |
| Recepção não tem visão rápida de disponibilidade e não consegue localizar reservas/hóspedes/quartos com agilidade. | RF14, RF15, RF16, RF17, RF19, RF20, RF21, RF22 |
| Cadastro de hóspede aceita documentos inválidos.                                 | RF18                          |
| Dados cadastrais de hóspede não podem ser corrigidos após o cadastro.            | RF23, RF24                    |