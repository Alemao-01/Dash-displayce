# 🚀 DisplayCE Dashboard - SaaS (Cloudflare Version)

Este projeto é uma plataforma SaaS para monitoramento de campanhas DisplayCE em tempo real.
A arquitetura é **100% Serverless** rodando na **Cloudflare**, eliminando a necessidade de servidores locais ligados.

## 🏗️ Arquitetura

- **Frontend (`/public`)**: Site estático (Cloudflare Pages)
- **Backend (`/worker`)**: Robô e API (Cloudflare Workers, portado de Python para JS/TS para performance)
- **Database (`/schemas`)**: Banco SQL (Cloudflare D1)

## 🛠️ Como colocar no ar (Deploy)

### Pré-requisitos
1. Ter Node.js instalado.
2. Ter uma conta na Cloudflare.
3. Instalar a CLI do Wrangler:
   ```bash
   npm install -g wrangler
   ```

### Passo 1: Login
No terminal (dentro desta pasta), rode:
```bash
wrangler login
```

### Passo 2: Criar Banco de Dados
```bash
wrangler d1 create displayce-db
```
*Copie o `database_id` gerado e cole no arquivo `wrangler.toml` no lugar de `SEU_ID_DO_BANCO_AQUI`.*

### Passo 3: Criar Tabelas
```bash
wrangler d1 execute displayce-db --file=./schemas/schema.sql
```

### Passo 4: Configurar Segredos (Credenciais DisplayCE)
```bash
wrangler secret put DISPLAYCE_USER
# (Digite seu email da DisplayCE quando pedir)

wrangler secret put DISPLAYCE_PASSWORD
# (Digite sua senha da DisplayCE quando pedir)
```

### Passo 5: Publicar (Deploy Tudo)
```bash
wrangler deploy
```

O terminal vai te dar o link do site funcionando! 🎉

### Passo 6: Criar um Usuário Inicial
Para testar o login, crie um usuário manualmente no banco:
```bash
wrangler d1 execute displayce-db --command "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@displayce.com', 'admin123', 'Administrador', 'admin')"
```
*(Nota: em produção, a senha deve ser hash, mas para teste rápido isso funciona se o código do worker aceitar texto puro ou se você criptografar antes)*

## 🔄 Como funciona a automação
O Cloudflare Worker está configurado (no `wrangler.toml`) para rodar a cada hora (`0 * * * *`). Ele automaticamente:
1. Faz login na DisplayCE.
2. Baixa dados novos.
3. Atualiza o banco de dados.
4. Seu painel mostra sempre dados frescos!
