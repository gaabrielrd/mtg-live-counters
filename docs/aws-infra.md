# AWS Infra Setup

## Objetivo

Este documento explica como provisionar a infraestrutura base AWS do projeto usando CDK em TypeScript. A topologia cobre `dev` e `staging` na mesma conta AWS, ambos na região `us-east-1`.

Stacks provisionadas:

- `FrontendStack`: S3 + CloudFront
- `ApiStack`: API Gateway HTTP + Lambda placeholder para `/health`
- `RealtimeStack`: API Gateway WebSocket + Lambda placeholder para rotas base
- `DataStack`: DynamoDB `GameTable` com GSIs
- `AuthStack`: Cognito User Pool, App Client, Hosted UI e suporte opcional a Google OAuth

## Pré-requisitos

- AWS CLI instalado e autenticado na conta alvo
- AWS CDK disponível localmente
- `pnpm install --frozen-lockfile`

## Bootstrap da conta

1. Confirme a identidade AWS atual:

```bash
aws sts get-caller-identity
```

2. Faça o bootstrap do CDK em `us-east-1`:

```bash
cd infra
cdk bootstrap aws://ACCOUNT_ID/us-east-1 --profile pcgabriel
```

Substitua `ACCOUNT_ID` pelo ID retornado no passo anterior.

## Comandos principais

Da raiz do monorepo:

```bash
pnpm --filter infra lint
pnpm --filter infra typecheck
pnpm --filter infra build
pnpm --filter infra synth
pnpm --filter infra diff:dev
pnpm --filter infra deploy:dev
pnpm --filter infra deploy:staging
```

Os scripts do pacote `infra` já usam `--profile pcgabriel`.

## Arquivos de ambiente para segredos

Os segredos do Google OAuth podem ficar em arquivos locais não versionados dentro de `infra/`.

Arquivos suportados:

- `infra/.env.dev`
- `infra/.env.staging`

Arquivos de exemplo prontos:

- `infra/.env.example`
- `infra/.env.dev.example`
- `infra/.env.staging.example`

Exemplo para `infra/.env.dev`:

```bash
DEV_GOOGLE_CLIENT_ID="..."
DEV_GOOGLE_CLIENT_SECRET="..."
```

Exemplo para `infra/.env.staging`:

```bash
STAGING_GOOGLE_CLIENT_ID="..."
STAGING_GOOGLE_CLIENT_SECRET="..."
```

Os scripts `deploy:dev`, `deploy:staging`, `deploy:auth:dev` e `deploy:auth:staging` carregam esses arquivos automaticamente quando eles existem.

## Google OAuth no Cognito

O provider Google é opcional no código e só é ativado quando `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão presentes no ambiente de deploy.

### Passo a passo

1. Faça o primeiro deploy do stack de autenticação sem Google, para obter o domínio do Hosted UI:

```bash
pnpm --filter infra deploy:dev
```

2. No Google Cloud Console:

- crie um OAuth Client do tipo Web application
- use como Authorized redirect URIs:
  - `https://<hosted-ui-domain>/oauth2/idpresponse`
- use como Authorized JavaScript origins:
  - `https://<hosted-ui-domain-without-path>`

3. Preencha o arquivo local correspondente antes de fazer novo deploy:

```bash
cp infra/.env.dev.example infra/.env.dev
```

Depois edite `infra/.env.dev` com:

```bash
DEV_GOOGLE_CLIENT_ID="..."
DEV_GOOGLE_CLIENT_SECRET="..."
```

Para `staging`, faça:

```bash
cp infra/.env.staging.example infra/.env.staging
```

e preencha:

```bash
STAGING_GOOGLE_CLIENT_ID="..."
STAGING_GOOGLE_CLIENT_SECRET="..."
```

4. Rode novamente o deploy do auth:

```bash
pnpm --filter infra deploy:auth:dev
```

## URLs e callbacks atuais

O App Client do Cognito nasce com callbacks locais:

- `http://localhost:5173/auth/callback`
- `http://localhost:5173`

Logout URLs:

- `http://localhost:5173`

Essas URLs podem ser expandidas depois que o domínio da aplicação web for definido.

## Observações

- `dev` usa políticas mais permissivas de destruição para facilitar iteração
- `staging` mantém retenção mais conservadora
- as integrações HTTP/WebSocket estão prontas como base e podem ser trocadas pelas Lambdas reais do produto nos próximos passos
