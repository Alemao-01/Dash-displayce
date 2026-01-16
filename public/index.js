// ===================================
// Admin Page Script
// ===================================

const API_BASE = '';
let currentCampaign = null;
let allCampaigns = [];

// Elementos DOM
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const tableEl = document.getElementById('campaignsTable');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('editModal');
const saveBtn = document.getElementById('saveBtn');

// Verificar autenticação
async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return { token, user };
}

// Carregar campanhas
async function loadCampaigns() {
    const auth = await checkAuth();
    if (!auth) return;
    const { token, user } = auth;

    try {
        loadingEl.classList.remove('hidden');
        errorEl.classList.add('hidden');

        // Admin vê todas as campanhas, cliente vê apenas as suas
        const apiUrl = user.role === 'admin' ? '/api/admin/campaigns' : '/api/campaigns';

        const response = await fetch(`${API_BASE}${apiUrl}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar campanhas');
        }

        allCampaigns = await response.json();

        // Atualizar cabeçalho da tabela baseado no role
        updateTableHeader(user);

        renderTable(allCampaigns, user);

        loadingEl.classList.add('hidden');
        tableEl.classList.remove('hidden');

    } catch (error) {
        console.error('Erro:', error);
        errorEl.textContent = `❌ ${error.message}`;
        errorEl.classList.remove('hidden');
        loadingEl.classList.add('hidden');
    }
}

// Atualizar cabeçalho da tabela
function updateTableHeader(user) {
    const isAdmin = user && user.role === 'admin';
    const table = document.querySelector('.campaigns-table thead tr');

    if (isAdmin) {
        table.innerHTML = `
            <th>Nome</th>
            <th>Cliente</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Custo Real</th>
            <th>Valor Cliente</th>
            <th>Impressões</th>
            <th>Ações</th>
        `;
    } else {
        table.innerHTML = `
            <th>Nome</th>
            <th>Cliente</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Investimento</th>
            <th>Impressões</th>
            <th>Ações</th>
        `;
    }
}

// Renderizar tabela
function renderTable(campaigns, user) {
    if (campaigns.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-row">Nenhuma campanha encontrada</td></tr>';
        return;
    }

    const isAdmin = user && user.role === 'admin';

    tableBody.innerHTML = campaigns.map(c => {
        const realCost = c.real_cost || 0;
        const customCost = c.custom_cost || realCost;
        const hasOverride = c.custom_cost ? '✓' : '';

        return `
            <tr>
                <td><strong>${c.custom_name || c.original_name || 'Sem nome'}</strong></td>
                <td>${c.custom_advertiser || c.original_advertiser || c.client_name || '-'}</td>
                <td>${formatDate(c.start_date)}</td>
                <td>${formatDate(c.end_date) || 'Em andamento'}</td>
                ${isAdmin ? `<td>${formatCurrency(realCost)}</td>` : ''}
                <td>
                    ${formatCurrency(customCost)} 
                    ${hasOverride ? '<span class="badge-edited">editado</span>' : ''}
                </td>
                <td>${formatNumber(c.total_impressions || 0)}</td>
                <td>
                    ${isAdmin ? `<button class="btn-icon" data-campaign-uuid="${c.uuid}" data-action="edit" title="Editar valores">✏️</button>` : ''}
                    <button class="btn-icon" data-campaign-uuid="${c.uuid}" data-action="view" title="Ver dashboard">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Abrir modal de edição
function openEditModal(uuid) {
    const campaign = allCampaigns.find(c => c.uuid === uuid);
    if (!campaign) return;

    currentCampaign = campaign;

    // Preencher modal
    document.getElementById('modalCampaignName').value = campaign.custom_name || '';
    document.getElementById('modalOriginalName').textContent = campaign.original_name || '';
    document.getElementById('modalAdvertiser').value = campaign.custom_advertiser || '';
    document.getElementById('modalOriginalAdvertiser').textContent = campaign.original_advertiser || '';

    // Corrigir bug visual R$ R$ removendo prefixo 'R$' e espaços extras
    const realCostFormatted = formatCurrency(campaign.real_cost || 0).replace(/^R\$\s*/, '');
    document.getElementById('modalRealCost').textContent = realCostFormatted;
    document.getElementById('modalCustomCost').value = campaign.custom_cost || '';
    document.getElementById('modalNotes').value = campaign.notes || '';

    modal.classList.remove('hidden');
}

// Fechar modal
function closeModal() {
    modal.classList.add('hidden');
    currentCampaign = null;
}

// Salvar override
async function saveOverride() {
    if (!currentCampaign) return;

    const customName = document.getElementById('modalCampaignName').value;
    const customAdvertiser = document.getElementById('modalAdvertiser').value;
    const customCostInput = document.getElementById('modalCustomCost').value;
    const customCost = customCostInput ? parseFloat(customCostInput) : null;
    const notes = document.getElementById('modalNotes').value;

    // Validação: se preencheu custo, tem que ser válido
    if (customCostInput && (isNaN(customCost) || customCost < 0)) {
        alert('Valor inválido. Digite um número positivo ou deixe em branco.');
        return;
    }

    const { token } = await checkAuth();
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Salvando...';

    try {
        const response = await fetch(`${API_BASE}/api/admin/campaigns/${currentCampaign.uuid}/override`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                custom_cost: customCost,
                notes: notes,
                custom_name: customName,
                custom_advertiser: customAdvertiser
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar');
        }

        closeModal();
        loadCampaigns(); // Recarregar tabela

    } catch (error) {
        alert(`Erro: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Salvar';
    }
}

// Busca
function filterCampaigns() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allCampaigns.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm) ||
        (c.advertiser || '').toLowerCase().includes(searchTerm) ||
        (c.client_name || '').toLowerCase().includes(searchTerm)
    );
    renderTable(filtered);
}

// Formatadores
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Event Listeners - REGISTRADOS APÓS O DOM CARREGAR
document.addEventListener('DOMContentLoaded', () => {
    // Garantir que modal inicia fechado
    if (modal) modal.classList.add('hidden');

    // Event listeners dos botões do modal (somente se existirem)
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (saveBtn) saveBtn.addEventListener('click', saveOverride);

    // Click no fundo do modal para fechar
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { // Somente se clicar no fundo
                closeModal();
            }
        });
    }

    // Event listener de busca
    if (searchInput) searchInput.addEventListener('input', filterCampaigns);

    // Botão de refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadCampaigns);

    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});

// Event listener global para delegação
document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const uuid = e.target.dataset.campaignUuid;

    if (action === 'edit' && uuid) {
        openEditModal(uuid);
    } else if (action === 'view' && uuid) {
        localStorage.setItem('selectedCampaignUuid', uuid);
        window.location.href = 'dashboard.html';
    }
});

// Carregar ao iniciar
window.addEventListener('load', () => {
    // Garantir que modal está fechado
    if (modal) modal.classList.add('hidden');

    // Carregar campanhas
    loadCampaigns();
});
