---
description: Como fazer deploy do dashboard para produção
---

# Deploy para Produção

Este workflow descreve como publicar atualizações do DisplayCE Dashboard na Cloudflare.

## Passos:

### 1. Testar localmente primeiro
Sempre teste antes de publicar:
// turbo
```bash
npx wrangler dev
```

Abra o navegador em `http://localhost:8787` e verifique se tudo está funcionando.

### 2. Fazer o deploy
Quando tiver certeza que está funcionando:
// turbo
```bash
npx wrangler deploy
```

### 3. Verificar o site no ar
Acesse a URL da Cloudflare que apareceu no terminal e confirme que está tudo OK.

### 4. Ver logs em tempo real (opcional)
Se quiser monitorar o que está acontecendo:
// turbo
```bash
npx wrangler tail
```

## ⚠️ Importante:
- O deploy é **imutável**: cada deploy cria uma nova versão
- Se der erro de sintaxe, o deploy falha e a versão antiga continua no ar
- Se der erro lógico, você pode fazer rollback (ver workflow `rollback.md`)
