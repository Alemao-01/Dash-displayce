export default {
    // 1. CRON TRIGGER: Roda automaticamente (ex: a cada 1 hora)
    async scheduled(event, env, ctx) {
        console.log("⏰ Iniciando rotina de atualização automática...");
        await updateAllCampaigns(env);
    },

    // 2. API fetch: Responde requisições do Frontend
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS Headers (Permitir acesso do Frontend)
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // Rota de Login
        if (url.pathname === "/api/login" && request.method === "POST") {
            try {
                const { email, password } = await request.json();

                // Buscar usuário no BD
                const { results } = await env.DB.prepare(
                    "SELECT * FROM users WHERE email = ? AND password_hash = ?"
                ).bind(email, password).all(); // Nota: Em prod usar hash real (bcrypt/argon2)

                if (results.length === 0) {
                    return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
                        status: 401, headers: corsHeaders
                    });
                }

                const user = results[0];
                return new Response(JSON.stringify({
                    token: "fake-jwt-token-" + user.id, // Em prod usar JWT real
                    user: { id: user.id, name: user.name, role: user.role }
                }), { headers: corsHeaders });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
            }
        }

        // Rota de Dados do Dashboard
        if (url.pathname === "/api/dashboard" && request.method === "GET") {
            // Em um app real, verificar token aqui

            // Pegar ID da campanha (ex: via query param ou do usuário logado)
            const campaignUuid = url.searchParams.get("campaign");

            if (!campaignUuid) {
                return new Response(JSON.stringify({ error: "Campanha não especificada" }), { status: 400, headers: corsHeaders });
            }

            // Buscar dados do BD D1
            const { results: daily } = await env.DB.prepare(
                "SELECT * FROM daily_metrics WHERE campaign_uuid = ? ORDER BY date ASC"
            ).bind(campaignUuid).all();

            const { results: screens } = await env.DB.prepare(
                "SELECT * FROM screen_metrics WHERE campaign_uuid = ?"
            ).bind(campaignUuid).all();

            return new Response(JSON.stringify({
                daily: daily,
                screens: screens
            }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
        }

        // Rota para forçar atualização manual (dev only)
        if (url.pathname === "/api/update-manual") {
            await updateAllCampaigns(env);
            return new Response("Atualizado com sucesso", { headers: corsHeaders });
        }

        return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
};

// ==========================================
// LÓGICA DE NEGÓCIO (Portada do Python)
// ==========================================

async function updateAllCampaigns(env) {
    // 1. Login na DisplayCE
    const token = await loginDisplayCE(env);
    if (!token) {
        console.error("❌ Falha no login DisplayCE");
        return;
    }

    // 2. Listar Campanhas
    const campaigns = await listCampaigns(token);

    // 3. Atualizar cada campanha ativa
    for (const campaign of campaigns) {
        if (campaign.status === 1) { // 1 = Em Execução
            console.log(`🔄 Atualizando campanha: ${campaign.name}`);

            // Salvar/Atualizar campanha no BD
            await env.DB.prepare(`
                INSERT INTO campaigns (uuid, name, status, advertiser_name)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET status=excluded.status
            `).bind(campaign.uuid, campaign.name, campaign.status, campaign.advertiser_name).run();

            // Buscar e Salvar Métricas
            await fetchAndSaveMetrics(env, token, campaign.uuid);
        }
    }
}

async function loginDisplayCE(env) {
    // Usa segredos de ambiente (definidos via `wrangler secret put`)
    const response = await fetch("https://datahub.displayce.com/agencies/v2/rtb/reports/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: env.DISPLAYCE_USER,
            password: env.DISPLAYCE_PASSWORD
        })
    });

    if (response.ok) {
        return await response.json(); // Retorna o Token
    }
    return null;
}

async function listCampaigns(token) {
    const response = await fetch("https://datahub.displayce.com/agencies/v2/rtb/campaigns", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });
    return response.ok ? await response.json() : [];
}

async function fetchAndSaveMetrics(env, token, campaignUuid) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Params para DisplayCE
    const params = new URLSearchParams({
        date_filter: thirtyDaysAgo.toISOString().split('T')[0],
        date_filter_end: today.toISOString().split('T')[0],
        time_grouping: "day",
        show_campaign_dates: "true"
    });

    // 1. Buscar Dados Diários
    const respDaily = await fetch(`https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/${campaignUuid}?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (respDaily.ok) {
        const data = await respDaily.json();
        // Inserir no D1 (Batch insert seria melhor, fazendo um por um pra simplificar)
        for (const row of data) {
            await env.DB.prepare(`
                INSERT INTO daily_metrics (campaign_uuid, date, impressions, plays, cost)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(campaign_uuid, date) DO UPDATE SET 
                    impressions=excluded.impressions,
                    plays=excluded.plays,
                    cost=excluded.cost
            `).bind(
                campaignUuid,
                row["dt_local"],
                row["impressions"],
                row["plays"],
                row["net_cost"]
            ).run();
        }
    }

    // 2. Buscar Dados por Tela (Geolocalização)
    const paramsScreen = new URLSearchParams({
        screen_grouping: "true",
        show_campaign_dates: "true"
    });

    const respScreen = await fetch(`https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/${campaignUuid}?${paramsScreen}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (respScreen.ok) {
        const data = await respScreen.json();
        for (const row of data) {
            // Verificar se tem lat/long
            if (row["point_of_display_lat"]) {
                await env.DB.prepare(`
                    INSERT INTO screen_metrics (campaign_uuid, screen_name, city, country, address, lat, lng, impressions, plays, cost)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(campaign_uuid, screen_name) DO UPDATE SET
                        impressions=excluded.impressions, plays=excluded.plays, cost=excluded.cost
                `).bind(
                    campaignUuid,
                    row["point_of_display_name"],
                    row["point_of_display_city_name"],
                    row["point_of_display_country"],
                    row["point_of_display_address"],
                    row["point_of_display_lat"],
                    row["point_of_display_long"],
                    row["impressions"],
                    row["plays"],
                    row["net_cost"]
                ).run();
            }
        }
    }
}
