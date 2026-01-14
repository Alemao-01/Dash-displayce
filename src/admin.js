// ===================================
// Admin Routes - Sistema Multi-Cliente
// ===================================

/**
 * Verifica se o usuário é admin
 */
function isAdmin(user) {
    return user && user.role === 'admin';
}

/**
 * Extrai user do token (simplificado)
 */
async function getUserFromToken(token, env) {
    if (!token || !token.startsWith('sys-token-')) return null;

    const userId = parseInt(token.split('-')[2]);
    const user = await env.DB.prepare(
        "SELECT id, name, role, client_id FROM users WHERE id = ?"
    ).bind(userId).first();

    return user;
}

/**
 * Listar TODAS as campanhas (admin only)
 */
export async function listAllCampaigns(env, user) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    const { results } = await env.DB.prepare(`
        SELECT 
            c.uuid,
            COALESCE(c.custom_name, c.name) as name,
            COALESCE(c.custom_advertiser, c.advertiser_name) as advertiser,
            c.start_date,
            c.end_date,
            c.status,
            cl.name as client_name,
            co.custom_cost,
            (SELECT SUM(cost) FROM daily_metrics WHERE campaign_uuid = c.uuid) as real_cost,
            (SELECT SUM(impressions) FROM daily_metrics WHERE campaign_uuid = c.uuid) as total_impressions,
            (SELECT SUM(plays) FROM daily_metrics WHERE campaign_uuid = c.uuid) as total_plays
        FROM campaigns c
        LEFT JOIN clients cl ON c.client_id = cl.id
        LEFT JOIN campaign_overrides co ON c.uuid = co.campaign_uuid
        ORDER BY c.last_updated DESC
    `).all();

    return { data: results, status: 200 };
}

/**
 * Criar/editar override de valor
 */
export async function saveCampaignOverride(env, user, campaignUuid, customCost, notes) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    await env.DB.prepare(`
        INSERT INTO campaign_overrides (campaign_uuid, custom_cost, notes, updated_by)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(campaign_uuid) DO UPDATE SET
            custom_cost = excluded.custom_cost,
            notes = excluded.notes,
            updated_by = excluded.updated_by,
            updated_at = CURRENT_TIMESTAMP
    `).bind(campaignUuid, customCost, notes || null, user.id).run();

    return { success: true, status: 200 };
}

/**
 * Atualizar nome customizado da campanha
 */
export async function updateCampaignNames(env, user, campaignUuid, customName, customAdvertiser) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    await env.DB.prepare(`
        UPDATE campaigns
        SET custom_name = ?, custom_advertiser = ?
        WHERE uuid = ?
    `).bind(customName || null, customAdvertiser || null, campaignUuid).run();

    return { success: true, status: 200 };
}

/**
 * Listar clientes
 */
export async function listClients(env, user) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    const { results } = await env.DB.prepare(`
        SELECT id, name, advertiser_name, created_at
        FROM clients
        ORDER BY name ASC
    `).all();

    return { data: results, status: 200 };
}

/**
 * Criar cliente
 */
export async function createClient(env, user, name, advertiserName) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    await env.DB.prepare(`
        INSERT INTO clients (name, advertiser_name)
        VALUES (?, ?)
    `).bind(name, advertiserName).run();

    return { success: true, status: 201 };
}

/**
 * Listar usuários (admin only)
 */
export async function listUsers(env, user) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    const { results } = await env.DB.prepare(`
        SELECT u.id, u.email, u.name, u.role, u.client_id, c.name as client_name
        FROM users u
        LEFT JOIN clients c ON u.client_id = c.id
        ORDER BY u.created_at DESC
    `).all();

    return { data: results, status: 200 };
}

/**
 * Criar usuário
 */
export async function createUser(env, user, email, password, name, role, clientId) {
    if (!isAdmin(user)) {
        return { error: "Permissão negada", status: 403 };
    }

    // Validação simples
    if (!email || !password || !name || !role) {
        return { error: "Campos obrigatórios faltando", status: 400 };
    }

    if (role !== 'admin' && role !== 'client') {
        return { error: "Role inválido", status: 400 };
    }

    if (role === 'client' && !clientId) {
        return { error: "Cliente obrigatório para usuário tipo client", status: 400 };
    }

    try {
        await env.DB.prepare(`
            INSERT INTO users (email, password_hash, name, role, client_id)
            VALUES (?, ?, ?, ?, ?)
        `).bind(email, password, name, role, clientId || null).run();

        return { success: true, status: 201 };
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            return { error: "Email já cadastrado", status: 409 };
        }
        throw e;
    }
}

/**
 * Handler de rotas admin
 */
export async function handleAdminRoutes(url, request, env, corsHeaders) {
    const path = url.pathname;
    const method = request.method;

    // Extrair token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    const user = await getUserFromToken(token, env);

    // Listar todas as campanhas
    if (path === '/api/admin/campaigns' && method === 'GET') {
        const result = await listAllCampaigns(env, user);
        return new Response(JSON.stringify(result.error || result.data), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Salvar override de valor
    if (path.match(/^\/api\/admin\/campaigns\/[^/]+\/override$/) && method === 'POST') {
        const campaignUuid = path.split('/')[4];
        const { custom_cost, notes } = await request.json();

        const result = await saveCampaignOverride(env, user, campaignUuid, custom_cost, notes);
        return new Response(JSON.stringify(result.error || { success: true }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Atualizar nomes customizados
    if (path.match(/^\/api\/admin\/campaigns\/[^/]+\/names$/) && method === 'POST') {
        const campaignUuid = path.split('/')[4];
        const { custom_name, custom_advertiser } = await request.json();

        const result = await updateCampaignNames(env, user, campaignUuid, custom_name, custom_advertiser);
        return new Response(JSON.stringify(result.error || { success: true }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Listar clientes
    if (path === '/api/admin/clients' && method === 'GET') {
        const result = await listClients(env, user);
        return new Response(JSON.stringify(result.error || result.data), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Criar cliente
    if (path === '/api/admin/clients' && method === 'POST') {
        const { name, advertiser_name } = await request.json();
        const result = await createClient(env, user, name, advertiser_name);
        return new Response(JSON.stringify(result.error || { success: true }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Listar usuários
    if (path === '/api/admin/users' && method === 'GET') {
        const result = await listUsers(env, user);
        return new Response(JSON.stringify(result.error || result.data), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Criar usuário
    if (path === '/api/admin/users' && method === 'POST') {
        const { email, password, name, role, client_id } = await request.json();
        const result = await createUser(env, user, email, password, name, role, client_id);
        return new Response(JSON.stringify(result.error || { success: true }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return null; // Rota não encontrada
}
