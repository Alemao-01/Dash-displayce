// Cores E-Mídias
const brandColors = ['#e91e8c', '#7b2cbf', '#1a1a4e', '#4facfe', '#43e97b', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

// Gerenciamento de instâncias de gráficos para evitar memory leaks
const graficos = {
    dailyUnified: null,
    impressionsGeo: null,
    investmentGeo: null
};

// Dados para os gráficos geográficos
let geoDataState = {
    impressionsView: 'city',
    investmentView: 'city',
    metricas: null
};

// Instância global do mapa para evitar memory leak
let mapaGlobal = null;

// URL da API (Backend Worker) - Caminho relativo para funcionar em qualquer domínio
const API_BASE = '';

// Mapa de tradução de países
const paisesTraducao = {
    'UY': 'Uruguai',
    'AR': 'Argentina',
    'BR': 'Brasil',
    'CL': 'Chile',
    'CO': 'Colômbia',
    'PE': 'Peru',
    'MX': 'México',
    'US': 'Estados Unidos',
    'ES': 'Espanha',
    'PT': 'Portugal',
    'IT': 'Itália',
    'FR': 'França',
    'DE': 'Alemanha',
    'GB': 'Reino Unido',
    'JP': 'Japão',
    'CN': 'China',
    'IN': 'Índia',
    'AU': 'Austrália',
    'CA': 'Canadá'
};

// Função para traduzir código do país
function traduzirPais(codigo) {
    return paisesTraducao[codigo] || codigo;
}

// Verificar Autenticação ao carregar
async function verificarAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// Carregar dados
async function carregarDados() {
    try {
        const token = await verificarAuth();
        if (!token) return;

        // 1. Carregar lista de campanhas se ainda não tiver
        const campaignSelect = document.getElementById('campaignSelect');
        const currentCampaignUuid = localStorage.getItem('selectedCampaignUuid');

        if (campaignSelect.options.length <= 1) { // Só carrega se estiver vazio/padrão
            try {
                const respCamps = await fetch(`${API_BASE}/api/campaigns`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (respCamps.ok) {
                    const campaigns = await respCamps.json();
                    campaignSelect.innerHTML = campaigns.map(c =>
                        `<option value="${c.uuid}" ${c.uuid === currentCampaignUuid ? 'selected' : ''}>${c.name} (${c.advertiser_name})</option>`
                    ).join('');

                    if (campaigns.length > 0 && !currentCampaignUuid) {
                        localStorage.setItem('selectedCampaignUuid', campaigns[0].uuid);
                    }
                }
            } catch (e) {
                console.warn("Erro ao carregar lista de campanhas:", e);
                campaignSelect.innerHTML = '<option value="">Erro ao carregar campanhas</option>';
            }
        }

        const campaignUuid = localStorage.getItem('selectedCampaignUuid');
        if (!campaignUuid) {
            throw new Error('Nenhuma campanha disponível. Tente rodar a atualização manual.');
        }

        // Buscar dados da API
        const resp = await fetch(`${API_BASE}/api/dashboard?campaign=${campaignUuid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resp.status === 401) {
            alert("Sessão expirada");
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }

        if (!resp.ok) throw new Error(`Erro na API: ${resp.status}`);
        const dadosAPI = await resp.json();

        // Adaptar dados...
        const dadosDiarios = dadosAPI.daily.map(d => ({
            dt_local: d.date,
            impressions: d.impressions,
            plays: d.plays,
            net_cost: d.cost
        }));

        const dadosTelas = dadosAPI.screens.map(s => ({
            point_of_display_name: s.screen_name,
            point_of_display_city_name: s.city,
            point_of_display_country: s.country,
            point_of_display_address: s.address,
            point_of_display_lat: s.lat,
            point_of_display_long: s.lng,
            impressions: s.impressions,
            plays: s.plays,
            net_cost: s.cost
        }));

        // Verificar se tem dados
        if (dadosDiarios.length === 0 && dadosTelas.length === 0) {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('emptyState').classList.remove('hidden');
            return;
        }

        // Processar dados
        const dadosProcessados = processarDados(dadosDiarios, dadosTelas);

        // Esconder carregamento e mostrar conteúdo
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

        // Atualizar as métricas
        atualizarMetricas(dadosProcessados);

        // Renderizar mapa e gráficos com requestAnimationFrame para performance
        await new Promise(resolve => requestAnimationFrame(resolve));

        inicializarMapa(dadosProcessados);
        criarGraficos(dadosProcessados, dadosDiarios, dadosTelas);

        // Atualizar timestamp
        document.getElementById('updateTime').textContent = new Date().toLocaleString('pt-BR');

        // Atualizar informações da campanha no header
        if (dadosAPI.campaign) {
            const campaignInfo = document.getElementById('campaignInfo');
            // Usar valores customizados se existirem (editados pelo admin)
            const campaignName = dadosAPI.campaign.custom_name || dadosAPI.campaign.name;
            const advertiser = dadosAPI.campaign.custom_advertiser || dadosAPI.campaign.advertiser;
            campaignInfo.textContent = `${campaignName} - ${advertiser}`;
            campaignInfo.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Erro:', error);

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
        const errorEl = document.getElementById('error');
        errorEl.classList.remove('hidden');

        // Mostrar erro amigável pro usuário
        errorEl.innerHTML = `<strong>❌ Erro ao carregar dados</strong><br>${error.message}`;
    }
}

function processarDados(dadosDiarios, dadosTelas) {
    const metricas = {
        totalCost: 0,
        totalImpressions: 0,
        totalPlays: 0,
        totalScreens: new Set(),
        cidades: {},
        paises: {},
        geoLocations: [],
        metricasDiarias: {},
        avgImpressionsPerScreen: 0,
        avgCostPerScreen: 0
    };

    // Processar os dados por tela pra geolocalização
    dadosTelas.forEach(item => {
        metricas.totalCost += item.net_cost || 0;
        metricas.totalImpressions += item.impressions || 0;
        metricas.totalPlays += item.plays || 0;
        metricas.totalScreens.add(item.point_of_display_name);

        const cidade = item.point_of_display_city_name || 'Desconhecido';
        const paisCodigo = item.point_of_display_country || 'Desconhecido';
        const paisTraduzido = traduzirPais(paisCodigo);

        if (!metricas.cidades[cidade]) {
            metricas.cidades[cidade] = { impressions: 0, cost: 0, plays: 0, pais: paisTraduzido };
        }
        metricas.cidades[cidade].impressions += item.impressions || 0;
        metricas.cidades[cidade].cost += item.net_cost || 0;
        metricas.cidades[cidade].plays += item.plays || 0;

        if (!metricas.paises[paisTraduzido]) {
            metricas.paises[paisTraduzido] = { impressions: 0, cost: 0, plays: 0 };
        }
        metricas.paises[paisTraduzido].impressions += item.impressions || 0;
        metricas.paises[paisTraduzido].cost += item.net_cost || 0;
        metricas.paises[paisTraduzido].plays += item.plays || 0;

        if (item.point_of_display_lat && item.point_of_display_long) {
            metricas.geoLocations.push({
                lat: item.point_of_display_lat,
                lng: item.point_of_display_long,
                cidade: cidade,
                pais: paisTraduzido,
                impressions: item.impressions,
                cost: item.net_cost,
                address: item.point_of_display_address
            });
        }
    });

    const screenCount = metricas.totalScreens.size || 1;
    metricas.avgImpressionsPerScreen = metricas.totalImpressions / screenCount;
    metricas.avgCostPerScreen = metricas.totalCost / screenCount;

    // Processar dados por dia com validação defensiva
    dadosDiarios.forEach(item => {
        // Validação defensiva de data
        if (!item.dt_local || typeof item.dt_local !== 'string') {
            console.warn('Data inválida ignorada:', item);
            return;
        }

        try {
            const parts = item.dt_local.split('T')[0].split('-');
            if (parts.length !== 3) return; // Skip formato inválido

            const data = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            if (isNaN(data.getTime())) return; // Skip data inválida

            const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            if (!metricas.metricasDiarias[dataFormatada]) {
                metricas.metricasDiarias[dataFormatada] = {
                    impressions: 0,
                    cost: 0,
                    timestamp: data.getTime()
                };
            }
            metricas.metricasDiarias[dataFormatada].impressions += item.impressions || 0;
            metricas.metricasDiarias[dataFormatada].cost += item.net_cost || 0;
        } catch (e) {
            console.warn('Erro ao processar data:', item.dt_local, e);
        }
    });

    metricas.totalCidades = Object.keys(metricas.cidades).length;
    metricas.totalPaises = Object.keys(metricas.paises).length;

    return metricas;
}

function atualizarMetricas(dados) {
    document.getElementById('totalCost').textContent =
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.totalCost);

    document.getElementById('totalImpressions').textContent =
        new Intl.NumberFormat('pt-BR').format(Math.round(dados.totalImpressions));

    document.getElementById('totalPlays').textContent =
        new Intl.NumberFormat('pt-BR').format(dados.totalPlays);

    document.getElementById('totalScreens').textContent = dados.totalScreens.size;
    document.getElementById('totalCities').textContent = dados.totalCidades;
    document.getElementById('totalCountries').textContent = dados.totalPaises;

    document.getElementById('mapCities').textContent = dados.totalCidades;
    document.getElementById('mapCountries').textContent = dados.totalPaises;
    document.getElementById('avgImpressions').textContent =
        new Intl.NumberFormat('pt-BR').format(Math.round(dados.avgImpressionsPerScreen));
    document.getElementById('avgCost').textContent =
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.avgCostPerScreen);

    // Atualizar Hero Stats
    document.getElementById('heroCost').textContent =
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dados.totalCost);
    document.getElementById('heroImpressions').textContent =
        new Intl.NumberFormat('pt-BR').format(Math.round(dados.totalImpressions));
    document.getElementById('heroScreens').textContent = dados.totalScreens.size;
    document.getElementById('heroPlays').textContent =
        new Intl.NumberFormat('pt-BR').format(dados.totalPlays);
}

function inicializarMapa(dados) {
    const latCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lat : 0;
    const lngCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lng : 0;

    // Destruir mapa anterior corretamente para evitar memory leak
    if (mapaGlobal) {
        mapaGlobal.remove();
        mapaGlobal = null;
    }

    // Limpar container
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = '';

    // Criar novo mapa
    mapaGlobal = L.map('map').setView([latCentral, lngCentral], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapaGlobal);

    // Criar grupo de cluster
    const markers = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
    });

    // Criar marcadores individuais para cada tela
    dados.geoLocations.forEach(localizacao => {
        const tamanhoMarcador = Math.max(5, Math.sqrt(localizacao.impressions / 500));

        const textoPopup = `
            <strong>📍 ${localizacao.cidade}, ${localizacao.pais}</strong><br>
            <strong>Endereço:</strong> ${localizacao.address || 'N/A'}<br>
            <strong>Impressões:</strong> ${new Intl.NumberFormat('pt-BR').format(Math.round(localizacao.impressions))}<br>
            <strong>Custo:</strong> R$ ${(localizacao.cost || 0).toFixed(2)}
        `;

        const marcador = L.circleMarker([localizacao.lat, localizacao.lng], {
            radius: tamanhoMarcador + 2,
            fillColor: '#e91e8c', // Magenta E-Mídias
            color: '#FFFFFF', // Borda branca para contraste
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).bindPopup(textoPopup);

        markers.addLayer(marcador);
    });

    mapaGlobal.addLayer(markers);

    // Ajustar zoom e posição do mapa
    if (dados.geoLocations.length > 0) {
        const limites = L.latLngBounds(
            dados.geoLocations.map(loc => [loc.lat, loc.lng])
        );
        mapaGlobal.fitBounds(limites, { padding: [50, 50] });
    }

    return mapaGlobal;
}

function criarGraficos(metricas, dadosDiarios, dadosTelas) {
    try {
        // Salvar métricas globalmente para os toggles
        geoDataState.metricas = metricas;

        // Destruir gráficos existentes antes de criar novos para evitar Memory Leaks
        Object.keys(graficos).forEach(key => {
            if (graficos[key]) {
                graficos[key].destroy();
                graficos[key] = null;
            }
        });

        // Ordenar datas corretamente (usando timestamp)
        const datasOrdenadas = Object.keys(metricas.metricasDiarias)
            .sort((a, b) => metricas.metricasDiarias[a].timestamp - metricas.metricasDiarias[b].timestamp);

        const impressoesDiarias = datasOrdenadas.map(d => metricas.metricasDiarias[d].impressions);
        const custosDiarios = datasOrdenadas.map(d => metricas.metricasDiarias[d].cost);

        // Gráfico Unificado com dois eixos Y
        graficos.dailyUnified = new Chart(document.getElementById('dailyUnifiedChart'), {
            type: 'line',
            data: {
                labels: datasOrdenadas,
                datasets: [
                    {
                        label: 'Impressões',
                        data: impressoesDiarias,
                        borderColor: '#e91e8c',
                        backgroundColor: 'rgba(233, 30, 140, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#e91e8c',
                        yAxisID: 'yImpressions'
                    },
                    {
                        label: 'Investimento (R$)',
                        data: custosDiarios,
                        borderColor: '#7b2cbf',
                        backgroundColor: 'rgba(123, 44, 191, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#7b2cbf',
                        yAxisID: 'yInvestment'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        onClick: function (e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const chart = legend.chart;
                            const meta = chart.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                            chart.update();
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { maxRotation: 45, minRotation: 0 }
                    },
                    yImpressions: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Impressões',
                            color: '#e91e8c'
                        },
                        ticks: {
                            color: '#e91e8c'
                        }
                    },
                    yInvestment: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Investimento (R$)',
                            color: '#7b2cbf'
                        },
                        ticks: {
                            color: '#7b2cbf'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });

        // Criar gráfico de Impressões Geográficas (inicia com cidades)
        criarGraficoImpressoes(metricas, 'city');

        // Criar gráfico de Investimento Geográfico (inicia com cidades)
        criarGraficoInvestimento(metricas, 'city');

    } catch (error) {
        console.error('Opa! Erro ao criar os gráficos:', error);
    }
}

// Função para criar gráfico de Impressões Geográficas
function criarGraficoImpressoes(metricas, view) {
    if (graficos.impressionsGeo) {
        graficos.impressionsGeo.destroy();
    }

    const data = view === 'city' ?
        Object.keys(metricas.cidades).sort((a, b) => metricas.cidades[b].impressions - metricas.cidades[a].impressions) :
        Object.keys(metricas.paises).sort((a, b) => metricas.paises[b].impressions - metricas.paises[a].impressions);

    const impressions = view === 'city' ?
        data.map(c => metricas.cidades[c].impressions) :
        data.map(p => metricas.paises[p].impressions);

    // Cores suaves e harmônicas
    const softColors = ['#a8d5e2', '#f9a8d4', '#b8e0d2', '#eac4d5', '#9fd3c7', '#ffd7ba', '#d4a5a5', '#b5ead7'];

    graficos.impressionsGeo = new Chart(document.getElementById('impressionsGeoChart'), {
        type: 'bar',
        data: {
            labels: data,
            datasets: [{
                label: 'Impressões',
                data: impressions,
                backgroundColor: softColors.slice(0, data.length),
                borderColor: '#fff',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return new Intl.NumberFormat('pt-BR').format(context.parsed.x) + ' impressões';
                        }
                    }
                }
            }
        }
    });
}

// Função para criar gráfico de Investimento Geográfico (DONUT)
function criarGraficoInvestimento(metricas, view) {
    if (graficos.investmentGeo) {
        graficos.investmentGeo.destroy();
    }

    const data = view === 'city' ?
        Object.keys(metricas.cidades).sort((a, b) => metricas.cidades[b].cost - metricas.cidades[a].cost) :
        Object.keys(metricas.paises).sort((a, b) => metricas.paises[b].cost - metricas.paises[a].cost);

    const costs = view === 'city' ?
        data.map(c => metricas.cidades[c].cost) :
        data.map(p => metricas.paises[p].cost);

    // Cores suaves e harmônicas para donut
    const softColors = ['#a8d5e2', '#f9a8d4', '#b8e0d2', '#eac4d5', '#9fd3c7', '#ffd7ba', '#d4a5a5', '#b5ead7'];

    graficos.investmentGeo = new Chart(document.getElementById('investmentGeoChart'), {
        type: 'doughnut',
        data: {
            labels: data,
            datasets: [{
                label: 'Investimento (R$)',
                data: costs,
                backgroundColor: softColors.slice(0, data.length),
                borderColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.label + ': R$ ' + context.parsed.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Funções para alternar visualização
function switchImpressionsView(view, btn) {
    if (view === geoDataState.impressionsView || !geoDataState.metricas) return;

    geoDataState.impressionsView = view;

    // Atualizar botões
    const parent = btn.parentElement;
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Recriar gráfico
    criarGraficoImpressoes(geoDataState.metricas, view);
}

function switchInvestmentView(view, btn) {
    if (view === geoDataState.investmentView || !geoDataState.metricas) return;

    geoDataState.investmentView = view;

    // Atualizar botões
    const parent = btn.parentElement;
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Recriar gráfico
    criarGraficoInvestimento(geoDataState.metricas, view);
}

// Event Listeners
document.getElementById('campaignSelect').addEventListener('change', (e) => {
    localStorage.setItem('selectedCampaignUuid', e.target.value);
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('content').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    carregarDados();
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.innerHTML = '⏳';

    try {
        const resp = await fetch(`${API_BASE}/api/update-manual`);
        if (resp.ok) {
            console.log("Sincronização manual acionada com sucesso.");
            // Aguarda 2 segundos para o D1 processar e recarrega
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            alert("Erro ao acionar atualização manual.");
            btn.disabled = false;
            btn.innerHTML = '🔄';
        }
    } catch (e) {
        console.error(e);
        btn.disabled = false;
        btn.innerHTML = '🔄';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCampaignUuid');
    window.location.href = 'login.html';
});

// Event delegation para toggles de gráficos
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toggle-btn')) {
        const chartType = e.target.dataset.chart;
        const view = e.target.dataset.view;

        if (chartType === 'impressions') {
            switchImpressionsView(view, e.target);
        } else if (chartType === 'investment') {
            switchInvestmentView(view, e.target);
        }
    }

    // Evento para o botão de refresh no empty state
    if (e.target.dataset.action === 'refresh') {
        document.getElementById('refreshBtn').click();
    }
});

window.addEventListener('load', carregarDados);
