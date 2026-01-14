# 🚀 DisplayCE Dashboard - SaaS (Cloudflare)

Dashboard em tempo real para monitoramento de campanhas DisplayCE. Arquitetura 100% Serverless na Cloudflare.

## 📚 Documentação

Toda a documentação do projeto está organizada na pasta [`docs/`](./docs/):

- **[README.md](./docs/README.md)** - Arquitetura e deploy completo
- **[DISPLAYCE_API_GUIDE.md](./docs/DISPLAYCE_API_GUIDE.md)** - Integração com API DisplayCE
- **[RECOVERY_GUIDE.md](./docs/RECOVERY_GUIDE.md)** - Manutenção e rollback
- **[DOMINIO_E_FLUXO_DEV.md](./docs/DOMINIO_E_FLUXO_DEV.md)** - Domínio personalizado e fluxo de trabalho

## ⚡ Workflows (Comandos Rápidos)

Use os workflows na pasta [`.agent/workflows/`](./.agent/workflows/):

- `/setup-inicial` - Configuração inicial do projeto
- `/deploy` - Fazer deploy para produção
- `/rollback` - Voltar para versão anterior
- `/debug` - Debugar problemas
- `/update-secrets` - Atualizar credenciais

## 🏗️ Arquitetura

```
Frontend (Cloudflare Pages)
     ↓
Worker (Cloudflare Workers)
     ↓
D1 Database (Cloudflare D1)
     ↓
DisplayCE API
```

## 🚀 Quick Start

```bash
# 1. Login na Cloudflare
npx wrangler login

# 2. Deploy
npx wrangler deploy

# 3. Ver logs
npx wrangler tail
```

## 📦 Estrutura do Projeto

```
Api displayce/
├── .agent/workflows/    # Workflows de automação
├── docs/                # Documentação completa
├── public/              # Frontend (HTML, CSS, JS)
├── src/                 # Backend Worker
├── schemas/             # Schemas do banco D1
└── wrangler.toml        # Configuração Cloudflare
```

## 🔗 Links Úteis

- **Dashboard Cloudflare:** https://dash.cloudflare.com/
- **Documentação Wrangler:** https://developers.cloudflare.com/workers/wrangler/
- **DisplayCE API:** https://datahub.displayce.com/

---

**Desenvolvido para E-Mídias** | Powered by Cloudflare ☁️
