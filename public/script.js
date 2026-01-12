// Cores para os gráficos
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF',
    '#F1948A', '#5DADE2', '#F5B041', '#52BE80', '#F9E79F'
];

// Gerenciamento de instâncias de gráficos para evitar memory leaks
const graficos = {
    dailyImpressions: null,
    dailyCost: null,
    cities: null,
    countries: null,
    citysCost: null,
    cpp: null
};

// URL da API (Automática dependendo se é localhost ou produção)
const API_BASE = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8787' : '';

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

        // Pegar ID da Campanha (poderia vir da URL ?campaign=UUID ou do usuário)
        // Por enquanto, vamos pegar a primeira disponível ou hardcoded para teste
        const user = JSON.parse(localStorage.getItem('user'));
        const campaignUuid = "4b57a25c-7edc-4026-9661-94802403fd3f"; // UUID Exemplo - depois virá dinâmico

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

        // Formatar dados para o formato que nossas funções já esperam
        // A API retorna { daily: [], screens: [] } com nomes de colunas do Banco
        // Precisamos adaptar para os objetos que o processarDados espera ou ajustar o processarDados

        // VAMOS ADAPTAR AQUI MESMO PARA MANTER INTEGRIDADE
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

        if (dadosDiarios.length === 0 && dadosTelas.length === 0) {
            throw new Error('Nenhum dado encontrado para esta campanha.');
        }

        // Processar dados
        const dadosProcessados = processarDados(dadosDiarios, dadosTelas);

        // Esconder carregamento e mostrar conteúdo
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // Atualizar as métricas
        atualizarMetricas(dadosProcessados);

        // Renderizar mapa e gráficos com requestAnimationFrame para performance
        await new Promise(resolve => requestAnimationFrame(resolve));

        inicializarMapa(dadosProcessados);
        criarGraficos(dadosProcessados, dadosDiarios, dadosTelas);

        // Atualizar timestamp
        document.getElementById('updateTime').textContent = new Date().toLocaleString('pt-BR');

    } catch (error) {
        console.error('Erro:', error);

        document.getElementById('loading').style.display = 'none';
        const errorEl = document.getElementById('error');
        errorEl.style.display = 'block';

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

    // Processar dados por dia
    dadosDiarios.forEach(item => {
        const data = new Date(item.dt_local);
        const dataFormatada = data.toLocaleDateString('pt-BR');

        if (!metricas.metricasDiarias[dataFormatada]) {
            metricas.metricasDiarias[dataFormatada] = {
                impressions: 0,
                cost: 0,
                timestamp: data.getTime()
            };
        }
        metricas.metricasDiarias[dataFormatada].impressions += item.impressions || 0;
        metricas.metricasDiarias[dataFormatada].cost += item.net_cost || 0;
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
}

function inicializarMapa(dados) {
    const latCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lat : 0;
    const lngCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lng : 0;

    // Se já existe mapa, remover (embora a variável global tenha sido removida, 
    // na prática o container é limpo ou recriado, aqui assumimos novo load limpo)
    // Mas para garantir, checamos se o container tem filhos e limpamos se necessário ou usamos remove() se tivéssemos ref
    // Como removemos a global 'mapa', vamos assumir que a função cria um novo escopado.

    // Melhor approach: verificar se o elemento 'map' já tem intância leaflet associada?
    // Leaflet não anexa fácil ao DOM element.
    // Vamos apenas recriar assumindo refresh de página ou limpar container:
    const mapContainer = document.getElementById('map');
    if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null; // Hack simples pra resetar se necessário, mas idealmente usar remove()
        mapContainer.innerHTML = '';
    }

    const mapa = L.map('map').setView([latCentral, lngCentral], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapa);

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
            <strong>Custo:</strong> R$ ${localizacao.cost.toFixed(2)}
        `;

        const marcador = L.circleMarker([localizacao.lat, localizacao.lng], {
            radius: tamanhoMarcador + 2, // Aumentar um pouco o raio
            fillColor: '#FF0055', // Cor vibrante (rosa choque/vermelho) para destaque
            color: '#FFFFFF', // Borda branca para contraste
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9 // Mais opaco para visibilidade
        }).bindPopup(textoPopup);

        markers.addLayer(marcador);
    });

    mapa.addLayer(markers);

    // Ajustar zoom e posição do mapa
    if (dados.geoLocations.length > 0) {
        const limites = L.latLngBounds(
            dados.geoLocations.map(loc => [loc.lat, loc.lng])
        );
        mapa.fitBounds(limites, { padding: [50, 50] });
    }

    return mapa; // Retorna instância caso precise usar externamente
}

function criarGraficos(metricas, dadosDiarios, dadosTelas) {
    try {
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

        graficos.dailyImpressions = new Chart(document.getElementById('dailyImpressionsChart'), {
            type: 'line',
            data: {
                labels: datasOrdenadas,
                datasets: [{
                    label: 'Impressões',
                    data: impressoesDiarias,
                    borderColor: '#4ECDC4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#4ECDC4'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: {
                        ticks: { maxRotation: 45, minRotation: 0 }
                    }
                }
            }
        });

        const custosDiarios = datasOrdenadas.map(d => metricas.metricasDiarias[d].cost);

        graficos.dailyCost = new Chart(document.getElementById('dailyCostChart'), {
            type: 'line',
            data: {
                labels: datasOrdenadas,
                datasets: [{
                    label: 'Investimento (R$)',
                    data: custosDiarios,
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#FF6B6B'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    x: {
                        ticks: { maxRotation: 45, minRotation: 0 }
                    }
                }
            }
        });

        const rotuloCidades = Object.keys(metricas.cidades)
            .sort((a, b) => metricas.cidades[b].impressions - metricas.cidades[a].impressions);
        const impressoesCidades = rotuloCidades.map(c => metricas.cidades[c].impressions);

        graficos.cities = new Chart(document.getElementById('citiesChart'), {
            type: 'bar',
            data: {
                labels: rotuloCidades,
                datasets: [{
                    label: 'Impressões',
                    data: impressoesCidades,
                    backgroundColor: colors.slice(0, rotuloCidades.length),
                    borderColor: '#333',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // Gráfico de Pizza - Distribuição por País
        const rotuloPaises = Object.keys(metricas.paises);
        const impressoesPaises = rotuloPaises.map(c => metricas.paises[c].impressions);

        graficos.countries = new Chart(document.getElementById('countriesChart'), {
            type: 'pie',
            data: {
                labels: rotuloPaises,
                datasets: [{
                    data: impressoesPaises,
                    backgroundColor: colors.slice(0, rotuloPaises.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 }, padding: 15 }
                    }
                }
            }
        });

        // Gráfico de Pizza - Custo por Cidade
        const custosCidades = rotuloCidades.map(c => metricas.cidades[c].cost);

        graficos.citysCost = new Chart(document.getElementById('citysCostChart'), {
            type: 'pie',
            data: {
                labels: rotuloCidades,
                datasets: [{
                    data: custosCidades,
                    backgroundColor: colors.slice(0, rotuloCidades.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 10 }
                    }
                }
            }
        });

        // Gráfico de Pizza - Custo por País
        const custosPaises = rotuloPaises.map(p => metricas.paises[p].cost);

        graficos.cpp = new Chart(document.getElementById('cppChart'), {
            type: 'pie',
            data: {
                labels: rotuloPaises,
                datasets: [{
                    data: custosPaises,
                    backgroundColor: colors.slice(0, rotuloPaises.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 10 }, padding: 10 }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Opa! Erro ao criar os gráficos:', error);
    }
}

window.addEventListener('load', carregarDados);
