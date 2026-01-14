---
description: Como debugar problemas no dashboard
---

# Debug - Encontrar e Resolver Problemas

Use este workflow quando o dashboard estiver com comportamento estranho ou não estiver atualizando dados.

## 1. Ver logs em tempo real

// turbo
```bash
npx wrangler tail
```

Isso mostrará **tudo** que está acontecendo no Worker (erros, requisições, etc).

## 2. Verificar status do cron job (automação)

// turbo
```bash
npx wrangler deployments list
```

Isso mostra o histórico de execuções. Procure por erros.

## 3. Testar localmente

// turbo
```bash
npx wrangler dev
```

Abra `http://localhost:8787` e use o console do navegador (F12) para ver erros.

## 4. Verificar se os secrets estão configurados

// turbo
```bash
npx wrangler secret list
```

Deve mostrar: `DISPLAYCE_USER`, `DISPLAYCE_PASSWORD`, e opcionalmente `DISPLAYCE_TOKEN`.

## 5. Testar manualmente a API DisplayCE

Se suspeitar que o problema é com a API da DisplayCE, teste manualmente:
- Acesse: https://datahub.displayce.com/
- Faça login com suas credenciais
- Verifique se você consegue ver suas campanhas

## 6. Verificar o banco de dados

// turbo
```bash
npx wrangler d1 execute displayce-db --command "SELECT COUNT(*) FROM metrics"
```

Isso mostra quantos registros existem. Se for 0, o Worker não está salvando dados.

## 🔍 Problemas Comuns:

| Problema | Solução |
|----------|---------|
| Dashboard não atualiza | Verifique os logs com `wrangler tail` |
| Erro de autenticação | Verifique os secrets ou autorize no painel da DisplayCE |
| Banco vazio | Execute o cron manualmente ou verifique o horário configurado |
| Site não carrega | Verifique o último deployment com `wrangler deployments list` |
