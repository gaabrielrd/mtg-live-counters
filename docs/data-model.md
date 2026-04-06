# Magic Life Counter — Modelo de Dados

## 1. Objetivo

Este documento detalha o modelo lógico de dados da plataforma e fecha a estratégia inicial de persistência em DynamoDB. Ele complementa a arquitetura definida em [`docs/architecture.md`](/Users/gaabrielrd/Dev/pessoal/mtg-live-counters/docs/architecture.md) e serve como referência para `apps/api`, `apps/realtime`, `packages/shared` e `infra`.

Objetivos desta modelagem:

- suportar criação de partidas
- suportar entrada por código ou link
- suportar atualização de vida com persistência autoritativa
- manter trilha de auditoria de eventos
- viabilizar listagem pública sem scan geral
- fechar contratos compartilhados mínimos para frontend, API e realtime

## 2. Regras de negócio e defaults

Defaults oficiais:

- `initialLifeTotal = 40`
- `maxPlayers = 4`
- limite superior de jogadores por partida = `8`

Regras principais:

- apenas usuários autenticados podem criar ou entrar em partidas
- `maxPlayers` deve estar entre `2` e `8`
- partidas públicas podem aparecer na listagem apenas se estiverem com status compatível e com vagas abertas
- `MatchPlayer.currentLifeTotal` é o estado corrente autoritativo
- `MatchEvent` é trilha de auditoria e não a fonte primária de reconstrução em leituras normais
- atualizações de vida sempre alteram `MatchPlayer` e geram `MatchEvent`

## 3. Entidades de domínio

### 3.1 User

Representa o perfil local da aplicação para um usuário autenticado via Cognito.

Campos:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `userId` | string | sim | Identificador interno estável do usuário na aplicação. |
| `displayName` | string | sim | Nome exibido nas telas e snapshots de partida. |
| `email` | string | sim | Email principal do usuário. |
| `provider` | `cognito` \| `google` | sim | Provider de autenticação de origem. |
| `providerSubject` | string | sim | Identificador do usuário no provider autenticador. |
| `status` | `active` \| `disabled` | sim | Situação do perfil local na aplicação. |
| `createdAt` | string | sim | Timestamp ISO-8601 de criação. |
| `updatedAt` | string | sim | Timestamp ISO-8601 da última atualização. |
| `lastLoginAt` | string | não | Timestamp ISO-8601 do último login observado pela aplicação. |

Relações:

- um `User` pode ser owner de várias `Match`
- um `User` pode participar de várias `Match` através de `MatchPlayer`

Observação:

- a identidade autoritativa continua no Cognito; esta entidade apenas guarda metadados úteis da aplicação

### 3.2 Match

Representa a partida e seus metadados operacionais.

Campos:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `matchId` | string | sim | Identificador único da partida. |
| `code` | string | sim | Código curto único para entrada manual. |
| `shareToken` | string | sim | Token seguro para entrada via link sem expor `matchId`. |
| `ownerUserId` | string | sim | Usuário criador da partida. |
| `initialLifeTotal` | number | sim | Total inicial aplicado aos jogadores ao entrar na partida. |
| `maxPlayers` | number | sim | Capacidade da partida. |
| `currentPlayers` | number | sim | Quantidade atual de jogadores ativos na partida. |
| `isPublic` | boolean | sim | Define se a partida pode ser listada publicamente. |
| `status` | `waiting` \| `active` \| `finished` \| `cancelled` | sim | Estado atual da partida. |
| `createdAt` | string | sim | Timestamp ISO-8601 de criação. |
| `updatedAt` | string | sim | Timestamp ISO-8601 da última atualização. |
| `startedAt` | string | não | Timestamp ISO-8601 de início da partida. |
| `endedAt` | string | não | Timestamp ISO-8601 de encerramento da partida. |

Regras:

- `initialLifeTotal` usa default `40`
- `maxPlayers` usa default `4`
- `maxPlayers` nunca pode exceder `8`
- `currentPlayers` nunca pode ser maior que `maxPlayers`
- partidas privadas não entram em listagem pública

### 3.3 MatchPlayer

Representa o vínculo de um usuário com uma partida e guarda o estado corrente do jogador no agregado.

Campos:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `matchId` | string | sim | Identificador da partida. |
| `playerId` | string | sim | Identificador estável do jogador dentro da partida. |
| `userId` | string | sim | Usuário vinculado ao jogador. |
| `displayNameSnapshot` | string | sim | Nome capturado no momento de entrada para compor snapshots e eventos históricos. |
| `currentLifeTotal` | number | sim | Estado corrente autoritativo do total de vida. |
| `joinedAt` | string | sim | Timestamp ISO-8601 de entrada na partida. |
| `lastSeenAt` | string | não | Timestamp ISO-8601 da última atividade/conexão observada. |
| `connectionState` | `connected` \| `disconnected` | sim | Estado atual de conexão do jogador. |
| `connectionCount` | number | sim | Número de conexões websocket ativas para o jogador. |
| `seat` | number | não | Posição opcional do jogador na grade/mesa. |
| `isOwner` | boolean | sim | Indica se o jogador é também o owner da partida. |

Regras:

- `currentLifeTotal` inicia com `Match.initialLifeTotal`
- `connectionCount` não pode ser negativo
- `connectionState = connected` quando `connectionCount > 0`
- `playerId` é separado de `userId` para desacoplar referências de UI, eventos e persistência

### 3.4 MatchEvent

Representa eventos de auditoria e rastreabilidade operacional da partida.

Campos:

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `matchId` | string | sim | Identificador da partida. |
| `eventId` | string | sim | Identificador único do evento. |
| `type` | `match_created` \| `player_joined` \| `life_total_set` \| `life_total_delta_applied` \| `player_connected` \| `player_disconnected` | sim | Tipo do evento de domínio. |
| `actorUserId` | string | sim | Usuário que causou o evento. |
| `targetUserId` | string | não | Usuário afetado pelo evento, quando aplicável. |
| `targetPlayerId` | string | não | Jogador afetado pelo evento, quando aplicável. |
| `payload` | object | sim | Detalhes adicionais do evento para auditoria e troubleshooting. |
| `requestId` | string | não | Identificador de correlação da requisição. |
| `occurredAt` | string | sim | Timestamp ISO-8601 da ocorrência. |

Regras:

- todo update de vida deve gerar um `MatchEvent`
- o `payload` deve ser suficiente para auditoria e troubleshooting, sem substituir o estado corrente

## 4. Relacionamentos

- `User (1) -> (N) Match` via `ownerUserId`
- `User (1) -> (N) MatchPlayer` via `userId`
- `Match (1) -> (N) MatchPlayer` via `matchId`
- `Match (1) -> (N) MatchEvent` via `matchId`

Decisão importante:

- `User` não faz parte do agregado de partida; a partida guarda apenas referências suficientes para operação e exibição

## 5. Estratégia física no DynamoDB

### 5.1 Abordagem

A estratégia oficial é tabela única no DynamoDB, com agregação primária por `matchId`.

Nome lógico recomendado:

- `GameTable`

Cada ambiente poderá usar nome derivado, como:

- `mtg-live-counters-dev-game-table`
- `mtg-live-counters-staging-game-table`
- `mtg-live-counters-prod-game-table`

### 5.2 Chaves primárias

Padrão base:

- `PK = MATCH#<matchId>`
- `SK = MATCH`
- `SK = PLAYER#<userId>`
- `SK = EVENT#<occurredAt>#<eventId>`
- `SK = CONNECTION#<connectionId>` para conexões ativas, quando necessário

Rationale:

- a partição por `matchId` concentra snapshot, jogadores e eventos em torno do agregado mais consultado
- `PLAYER#<userId>` facilita unicidade natural de participação por usuário em uma partida
- `EVENT#<occurredAt>#<eventId>` permite leitura cronológica do histórico

### 5.3 Índices secundários globais

#### GSI1 — Busca por código da partida

Objetivo:

- entrar por código sem conhecer `matchId`

Shape recomendado:

- `GSI1PK = CODE#<code>`
- `GSI1SK = MATCH`

Itens indexados:

- item `Match`

#### GSI2 — Busca por link compartilhado

Objetivo:

- entrar por link sem expor `matchId`

Shape recomendado:

- `GSI2PK = SHARE#<shareToken>`
- `GSI2SK = MATCH`

Itens indexados:

- item `Match`

#### GSI3 — Listagem pública de partidas abertas

Objetivo:

- listar partidas públicas com vagas sem scan geral

Shape recomendado:

- `GSI3PK = PUBLIC#OPEN`
- `GSI3SK = <createdAt>#<matchId>`

Critério para indexar:

- apenas partidas com `isPublic = true`
- `status` em estado listável, inicialmente `waiting`
- `currentPlayers < maxPlayers`

#### GSI4 — Partidas por usuário

Objetivo:

- recuperar partidas recentes de um usuário

Shape recomendado:

- `GSI4PK = USER#<userId>`
- `GSI4SK = MATCH#<joinedAt>#<matchId>`

Itens indexados:

- item `MatchPlayer`

## 6. Padrões de acesso

| Caso de uso | Estratégia |
| --- | --- |
| Criar partida | `Put` do item `Match`, `Put` do `MatchPlayer` do owner e `Put` do `MatchEvent` inicial na partição `MATCH#<matchId>`. |
| Buscar partida por `matchId` | `Query` em `PK = MATCH#<matchId>` e leitura do item `SK = MATCH`. |
| Entrar por `code` | `Query` em `GSI1PK = CODE#<code>` para localizar a partida. |
| Entrar por `shareToken` | `Query` em `GSI2PK = SHARE#<shareToken>` para localizar a partida. |
| Listar jogadores de uma partida | `Query` em `PK = MATCH#<matchId>` com prefixo `PLAYER#`. |
| Atualizar vida de um jogador | `Update` no item `PLAYER#<userId>` e `Put` de novo item `EVENT#...` na mesma partição. |
| Ler histórico de eventos | `Query` em `PK = MATCH#<matchId>` com prefixo `EVENT#`. |
| Listar partidas públicas abertas | `Query` em `GSI3PK = PUBLIC#OPEN`. |
| Recuperar partidas recentes de um usuário | `Query` em `GSI4PK = USER#<userId>`. |

## 7. Regras de consistência e atualização

### 7.1 Criação de partida

A criação de partida deve:

1. criar item `Match`
2. criar item `MatchPlayer` do owner com `currentLifeTotal = initialLifeTotal`
3. criar item `MatchEvent` do tipo `match_created`

### 7.2 Entrada em partida

A entrada em partida deve:

1. validar status e capacidade
2. criar ou reativar `MatchPlayer`
3. incrementar `currentPlayers`
4. gerar `MatchEvent` do tipo `player_joined`

### 7.3 Atualização de vida

A atualização de vida deve:

1. validar pertencimento do ator à partida
2. validar existência do jogador alvo
3. atualizar `MatchPlayer.currentLifeTotal`
4. registrar `MatchEvent`
5. disparar broadcast realtime apenas após persistência bem-sucedida

### 7.4 Conectividade

A conectividade do jogador deve:

- atualizar `connectionCount`
- derivar `connectionState`
- registrar `player_connected` e `player_disconnected` quando aplicável

## 8. Contratos compartilhados esperados

Os contratos iniciais em `packages/shared` devem cobrir:

- tipos de domínio: `User`, `Match`, `MatchPlayer`, `MatchEvent`
- enums e unions de status/eventos
- constantes de defaults e limites
- tipos dos itens persistidos na tabela única
- constantes de nomes de chaves e índices para DynamoDB

## 9. Cenários obrigatórios de validação

- criação de partida usando `initialLifeTotal = 40` e `maxPlayers = 4`
- recusa de entrada em partida lotada
- atualização de vida de jogador pertencente à partida com persistência do novo estado e do evento
- reconexão de jogador desconectado com recomputação correta de `connectionState`
- listagem pública retornando apenas partidas públicas com vagas
- leitura do histórico de alterações de vida em ordem cronológica

## 10. Resultado esperado

Ao final desta task, a base do projeto deve ter:

- documentação única do modelo de dados
- campos obrigatórios e regras de negócio explícitos
- estratégia física inicial do DynamoDB fechada
- padrões de acesso mapeados para chaves e índices
- contratos TypeScript compartilhados suficientes para iniciar implementação de API, realtime e infra
