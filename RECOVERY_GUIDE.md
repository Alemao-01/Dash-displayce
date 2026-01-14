# Guia de Manutenção e Recuperação (Rollback)

Este guia explica como manter o Dashboard estável e o que fazer caso algo pare de funcionar após uma nova atualização.

## 1. O site está funcionando agora?
**Sim.** O site está publicado e operacional na URL da Cloudflare. 
- O robô (Worker) está baixando os dados da DisplayCE de hora em hora.
- A interface (Frontend) está configurada para exibir esses dados em tempo real.

## 2. E se uma atualização causar um erro?
O Cloudflare trabalha com o conceito de **Imutabilidade**. Isso significa que quando você faz um `npx wrangler deploy`, você cria uma **nova versão** do seu site.

- **Se o código tiver um erro de sintaxe:** O deploy falhará no terminal e a versão antiga (que funciona) continuará no ar.
- **Se o código tiver um erro lógico (bug):** O site pode carregar mas mostrar erros ou parar de exibir o gráfico. O site "cai" apenas funcionalmente, mas o servidor continua UP.

## 3. Como voltar atrás (Rollback)?

Se você publicou algo e o site parou de funcionar, você tem três caminhos para resolver:

### A. Via Terminal (Wrangler)
Você pode pedir para a Cloudflare voltar para a versão anterior imediatamente com o comando:
```powershell
npx wrangler rollback
```
Isso listará as últimas versões e perguntará para qual você deseja voltar.

### B. Via Painel da Cloudflare (Visual)
1. Acesse o **Dashboard da Cloudflare**.
2. Vá em **Workers & Pages**.
3. Clique no seu projeto `displayce-dashboard`.
4. Vá na aba **Deployments** (ou Implantações).
5. Lá você verá uma lista histórica. Você pode clicar nos três pontinhos `...` de uma versão antiga que funcionava e selecionar **"Rollback to this deployment"**.

### C. Via Código (Git)
Como estamos em um ambiente de desenvolvimento:
1. Se eu (ou você) fizermos uma mudança que quebrou, podemos "desfazer" a alteração nos arquivos locais (usando `Ctrl+Z` ou comandos de Git).
2. Fazemos o `npx wrangler deploy` novamente com o código corrigido.

## 4. Práticas Recomendadas de Segurança

Para evitar que o site "caia" para os usuários:

> [!TIP]
> **Teste Localmente Primeiro:** Antes de publicar para todo mundo, rode `npx wrangler dev` no seu computador. Isso abre um servidor de teste idêntico ao da Cloudflare. Se funcionar ali, as chances de erro no deploy são mínimas.

> [!IMPORTANT]
> **Logs em Tempo Real:** Se o site estiver estranho, você pode ver o que está acontecendo "por dentro" do robô rodando `npx wrangler tail`. Ele mostrará os erros em tempo real conforme eles acontecem.
