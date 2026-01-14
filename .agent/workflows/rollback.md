---
description: Como voltar para uma versão anterior (rollback)
---

# Rollback - Voltar Versão Anterior

Use este workflow quando uma atualização causar problemas e você precisar voltar para a versão que funcionava.

## Método 1: Via Terminal (Mais Rápido)

// turbo
```bash
npx wrangler rollback
```

O Wrangler vai listar as últimas versões. Escolha a que funcionava e confirme.

## Método 2: Via Painel da Cloudflare

1. Acesse: https://dash.cloudflare.com/
2. Vá em **Workers & Pages**
3. Clique no projeto `displayce-dashboard`
4. Vá na aba **Deployments**
5. Encontre a versão que funcionava
6. Clique nos 3 pontinhos `...` → **Rollback to this deployment**

## Método 3: Reverter código e fazer novo deploy

Se preferir corrigir o código:
1. Desfaça as mudanças problemáticas (Ctrl+Z ou Git)
2. Teste localmente: `npx wrangler dev`
3. Quando estiver OK: `npx wrangler deploy`

## ✅ Verificação
Depois do rollback, visite o site da Cloudflare e confirme que voltou ao normal.
