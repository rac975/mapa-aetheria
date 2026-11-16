# Diretrizes de Arquitetura Limpa - AetheriaMap

Este documento estabelece os padrões e regras arquiteturais que regem o desenvolvimento e refatoração do código no projeto **AetheriaMap**. O objetivo é garantir separação clara de responsabilidades, manutenibilidade, testabilidade e desacoplamento.

---

## 1. Service Pattern (`src/services/`)
Toda a comunicação com a camada de dados externa (banco de dados, tempo real, autenticação e storage) deve ser isolada nesta camada.

* **Regra Fundamental**: É **estritamente proibido** chamar `supabase.from()` ou `supabase.channel()` fora da pasta `src/services/`.
* **Organização por Domínio**: Crie e mantenha arquivos específicos por domínio de negócio, tais como:
  * `fichaService.js`: Gerenciamento e persistência de fichas de personagens.
  * `combatService.js`: Rastreamento de combates, turnos, logs e tempo real.
  * `lojaService.js`: Gerenciamento de itens, inventário da loja e transações de compra/venda.
  * `npcService.js`: Criação, atualização e listagem de NPCs e adversários.
* **Responsabilidade**: Os serviços são responsáveis por montar queries, tratar retornos/erros da API do Supabase e expor métodos assíncronos claros para o restante da aplicação.

---

## 2. Domain Pure Logic (`src/domain/fabula/`)
As regras de negócio do sistema de RPG (Fabula Ultima) devem permanecer isoladas de bibliotecas e frameworks de UI ou banco.

* **Funções Puras**: Todas as fórmulas matemáticas, regras de progressão, cálculos de atributos, testes de dano, status e validações do sistema Fabula Ultima devem residir nesta pasta como funções puras JavaScript (sem efeitos colaterais).
* **Isolamento Total**: **Não importar** React (hooks, componentes) nem Supabase dentro de `src/domain/fabula/`.
* **Testabilidade**: Qualquer função de domínio deve depender exclusivamente dos argumentos que recebe e retornar um novo valor ou estado computado.

---

## 3. Custom Hooks (`src/hooks/`)
A camada de apresentação (componentes) não deve gerenciar chamadas diretas de serviços nem subscriptions complexas.

* **Gerenciamento de Estado e Ciclo de Vida**: Hooks customizados são o elo entre os Services e a UI. Devem centralizar:
  * Estados locais de carregamento (`isLoading`, `isSaving`).
  * Tratamento e feedback de erros (`error`).
  * Inscrições em canais de tempo real (`supabase.channel`) via serviços e limpeza apropriada no desmontar (`cleanup`).
* **Componentes Exclusivamente Apresentacionais**: Os componentes JSX devem apenas consumir os dados e callbacks expostos pelos hooks, focando exclusivamente na exibição e interação visual com o usuário.

---

## 4. Clean Code e Manutenibilidade
Padrões de higiene de código e limites de complexidade estrutural.

* **Limite de Tamanho de Componentes**: Eliminar componentes gigantes (máximo recomendado de **250 linhas**). Componentes que excedam esse limite devem ser decompostos em subcomponentes menores ou ter sua lógica extraída para hooks e helpers.
* **Eliminação de Código Duplicado (DRY)**: Reutilizar helpers, serviços e hooks em vez de duplicar blocos de queries ou lógica de manipulação de dados.
* **Evitar Estados Derivados Desnecessários**: Não duplicar em `useState` valores que podem ser computados diretamente a partir das props ou de outros estados durante a renderização (use cálculos diretos ou `useMemo` quando custoso).
* **Preservação de Estilo e Visual**: Durante as etapas de refatoração arquitetural, **não alterar nada no visual/CSS** nem modificar a interface que o usuário final utiliza.
