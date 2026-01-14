import { updateAllCampaigns } from './campaigns.js';
import { handleAdminRoutes } from './admin.js';

export default {
    // TRIGGER AGENDADO
    async scheduled(event, env, ctx) {
        console.log("⏰ Cron Trigger: Atualizando D1...");
        ctx.waitUntil(updateAllCampaigns(env));
    },

    // HTTP REQUEST HANDLER
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS Setup
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // --- ROTEAMENTO DA API ---
        if (url.pathname.startsWith("/api")) {
            return handleApiRequest(url, request, env, corsHeaders);
        }

        // --- SERVIR ASSETS (Frontend) ---
        try {
            return await env.ASSETS.fetch(request);
        } catch (e) {
            return new Response("Not Found", { status: 404 });
        }
    }
};

async function handleApiRequest(url, request, env, corsHeaders) {
    const path = url.pathname;

    // Rotas de Admin
    if (path.startsWith('/api/admin')) {
        const adminResponse = await handleAdminRoutes(url, request, env, corsHeaders);
        if (adminResponse) return adminResponse;
    }

    // 1. LOGIN
    if (path === "/api/login" && request.method === "POST") {
        try {
            const { email, password } = await request.json();

            const { results } = await env.DB.prepare(
                "SELECT id, email, name, role, client_id FROM users WHERE email = ? AND password_hash = ?"
            ).bind(email, password).all();

            if (!results.length) {
                return new Response(JSON.stringify({ error: "Credenciais inválidas" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json", ...corsHeaders }
                });
            }

            const user = results[0];
            return new Response(JSON.stringify({
                token: `sys-token-${user.id}-${Date.now()}`,
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    client_id: user.client_id
                }
            }), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });

        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }
    }

    // 2. LISTAR CAMPANHAS (filtrado por cliente se não for admin)
    if (path === "/api/campaigns" && request.method === "GET") {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : null;

        let query = `
            SELECT 
                c.uuid, 
                COALESCE(c.custom_name, c.name) as name, 
                COALESCE(c.custom_advertiser, c.advertiser_name) as advertiser_name,
                c.start_date,
                c.end_date
            FROM campaigns c
        `;

        // Se tiver token, verificar permissões
        if (token && token.startsWith('sys-token-')) {
            const userId = parseInt(token.split('-')[2]);
            const user = await env.DB.prepare(
                "SELECT role, client_id FROM users WHERE id = ?"
            ).bind(userId).first();

            // Se for cliente, filtrar apenas suas campanhas
            if (user && user.role === 'client' && user.client_id) {
                query += ` WHERE c.client_id = ${user.client_id}`;
            }
        }

        query += " ORDER BY c.name ASC";

        const { results } = await env.DB.prepare(query).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    // 3. DASHBOARD DATA (com override de valores)
    if (path === "/api/dashboard" && request.method === "GET") {
        const campaignUuid = url.searchParams.get("campaign");
        if (!campaignUuid) {
            return new Response(JSON.stringify({ error: "Campanha obrigatória" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // Buscar informações da campanha
        const campaign = await env.DB.prepare(`
            SELECT 
                c.uuid,
                COALESCE(c.custom_name, c.name) as name,
                COALESCE(c.custom_advertiser, c.advertiser_name) as advertiser,
                co.custom_cost
            FROM campaigns c
            LEFT JOIN campaign_overrides co ON c.uuid = co.campaign_uuid
            WHERE c.uuid = ?
        `).bind(campaignUuid).first();

        const { results: daily } = await env.DB.prepare(
            "SELECT * FROM daily_metrics WHERE campaign_uuid = ? ORDER BY date ASC"
        ).bind(campaignUuid).all();

        const { results: screens } = await env.DB.prepare(
            "SELECT * FROM screen_metrics WHERE campaign_uuid = ?"
        ).bind(campaignUuid).all();

        // Aplicar override de custo se existir
        if (campaign && campaign.custom_cost) {
            // Calcular proporção do override
            const realTotal = daily.reduce((sum, d) => sum + (d.cost || 0), 0);
            const overrideTotal = campaign.custom_cost;
            const ratio = realTotal > 0 ? overrideTotal / realTotal : 1;

            // Aplicar nos dados diários
            daily.forEach(d => {
                d.cost = d.cost * ratio;
            });

            // Aplicar nos dados por tela
            screens.forEach(s => {
                s.cost = s.cost * ratio;
            });
        }

        return new Response(JSON.stringify({
            campaign: {
                name: campaign?.name,
                advertiser: campaign?.advertiser
            },
            daily,
            screens
        }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    // 4. FORÇAR UPDATE MANUAL
    if (path === "/api/update-manual") {
        ctx.waitUntil(updateAllCampaigns(env));
        return new Response(JSON.stringify({ success: true, message: "Update iniciado" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    return new Response(JSON.stringify({ error: "API Route Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
    });
}
