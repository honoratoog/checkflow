Padrão de Git, Branches e Versionamento — CheckFlow

1. Objetivo

Este documento estabelece as boas práticas de versionamento e colaboração utilizadas no projeto CheckFlow.

O objetivo é manter o código organizado, facilitar o trabalho em equipe, evitar conflitos e garantir que alterações sejam revisadas antes de serem incorporadas às branches principais.

2. Estratégia de Branches

O projeto utiliza uma estratégia simplificada baseada em Git Flow, com branches principais e branches temporárias para desenvolvimento.

Branches principais

Branch	Descrição
main	Contém a versão estável do sistema.
dev	Centraliza as funcionalidades desenvolvidas e integradas pela equipe.

Branches de trabalho

Prefixo	Finalidade	Exemplo
feat/	Desenvolvimento de novas funcionalidades	feat/cadastro-hospede
fix/	Correção de problemas	fix/filtro-avancado-quartos
docs/	Criação ou atualização de documentação	docs/padrao-git
devops/	Configurações de CI/CD e infraestrutura	devops/pipeline-ci
refactor/	Melhorias internas sem alteração de comportamento	refactor/servico-reservas
test/	Criação ou manutenção de testes	test/reservas

Regras

* Toda nova atividade deve ser desenvolvida em uma branch específica.
* As branches de trabalho devem ser criadas a partir da dev atualizada.
* Alterações devem ser integradas por Pull Requests.
* Não realizar commits diretamente na main ou na dev.
* A integração na main deve ocorrer somente após validação da equipe.
* Branches temporárias devem ser excluídas após a conclusão do merge.

3. Padrão de Commits

O projeto adota mensagens de commit inspiradas na convenção Conventional Commits.

Formato

tipo: descrição curta da alteração

Tipos

Tipo	Utilização
feat	Nova funcionalidade
fix	Correção de erro
docs	Alterações na documentação
style	Ajustes de formatação
refactor	Refatoração sem alteração funcional
test	Criação ou alteração de testes
chore	Tarefas de manutenção
devops	Alterações de infraestrutura e CI/CD

Exemplos

feat: adiciona cadastro de hóspedes
fix: corrige filtro de quartos
docs: documenta padrão de branches
refactor: reorganiza serviço de reservas
test: adiciona testes de autenticação
devops: adiciona pipeline CI para frontend e backend

Boas práticas

* Utilizar mensagens objetivas.
* Descrever a alteração realizada.
* Evitar mensagens genéricas como update, ajustes ou correção.
* Priorizar commits pequenos e relacionados a uma única alteração.

4. Fluxo de Desenvolvimento

Passo 1 — Atualizar a branch dev

Antes de iniciar uma atividade:

git switch dev
git pull --ff-only origin dev

Passo 2 — Criar uma branch

Exemplo de criação de uma funcionalidade:

git switch -c feat/nova-funcionalidade

Passo 3 — Desenvolver e verificar alterações

Após realizar as modificações:

git status

Passo 4 — Registrar alterações

Adicionar os arquivos desejados:

git add .

Criar um commit:

git commit -m "feat: adiciona nova funcionalidade"

Passo 5 — Enviar ao GitHub

git push -u origin feat/nova-funcionalidade

Passo 6 — Abrir um Pull Request

No GitHub:

1. Acessar o repositório.
2. Abrir a seção Pull Requests.
3. Selecionar New pull request.
4. Definir a branch de destino como dev.
5. Selecionar a branch que contém as alterações.
6. Informar título e descrição.
7. Solicitar revisão de outro integrante.

Passo 7 — Validar e integrar

Antes de realizar o merge:

* Verificar se a pipeline de CI foi executada com sucesso.
* Confirmar que não existem conflitos.
* Obter a revisão exigida pela equipe.
* Verificar se as alterações atendem à atividade.

Após a aprovação, o Pull Request poderá ser integrado à branch de destino.

5. Regras de Pull Requests

Os Pull Requests são utilizados para revisar e integrar alterações de maneira controlada.

Requisitos

* O PR deve possuir um título descritivo.
* A descrição deve explicar o objetivo da alteração.
* As verificações automáticas devem ser executadas.
* Os conflitos devem ser resolvidos antes da integração.
* O autor não deve aprovar sua própria alteração como única revisão.
* A integração deve respeitar as regras estabelecidas pela equipe.

Exemplo de descrição

## Objetivo
Implementar uma pipeline de integração contínua.
## Alterações
- Configuração do GitHub Actions.
- Build automático do backend.
- Build automático do frontend.
## Validação
- Build local executado com sucesso.
- Verificações do GitHub Actions aprovadas.

6. Integração Contínua (CI)

O CheckFlow utiliza GitHub Actions para automatizar verificações de integração contínua.

A pipeline configurada realiza:

1. Checkout do repositório.
2. Configuração do Node.js 22.
3. Instalação das dependências com npm ci.
4. Compilação do backend com TypeScript.
5. Build do frontend com Vite.

Os processos de build do frontend e backend são executados independentemente.

A pipeline é acionada automaticamente nos eventos configurados no workflow, incluindo Pull Requests direcionados às branches dev e main.

Critérios de validação

* O backend deve compilar sem erros.
* O frontend deve gerar o build sem erros.
* Falhas nas verificações devem ser investigadas antes da integração.

Observação: a pipeline valida a compilação e o build. A execução automática de testes unitários poderá ser adicionada futuramente, conforme a disponibilidade de testes no projeto.

7. Versionamento Semântico

O projeto poderá utilizar o padrão Semantic Versioning para identificar versões estáveis.

O formato utilizado é:

MAJOR.MINOR.PATCH

Exemplo:

1.2.3

Elemento	Significado
MAJOR	Alterações incompatíveis com versões anteriores
MINOR	Novas funcionalidades compatíveis
PATCH	Correções compatíveis

Exemplos

* 1.0.0 — Primeira versão estável.
* 1.1.0 — Inclusão de novas funcionalidades.
* 1.1.1 — Correção de um problema.
* 2.0.0 — Alterações incompatíveis com versões anteriores.

As versões poderão ser identificadas por tags Git após aprovação da equipe.

Exemplo:

git tag v1.0.0
git push origin v1.0.0

A criação de tags deve ser realizada somente para versões aprovadas.

8. Limpeza de Branches

O repositório possui a configuração de exclusão automática de branches após a conclusão de Pull Requests.

Essa configuração permite:

* Evitar o acúmulo de branches temporárias.
* Manter o repositório organizado.
* Facilitar a identificação das atividades em andamento.

A exclusão automática ocorre após o merge do Pull Request e não remove o histórico dos commits integrados.

As branches principais devem ser preservadas.

9. Responsabilidades da Equipe

Todos os integrantes devem:

* Manter suas branches atualizadas.
* Seguir o padrão de nomenclatura.
* Escrever mensagens de commit descritivas.
* Criar Pull Requests para integrar alterações.
* Respeitar o processo de revisão.
* Verificar o resultado das pipelines.
* Evitar alterações diretas nas branches principais.

O responsável por DevOps atua na manutenção das ferramentas de integração contínua, documentação dos fluxos de desenvolvimento e apoio à equipe na utilização das práticas estabelecidas.

⸻

Projeto: CheckFlow
Disciplina: Manutenção e Melhoria de Software
Documento: Padrões de Versionamento e Colaboração