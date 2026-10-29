HANDOFF — CHECKFLOW v2.0

1. OBJETIVO DO DOCUMENTO

Este documento tem como objetivo facilitar a transferência do projeto CHECKFLOW para outra equipe, permitindo que novos desenvolvedores compreendam o funcionamento do sistema, sua arquitetura, regras de negócio, estrutura do código, forma de execução, limitações atuais e próximos passos.

A intenção é que a equipe receptora consiga instalar, executar, testar e evoluir o projeto com o mínimo possível de dependência da equipe responsável pelas entregas anteriores.


2. VISÃO GERAL DO PROJETO

O CHECKFLOW é um sistema de gestão de hospedagem voltado para pequenos hotéis e pousadas.

O problema principal tratado pelo sistema é a falta de comunicação entre a recepção e a governança após o check-out de um hóspede.

Sem um controle adequado, um quarto poderia ser considerado disponível antes da realização da limpeza.

Para resolver esse problema, o sistema controla o estado dos quartos durante todo o processo de hospedagem.

Fluxo principal do quarto:

Livre → Ocupado → Limpeza Pendente → Livre

- Livre: quarto disponível para hospedagem;
- Ocupado: hóspede realizou check-in;
- Limpeza Pendente: hóspede realizou check-out, mas o quarto ainda não foi limpo;
- Livre novamente: governança concluiu a limpeza.

Uma das principais regras do sistema é impedir um novo check-in enquanto o quarto estiver com status Limpeza Pendente.

Além do controle do ciclo do quarto, a versão atual passou a tratar a parte financeira e de consumo da estadia: diária por tipo de quarto, registro de consumo do minibar e cálculo do valor a pagar.


3. ESCOPO IMPLEMENTADO

Funcionalidades disponíveis na versão atual:

Quartos:
- Cadastro de quartos com diária por tipo;
- Listagem de quartos com busca avançada (número, tipo, status);
- Edição de quartos (número, tipo e diária);
- Registro da conclusão da limpeza;
- Exclusão de quartos (com proteção contra reservas vinculadas).

Hóspedes:
- Cadastro de hóspedes com validação de CPF e RG;
- Listagem e busca de hóspedes;
- Edição de dados cadastrais do hóspede;
- Exclusão de hóspedes (com proteção contra reservas vinculadas).

Reservas:
- Criação de reservas com data de check-in e data de check-out opcional;
- Listagem de reservas com busca avançada (hóspede, quarto, check-in, check-out);
- Realização de check-in;
- Realização de check-out (registra a data de saída);
- Cálculo do valor a pagar com base nas diárias;
- Exclusão de reservas.

Minibar:
- Lançamento de consumo em reservas em andamento;
- Listagem de consumos por reserva;
- Edição e exclusão de consumos (bloqueados após finalização da reserva).

Controle de estado e regras:
- Controle do ciclo de vida do quarto;
- Bloqueio de check-in em quarto ocupado ou com limpeza pendente;
- Validação de check-in repetido;
- Validação de reservas conflitantes;
- Painel inicial com indicadores gerais da pousada.

Infraestrutura:
- Pipeline de CI no GitHub Actions (build de frontend e backend);
- Testes da API utilizando Postman.


4. FUNCIONALIDADES PREVISTAS PARA EVOLUÇÕES FUTURAS

Algumas funcionalidades ainda não fazem parte da implementação atual:

- Extrato consolidado da estadia (diárias + minibar em um único documento);
- Precificação dinâmica por alta e baixa temporada;
- Autenticação e perfis de usuário;
- Paginação nas listagens;
- Suíte de testes automatizados integrada ao código.


5. TECNOLOGIAS UTILIZADAS

Frontend:
- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- Fetch API.

Backend:
- Node.js;
- TypeScript;
- Express;
- CORS;
- better-sqlite3;
- TSX.

Banco de dados:
- SQLite.

Testes:
- Postman.

Integração contínua:
- GitHub Actions.

Versionamento:
- Git;
- GitHub.


6. ARQUITETURA DA APLICAÇÃO

A aplicação está dividida em frontend, backend e banco de dados.

Usuário
  ↓
Frontend React
  ↓
API REST
  ↓
Backend Node.js + Express
  ↓
Banco SQLite

O frontend realiza requisições HTTP para o backend.

O backend é responsável pela aplicação das regras de negócio e pelo acesso ao banco de dados.


7. ESTRUTURA PRINCIPAL DO PROJETO

checkflow/
├── README.md
├── frontend/
│   └── src/
│       ├── api.ts
│       ├── App.tsx
│       ├── Home.tsx
│       ├── Quartos.tsx
│       ├── Hospedes.tsx
│       ├── Reservas.tsx
│       ├── Minibar.tsx
│       ├── Lookup.tsx
│       └── precos.ts
├── backend/
│   └── src/
│       ├── db.ts
│       ├── server.ts
│       ├── routes/
│       │   ├── quartos.ts
│       │   ├── hospedes.ts
│       │   ├── reservas.ts
│       │   ├── consumos.ts
│       │   └── errorhandler.ts
│       └── utils/
│           ├── precos.ts
│           └── documentos.ts
├── postman/
├── docs/
├── .github/workflows/ci.yml
├── DEBITOS-TECNICOS.md
├── Handoff.md
└── .gitignore


8. PRÉ-REQUISITOS

Para executar o projeto é necessário possuir:

- Node.js (versão 22 ou superior, alinhada com o CI);
- npm;
- Git.

Para verificar a instalação:

node --version
npm --version
git --version


9. COMO CLONAR O PROJETO

git clone https://github.com/joaofsdev/checkflow.git

Depois:

cd checkflow


10. COMO EXECUTAR O BACKEND

Entre na pasta:

cd backend

Instale as dependências:

npm install

Execute o servidor:

npm run dev

O backend será executado em:

http://localhost:3001

O terminal deve permanecer aberto durante a utilização do sistema.


11. COMO EXECUTAR O FRONTEND

Abra outro terminal.

Entre na pasta:

cd frontend

Instale as dependências:

npm install

Execute:

npm run dev

O Vite exibirá o endereço da aplicação.

Normalmente:

http://localhost:5173

O backend deve estar executando para que o frontend consiga acessar os dados.

A URL da API pode ser configurada pela variável de ambiente VITE_API_URL (ver frontend/.env.example). Se não definida, assume http://localhost:3001.


12. BANCO DE DADOS

O projeto utiliza SQLite.

O arquivo do banco está localizado em:

backend/pousada.db

O acesso ao banco é configurado em:

backend/src/db.ts

As principais entidades do sistema são:

- Quartos;
- Hóspedes;
- Reservas;
- Consumos de minibar.

O arquivo db.ts possui migrações automáticas não destrutivas (PRAGMA + ALTER TABLE) que adicionam, em bancos pré-existentes, as colunas:
- diaria_base em quartos;
- tipo_documento em hospedes;
- data_checkout em reservas.

Quartos sem diária definida recebem a diária padrão do tipo durante a migração.


13. ENTIDADE QUARTOS

Principais informações:

- ID;
- Número;
- Tipo;
- Status;
- Diária base (diaria_base).

Estados possíveis:

- Livre;
- Ocupado;
- Limpeza Pendente.


14. ENTIDADE HÓSPEDES

Principais informações:

- ID;
- Nome;
- Documento;
- Tipo do documento (CPF ou RG);
- Telefone.

O sistema impede o cadastro de dois hóspedes com o mesmo documento e valida CPF (dígitos verificadores) e RG no cadastro e na edição.


15. ENTIDADE RESERVAS

Principais informações:

- ID;
- Quarto;
- Hóspede;
- Data de check-in;
- Data de check-out;
- Status.

Status utilizados:

- Reservado;
- Em andamento;
- Finalizado.


15A. ENTIDADE CONSUMOS DE MINIBAR

Principais informações:

- ID;
- Reserva relacionada (reserva_id);
- Item;
- Quantidade;
- Valor unitário.

Consumos são vinculados a uma reserva e removidos em cascata caso a reserva seja excluída. Só podem ser lançados em reservas Em andamento e não podem ser alterados após a finalização.


16. RELACIONAMENTOS

HÓSPEDE 1 ───── N RESERVAS N ───── 1 QUARTO
RESERVA 1 ───── N CONSUMOS DE MINIBAR

Um hóspede pode possuir várias reservas.

Um quarto pode possuir várias reservas ao longo do tempo.

Cada reserva pertence a um hóspede e a um quarto, e pode ter vários consumos de minibar.


17. PRINCIPAIS REGRAS DE NEGÓCIO

Check-in:

Para realizar o check-in:

- A reserva precisa existir;
- A reserva deve estar com status Reservado;
- O quarto não pode estar ocupado;
- O quarto não pode estar com limpeza pendente.

Após o check-in:

Reserva: Reservado → Em andamento
Quarto: Livre → Ocupado


18. CHECK-OUT

Após o check-out:

Reserva → Finalizado
Quarto → Limpeza Pendente

A data de check-out é registrada no momento da finalização (caso não tenha sido informada antes).

O quarto não fica imediatamente disponível.


19. CONCLUSÃO DA LIMPEZA

Após a governança concluir a limpeza:

Limpeza Pendente → Livre

Somente depois dessa etapa o quarto deve voltar a receber hóspedes.


20. RESERVAS CONFLITANTES

O sistema possui validação para evitar reserva repetida para:

- Mesmo quarto;
- Mesma data de check-in;
- Reserva ainda não finalizada.

Observação: a validação atual compara a data de check-in exata e ainda não detecta sobreposição de intervalos entre reservas (ver débitos técnicos).


21. EXCLUSÃO DE QUARTOS

Um quarto não pode ser excluído caso possua reservas vinculadas.


22. EXCLUSÃO DE HÓSPEDES

Um hóspede não pode ser excluído caso possua reservas vinculadas.


23. API

Endereço base:

http://localhost:3001

QUARTOS

GET /quartos
Lista os quartos. Aceita busca por query params: ?numero=&tipo=&status=

GET /quartos/:id
Busca um quarto por ID.

POST /quartos
Cadastra um quarto. Se a diária não for informada, usa o valor padrão do tipo.

Exemplo:
{
  "numero": "101",
  "tipo": "Casal"
}

PUT /quartos/:id
Edita número, tipo e diária de um quarto.

PATCH /quartos/:id/limpeza
Registra a conclusão da limpeza.

DELETE /quartos/:id
Exclui um quarto quando permitido.


24. HÓSPEDES

GET /hospedes
Lista hóspedes.

GET /hospedes/:id
Busca um hóspede por ID.

POST /hospedes
Cadastra hóspede. Valida CPF/RG.

Exemplo:
{
  "nome": "Maria da Silva",
  "documento": "12345678909",
  "telefone": "47999999999"
}

PUT /hospedes/:id
Edita os dados cadastrais do hóspede.

DELETE /hospedes/:id
Exclui hóspede quando permitido.


25. RESERVAS

GET /reservas
Lista reservas. Aceita busca por query params: ?quarto=&hospede=&checkin=&checkout=&status=

GET /reservas/:id
Busca uma reserva por ID.

POST /reservas
Cria reserva. A data de check-out é opcional.

Exemplo:
{
  "quarto_id": 1,
  "hospede_id": 1,
  "data_checkin": "2026-09-20"
}

POST /reservas/:id/checkin
Realiza check-in.

POST /reservas/:id/checkout
Realiza check-out.

DELETE /reservas/:id
Exclui reserva.

CONSUMOS DE MINIBAR

GET /reservas/:id/consumos
Lista os consumos de uma reserva.

POST /reservas/:id/consumos
Lança um consumo (apenas em reservas Em andamento).

Exemplo:
{
  "item": "Refrigerante",
  "quantidade": 2,
  "valor_unitario": 8.5
}

GET /consumos/:id
Busca um consumo por ID.

PUT /consumos/:id
Edita um consumo (bloqueado se a reserva estiver Finalizada).

DELETE /consumos/:id
Exclui um consumo (bloqueado se a reserva estiver Finalizada).


26. FRONTEND

O frontend possui cinco áreas principais.

Início:
- Quartos livres;
- Quartos ocupados;
- Quartos com limpeza pendente;
- Quantidade de hóspedes;
- Quantidade de reservas;
- Reservas em andamento.

Quartos:
- Cadastrar quartos com visualização da diária;
- Listar quartos e buscar por número, tipo e status;
- Editar quartos;
- Visualizar status;
- Registrar conclusão da limpeza;
- Excluir quartos quando permitido.

Hóspedes:
- Cadastrar hóspedes com validação de documento;
- Listar e buscar hóspedes;
- Editar dados cadastrais;
- Excluir hóspedes.

Reservas:
- Criar reserva (selecionar quarto, hóspede e data);
- Buscar reservas por hóspede, quarto e datas;
- Visualizar o valor a pagar;
- Realizar check-in;
- Realizar check-out;
- Excluir reserva.

Minibar:
- Selecionar uma estadia em andamento;
- Lançar consumo (item, quantidade, valor);
- Listar consumos com subtotal;
- Excluir consumo.


27. TESTES

Os testes da API estão organizados na pasta:

postman/

Existem testes para:

- Cadastro de hóspedes;
- Documento repetido;
- Validação de CPF e RG;
- Cadastro de quartos com diária personalizada;
- Número de quarto repetido;
- Edição de quartos;
- Cadastro sem campos obrigatórios;
- Criação de reserva (com e sem data de check-out);
- Busca avançada de reservas;
- Reserva conflitante;
- Check-in;
- Check-in repetido;
- Check-out;
- Check-in em quarto ocupado;
- Check-in com limpeza pendente;
- Conclusão da limpeza;
- Lançamento, edição e exclusão de consumo de minibar;
- Exclusão de quartos, hóspedes e reservas.

Além dos testes manuais, o repositório possui um pipeline de CI (.github/workflows/ci.yml) que compila frontend e backend a cada push e pull request para dev e main.


28. FLUXO RECOMENDADO DE TESTE

1. Iniciar backend;
2. Iniciar frontend;
3. Cadastrar um quarto;
4. Cadastrar um hóspede (CPF ou RG válido);
5. Criar uma reserva;
6. Fazer check-in;
7. Confirmar que o quarto ficou Ocupado;
8. Lançar um consumo de minibar na reserva;
9. Conferir o valor a pagar na listagem de reservas;
10. Fazer check-out;
11. Confirmar que ficou Limpeza Pendente;
12. Tentar novo check-in;
13. Confirmar que o sistema bloqueia;
14. Marcar limpeza como concluída;
15. Confirmar que o quarto ficou Livre;
16. Realizar novo check-in.


29. DÉBITOS TÉCNICOS CONHECIDOS

Os débitos técnicos detalhados estão documentados em DEBITOS-TECNICOS.md. Resumo dos principais:

- Comentários desatualizados em frontend/src/api.ts afirmando que diária, data de check-out e minibar "não foram implementados" — quando já estão;
- O valor a pagar das reservas depende do filtro de status, que ainda não existe no frontend;
- Diária do quarto possui dupla fonte de verdade (tabela local no frontend x diaria_base da API);
- Verificação de conflito de reserva não detecta sobreposição de intervalos de datas;
- Filtros de quartos e reservas são aplicados no cliente, sem usar os filtros do servidor;
- Campo tipo_documento é retornado pela API mas não exibido no frontend;
- Confirmações de exclusão usam confirm() nativo;
- O error handler usa console.log em vez de console.error;
- Não há paginação nas listagens;
- O sistema ainda não possui autenticação;
- Não há suíte de testes automatizados integrada ao código (apenas build no CI).


30. MELHORIAS FUTURAS

Recomenda-se, nas próximas evoluções:

1. Corrigir os comentários desatualizados em api.ts;
2. Adicionar filtro por status nas reservas e usar os filtros server-side;
3. Unificar a fonte da diária (usar diaria_base da API no frontend);
4. Melhorar a verificação de conflito de reservas (sobreposição de datas);
5. Expor edição de quarto e de consumo de minibar no frontend;
6. Exibir o tipo de documento do hóspede;
7. Adicionar testes automatizados e integrá-los ao CI;
8. Implementar o extrato consolidado da estadia;
9. Revisar documentação após cada alteração.


31. FUNCIONALIDADES AINDA PREVISTAS

Extrato consolidado:
- Diárias;
- Consumo do minibar;
- Valor total em um único documento.

Precificação dinâmica:
- Alta temporada;
- Baixa temporada.

Autenticação:
- Controle de acesso e perfis de usuário.


32. CUIDADOS COM O BANCO

O arquivo:

backend/pousada.db

pode conter dados utilizados durante desenvolvimento e demonstração.

Antes de excluir ou substituir o banco:

- Verificar se os dados são necessários;
- Criar backup se necessário;
- Evitar alterações diretamente no banco sem compreender as regras da aplicação.

Caso um banco antigo apresente inconsistência após a atualização, as migrações automáticas em db.ts tentam adicionar as novas colunas; em último caso, apagar o pousada.db local recria o schema do zero.


33. VERSIONAMENTO

O projeto segue um fluxo de branches com integração em dev e entregas consolidadas em main.

Recomendações:
- Criar uma branch por funcionalidade a partir de dev;
- Abrir pull request para dev;
- Congelar versões entregues por tag (ex.: v1.0, v2.0);
- Não alterar tags já publicadas.


34. GESTÃO DAS TAREFAS

A equipe utiliza um quadro de gestão com fluxo semelhante a:

Backlog → A Fazer → Em Andamento → Em Testes → Concluído

As atividades devem possuir:

- Responsável;
- Descrição;
- Status;
- Evidência de conclusão.


35. EQUIPE RESPONSÁVEL

A composição e as responsabilidades da equipe estão registradas em MatrizDeResponsabilidades.md.


36. CHECKLIST PARA A EQUIPE QUE RECEBER O PROJETO

- Clonar o repositório;
- Instalar dependências do backend;
- Instalar dependências do frontend;
- Iniciar backend;
- Iniciar frontend;
- Verificar conexão com a API;
- Testar cadastro de quarto;
- Testar cadastro de hóspede (CPF/RG);
- Testar criação de reserva;
- Testar check-in;
- Testar lançamento de consumo de minibar;
- Testar check-out;
- Testar limpeza;
- Revisar a coleção do Postman;
- Verificar o pipeline de CI;
- Ler os requisitos, o modelo de domínio e o glossário;
- Revisar os débitos técnicos (DEBITOS-TECNICOS.md);
- Criar branch antes de iniciar novas alterações.


37. CRITÉRIOS PARA CONSIDERAR O HANDOFF CONCLUÍDO

O handoff será considerado bem-sucedido se a próxima equipe conseguir:

- Clonar o projeto;
- Instalar as dependências;
- Iniciar frontend e backend;
- Compreender a estrutura do sistema;
- Utilizar a interface;
- Criar hóspedes e quartos;
- Criar reservas;
- Executar check-in e check-out;
- Lançar consumos de minibar;
- Entender o processo de limpeza;
- Identificar as principais regras de negócio;
- Executar os testes existentes;
- Identificar os débitos técnicos;
- Continuar o desenvolvimento sem depender diretamente da equipe anterior.


38. RESUMO TÉCNICO

Projeto: CHECKFLOW
Domínio: Gestão de hospedagem

Frontend:
React + TypeScript + Vite

Backend:
Node.js + Express + TypeScript

Banco:
SQLite

Backend:
http://localhost:3001

Frontend:
http://localhost:5173

Banco:
backend/pousada.db

Testes:
postman/ + CI no GitHub Actions

Fluxo principal:
Livre → Ocupado → Limpeza Pendente → Livre

Regra crítica:
Quarto com limpeza pendente não pode receber novo check-in.

Versão:
v2.0


39. ENCERRAMENTO

A versão atual do CHECKFLOW consolida a base funcional do sistema de gestão de hospedagem e adiciona o controle financeiro e de consumo da estadia: diárias por tipo de quarto, validação de documentos, edição de cadastros, busca avançada e registro de consumo do minibar.

O principal objetivo mantido foi controlar corretamente o ciclo de utilização dos quartos, principalmente no processo entre check-out, limpeza e nova hospedagem.

A próxima equipe deverá preservar essa regra central ao realizar novas evoluções e, antes de iniciar novas funcionalidades, revisar os débitos técnicos registrados em DEBITOS-TECNICOS.md para garantir a estabilidade do que já existe.
