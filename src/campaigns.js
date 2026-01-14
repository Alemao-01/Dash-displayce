import { loginDisplayCE } from './auth.js';

export async function updateAllCampaigns(env) {
    const HARDCODED_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpWazRMMk9uR0lmT3ZaeWttZTQ4WiJ9.eyJwZ3Jlc3Rfcm9sZSI6InBvc3RncmVzdCIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9wdWJsaXNoZXIiOm51bGwsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS91c2VyX3V1aWQiOiI4OGNkNjQ3Yy1jYTg2LTRmYzItYTQ5Zi0zMjk1Zjg5YzY5ZDkiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vYWdlbmN5X3V1aWQiOiI2YWVhMzk2MC03ZDQwLTRjYTUtODVhZC0xNzY5OGRiYWQ4NDYiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vaGFzX2FjY2VzcyI6dHJ1ZSwiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeSI6MTA4NywiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeV9uYW1lIjoiQWdlbmNpYSBFLVLDoWRpb3MgLSBCUiIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9yb2xlcyI6WyJyb2xlX3RyYWRlcl9ydGIiLCJyb2xlX2FnZW5jeV9hZG1pbiJdLCJuaWNrbmFtZSI6InRhdGljbzEiLCJuYW1lIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2ViYjE2ZDY4YjdlZDk0OGJlZDg3NjViOWYwNTNiMDk0P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGdGEucG5nIiwidXBkYXRlZF9hdCI6IjIwMjYtMDEtMTRUMTY6NDk6MjkuNTE2WiIsImVtYWlsIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vZGlzcGxheWNlLmV1LmF1dGgwLmNvbS8iLCJhdWQiOiIxaDd6NnljVG91UDFoZ2JwRnd6czF5YVEyZkw0UmFNMiIsInN1YiI6ImF1dGgwfDY5M2M0N2NmZjdhMjI4ZTBiNzE0Zjc0OSIsImlhdCI6MTc2ODQwOTM3MCwiZXhwIjoxNzY4NDQ1MzcwfQ.lfgnkv5C-6PjuCFpfyb-GjCqrJEAdfWxI9I0cyFzl4bpQURnz0VPiToAxy986IzgPjvSPD3Otrgkl4Q_PS403PN9RclLKhYAvR-0fPvSTZl3EOdff3pur6LIsT3jJxJ4NUEoX4m5WriOuX5Zbe6sYEI-37A815tAxNv3GV8fVxwzjoHvOoppyDkOu4vlxh84-yzcA49DYLrsNiCgGgNpEi-2UL3vC4o5fySyXUXM8lu-4EjzfHqBzStHp3mNm4oQigZSVQtHUEwM_tQPcec0JZFv_zEJS_pJoZEwPp3McqW2_u9PWcKE0a0AG7xEl_xl0_9ySwfA9YR2DKLm7xIKcQ";

    let token = env.DISPLAYCE_TOKEN || HARDCODED_TOKEN;

    if (!token) {
        token = await loginDisplayCE(env);
    }

    if (!token) {
        console.error("❌ Falha crítica: Token não disponível.");
        return;
    }

    const campaigns = await listCampaigns(token);
    console.log(`📋 Atualizando ${campaigns.length} campanhas...`);

    for (const campaign of campaigns) {
        // Normalização de campos
        const uuid = campaign.uuid || campaign["AgencyReport.campaignUuid"] || campaign.campaign_uuid;
        const name = campaign.name || campaign["AgencyReport.campaignName"] || campaign.campaign_name;

        // Validação de status
        let status = campaign.status;
        if (status === undefined) status = campaign["AgencyReport.deliveryStatus"];
        if (status === undefined) status = campaign.validated;

        const advertiser = campaign.advertiser_name || campaign["AgencyReport.advertiserName"] || "Anunciante";

        // Filtrar apenas campanhas ativas (1 ou true)
        if (status === 1 || status === true) {
            console.log(`🔄 Processando: ${name}`);

            // Auto-associar com cliente baseado no advertiser_name
            let clientId = null;
            const client = await env.DB.prepare(
                "SELECT id FROM clients WHERE advertiser_name = ?"
            ).bind(advertiser).first();

            if (client) {
                clientId = client.id;
                console.log(`  ✅ Auto-linkado ao cliente ID: ${clientId}`);
            }

            // Upsert Campanha (preserva custom_name e custom_advertiser se já existirem)
            await env.DB.prepare(`
                INSERT INTO campaigns (uuid, name, advertiser_name, client_id, status)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET 
                    name = excluded.name,
                    advertiser_name = excluded.advertiser_name,
                    client_id = COALESCE(excluded.client_id, campaigns.client_id),
                    status = excluded.status,
                    last_updated = CURRENT_TIMESTAMP
            `).bind(uuid, name, advertiser, clientId, 'active').run();

            // Métricas
            await fetchAndSaveMetrics(env, token, uuid);
        }
    }
}

async function listCampaigns(token) {
    const response = await fetch("https://datahub.displayce.com/agencies/v2/rtb/campaigns", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
    });

    if (!response.ok) {
        console.error(`❌ Erro ao listar campanhas: ${response.status}`);
        return [];
    }
    return await response.json();
}

async function fetchAndSaveMetrics(env, token, campaignUuid) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const tomorrow = new Date(); // Filtro end date (+1 dia segurança)
    tomorrow.setDate(today.getDate() + 1);

    const paramsDefaults = {
        date_filter: thirtyDaysAgo.toISOString().split('T')[0],
        date_filter_end: tomorrow.toISOString().split('T')[0],
        show_campaign_dates: "true"
    };

    // 1. Dados Diários
    try {
        const p1 = new URLSearchParams({ ...paramsDefaults, time_grouping: "day" });
        const r1 = await fetch(`https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/${campaignUuid}?${p1}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (r1.ok) {
            const data = await r1.json();
            for (const row of data) {
                const date = row["dt_local"] || row["RTBCampaignReports.localDisplayTime"] || row["RTBCampaignReports.startDate"];
                if (date) {
                    await env.DB.prepare(`
                        INSERT INTO daily_metrics (campaign_uuid, date, impressions, plays, cost)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(campaign_uuid, date) DO UPDATE SET 
                            impressions=excluded.impressions, plays=excluded.plays, cost=excluded.cost
                    `).bind(
                        campaignUuid,
                        date.split('T')[0],
                        row["impressions"] || 0,
                        row["plays"] || 0,
                        row["net_cost"] || 0
                    ).run();
                }
            }
        }
    } catch (e) { console.error(`Erro diário (${campaignUuid}):`, e); }

    // 2. Dados por Tela
    try {
        const p2 = new URLSearchParams({ ...paramsDefaults, screen_grouping: "true" });
        const r2 = await fetch(`https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/${campaignUuid}?${p2}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (r2.ok) {
            const data = await r2.json();
            for (const row of data) {
                const lat = row["point_of_display_lat"];
                const lng = row["point_of_display_long"];

                if (lat && lng) {
                    await env.DB.prepare(`
                        INSERT INTO screen_metrics (campaign_uuid, screen_name, city, country, address, lat, lng, impressions, plays, cost)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(campaign_uuid, screen_name) DO UPDATE SET
                            impressions=excluded.impressions, plays=excluded.plays, cost=excluded.cost
                    `).bind(
                        campaignUuid,
                        row["point_of_display_name"] || "Tela",
                        row["point_of_display_city_name"],
                        row["point_of_display_country"],
                        row["point_of_display_address"],
                        lat, lng,
                        row["impressions"] || 0,
                        row["plays"] || 0,
                        row["net_cost"] || 0
                    ).run();
                }
            }
        }
    } catch (e) { console.error(`Erro telas (${campaignUuid}):`, e); }
}
