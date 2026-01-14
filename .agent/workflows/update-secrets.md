---
description: Como atualizar credenciais e secrets da DisplayCE
---

# Atualizar Credenciais (Secrets)

Use este workflow quando precisar trocar ou atualizar as credenciais da API DisplayCE.

## Atualizar Username

```bash
npx wrangler secret put DISPLAYCE_USER
```

Digite o novo email quando solicitado e pressione Enter.

## Atualizar Password

```bash
npx wrangler secret put DISPLAYCE_PASSWORD
```

Digite a nova senha quando solicitado e pressione Enter.

## Atualizar Token Estático (Recomendado)

Se você tem uma API Key estática da DisplayCE:

```bash
npx wrangler secret put DISPLAYCE_TOKEN
```

Cole o token completo e pressione Enter.

> [!TIP]
> **Usar token estático é melhor** porque não precisa de autorização manual no painel da DisplayCE a cada login.

## Verificar secrets configurados

// turbo
```bash
npx wrangler secret list
```

Isso mostrará quais secrets estão salvos (mas **não** os valores, por segurança).

## Testar as novas credenciais

Depois de atualizar, faça um teste:

// turbo
```bash
npx wrangler dev
```

Abra o navegador e veja se o dashboard consegue buscar dados com as novas credenciais.

## ⚠️ Importante:
- Os secrets são **criptografados** e só ficam visíveis para o Worker
- Você pode sobrescrever um secret executando o comando novamente
- Não é necessário fazer novo deploy ao atualizar secrets
