import { updateAllCampaigns } from './campaigns.js';

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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        // Fallback para o ASSETS binding (Configurado no wrangler.toml)
        try {
            return await env.ASSETS.fetch(request);
        } catch (e) {
            return new Response("Not Found", { status: 404 });
        }
    }
};

async function handleApiRequest(url, request, env, corsHeaders) {
    const path = url.pathname;

    // 1. LOGIN
    if (path === "/api/login" && request.method === "POST") {
        try {
            const { email, password } = await request.json();
            // Simples verificação SQL
            const { results } = await env.DB.prepare(
                "SELECT * FROM users WHERE email = ? AND password_hash = ?"
            ).bind(email, password).all();

            if (!results.length) {
                return new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401, headers: corsHeaders });
            }

            const user = results[0];
            return new Response(JSON.stringify({
                token: `sys-token-${user.id}-${Date.now()}`,
                user: { id: user.id, name: user.name, role: user.role }
            }), { headers: corsHeaders });

        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
        }
    }

    // 2. LISTAR CAMPANHAS
    if (path === "/api/campaigns" && request.method === "GET") {
        const { results } = await env.DB.prepare(
            "SELECT uuid, name, advertiser_name FROM campaigns ORDER BY name ASC"
        ).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    // 3. DASHBOARD DATA
    if (path === "/api/dashboard" && request.method === "GET") {
        const campaignUuid = url.searchParams.get("campaign");
        if (!campaignUuid) return new Response("Campanha obrigatória", { status: 400, headers: corsHeaders });

        const { results: daily } = await env.DB.prepare(
            "SELECT * FROM daily_metrics WHERE campaign_uuid = ? ORDER BY date ASC"
        ).bind(campaignUuid).all();

        const { results: screens } = await env.DB.prepare(
            "SELECT * FROM screen_metrics WHERE campaign_uuid = ?"
        ).bind(campaignUuid).all();

        return new Response(JSON.stringify({ daily, screens }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
        });
    }

    // 4. FORÇAR UPDATE
    if (path === "/api/update-manual") {
        await updateAllCampaigns(env);
        return new Response("Update iniciado.", { headers: corsHeaders });
    }

    return new Response("API Route Not Found", { status: 404, headers: corsHeaders });
}
