# DisplayCE API Integration Guide

Este documento serve como referência técnica para o acesso e integração com a API da DisplayCE. Ele descreve o fluxo de autenticação, listagem de campanhas e busca de métricas.

## 1. Autenticação (Login)

Para realizar qualquer requisição, é necessário obter um Bearer Token.

*   **Endpoint:** `POST https://datahub.displayce.com/agencies/v2/rtb/reports/login`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Corpo da Requisição:**
    *   `username`: Seu e-mail de acesso.
    *   `password`: Sua senha.
*   **Resposta:** Um JWT (JSON Web Token).

> [!WARNING]
> **Autorização Manual:** Através deste fluxo de login, a API pode retornar um token que exige que você entre no site da DisplayCE e "autorize" manualmente o novo acesso antes que ele comece a funcionar. 
> 
> O código **não consegue** fazer essa autorização sozinho. Por isso, se o robô não estiver conseguindo baixar dados mesmo com o login correto, você terá que autorizar no painel deles.

## 2. Usando uma Chave de API Estática (Recomendado)

Se você já possui uma **API Key** permanente (estática) gerada pelo suporte ou painel da DisplayCE, o sistema pode ignorar o fluxo de login e usar essa chave diretamente. Isso garante autonomia total sem depender de autorizações manuais recorrentes.

*   **Como Configurar:** No terminal, use: `npx wrangler secret put DISPLAYCE_TOKEN` e cole sua chave.
*   **Vantagem:** O robô usará este token em todas as requisições sem precisar logar.

## 3. Listagem de Campanhas

Busca todas as campanhas vinculadas à conta do usuário.

*   **Endpoint:** `GET https://datahub.displayce.com/agencies/v2/rtb/campaigns`
*   **Cabeçalho:** `Authorization: Bearer <SEU_TOKEN>`
*   **Campos Úteis da Resposta:**
    *   `uuid`: Identificador único da campanha.
    *   `name`: Nome da campanha.
    *   `advertiser_name`: Nome do anunciante.

## 3. Relatório de Performance (Delivery)

Busca as métricas detalhadas de uma campanha específica.

*   **Endpoint:** `GET https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/{campaign_uuid}`
*   **Parâmetros de Query (Opcionais):**
    *   `date_filter`: Data de início (`YYYY-MM-dd`).
    *   `date_filter_end`: Data de fim (`YYYY-MM-dd`).
    *   `time_grouping`: Agrupamento temporal (`day`, `hour`, `week`).
    *   `screen_grouping`: `true` para agrupar métricas por tela/geolocalização.
    *   `show_campaign_dates`: `true` para incluir datas de início/fim da campanha.

### Mapeamento de Dados (Campos Chave)

Ao receber a resposta da API, os campos utilizam o prefixo da entidade:

| Campo na API | Descrição |
| :--- | :--- |
| `AgencyReport.campaignUuid` | ID da Campanha |
| `RTBCampaignReports.imps` | Quantidade de Impressões |
| `RTBCampaignReports.plays` | Quantidade de Plays |
| `RTBCampaignReports.netCost` | Custo Líquido |
| `RTBCampaignReports.geocodedLatitude` | Latitude para o mapa |
| `RTBCampaignReports.geocodedLongitude` | Longitude para o mapa |
| `RTBCampaignReports.geocodedCity` | Cidade |

---

## 🔄 Automação na Cloudflare

O sistema foi desenhado para ser **100% autônomo**:

1.  **Segredos:** As credenciais são salvas com segurança via `wrangler secret put`.
2.  **Agendamento (Cron):** O Cloudflare Worker acorda a cada hora.
3.  **Fluxo Automático:**
    *   Lê o login/senha dos segredos.
    *   Faz o POST no `/reports/login` e pega o token novo.
    *   Varre as campanhas ativas.
    *   Baixa as métricas usando o token.
    *   Salva tudo no banco de dados **D1**.
4.  **Expiração:** Se o token expirar, o robô simplesmente faz um novo login na próxima rodada. Você não precisa autorizar manualmente.
