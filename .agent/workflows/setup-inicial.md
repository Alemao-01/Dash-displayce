---
description: Setup inicial completo do projeto (primeira vez)
---

# Setup Inicial - Primeira Configuração

Use este workflow apenas na **primeira vez** que for configurar o projeto em um novo ambiente.

## Pré-requisitos

1. Node.js instalado
2. Conta na Cloudflare criada
3. Credenciais da DisplayCE em mãos

## Passos:

### 1. Instalar dependências

// turbo
```bash
npm install
```

### 2. Fazer login na Cloudflare

```bash
npx wrangler login
```

Isso abrirá o navegador para você autorizar o acesso.

### 3. Criar o banco de dados

```bash
npx wrangler d1 create displayce-db
```

**⚠️ IMPORTANTE:** Copie o `database_id` que aparecer no terminal.

### 4. Configurar o wrangler.toml

Abra o arquivo `wrangler.toml` e substitua `SEU_ID_DO_BANCO_AQUI` pelo ID copiado acima.

### 5. Criar as tabelas no banco

// turbo
```bash
npx wrangler d1 execute displayce-db --file=./schemas/schema.sql
```

### 6. Configurar credenciais da DisplayCE

```bash
npx wrangler secret put DISPLAYCE_USER
```
Digite seu email da DisplayCE.

```bash
npx wrangler secret put DISPLAYCE_PASSWORD
```
Digite sua senha da DisplayCE.

### 7. (Opcional) Configurar token estático

Se você tiver um token de API:

```bash
npx wrangler secret put DISPLAYCE_TOKEN
```

### 8. Fazer o primeiro deploy

```bash
npx wrangler deploy
```

O terminal mostrará a URL do seu dashboard! 🎉

### 9. Testar o dashboard

Abra a URL fornecida no navegador e verifique se está funcionando.

## ✅ Pronto!

Seu dashboard está no ar e configurado para atualizar automaticamente a cada hora.

Para futuros deploys, use apenas: `npx wrangler deploy`
