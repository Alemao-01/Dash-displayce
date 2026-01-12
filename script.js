// Cores para os gráficos
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF',
    '#F1948A', '#5DADE2', '#F5B041', '#52BE80', '#F9E79F'
];

let mapa; // Variável global pro mapa

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

// Carregar dados
async function carregarDados() {
    try {
        const [dailyRes, screenRes] = await Promise.all([
            fetch('performance_diaria.json'),
            fetch('performance_por_tela.json')
        ]);

        const dadosDiarios = await dailyRes.json();
        const dadosTelas = await screenRes.json();

        // Processar dados
        const dadosProcessados = processarDados(dadosDiarios, dadosTelas);

        // Esconder carregamento e mostrar conteúdo
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        // Atualizar as métricas
        atualizarMetricas(dadosProcessados);

        // Aguardar um pouquinho pro mapa renderizar antes dos gráficos
        setTimeout(() => {
            // Inicializar mapa
            inicializarMapa(dadosProcessados);

            // Criar os gráficos
            criarGraficos(dadosProcessados, dadosDiarios, dadosTelas);
        }, 100);

        // Atualizar timestamp
        document.getElementById('updateTime').textContent = new Date().toLocaleString('pt-BR');

    } catch (error) {
        console.error('Opa! Erro ao carregar os dados:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = '❌ Opa! Erro ao carregar os dados. Verifica se os arquivos JSON estão na mesma pasta aí!';
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

    // Processar dados por dia (organizado certinho)
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
}

function inicializarMapa(dados) {
    const latCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lat : 0;
    const lngCentral = dados.geoLocations.length > 0 ? dados.geoLocations[0].lng : 0;

    mapa = L.map('map').setView([latCentral, lngCentral], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapa);

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
            radius: tamanhoMarcador,
            fillColor: '#667eea',
            color: '#333',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).bindPopup(textoPopup);

        marcador.addTo(mapa);
    });

    // Ajustar zoom e posição do mapa
    if (dados.geoLocations.length > 0) {
        const limites = L.latLngBounds(
            dados.geoLocations.map(loc => [loc.lat, loc.lng])
        );
        mapa.fitBounds(limites, { padding: [50, 50] });
    }
}

function criarGraficos(metricas, dadosDiarios, dadosTelas) {
    try {
        // Ordenar datas corretamente (usando timestamp)
        const datasOrdenadas = Object.keys(metricas.metricasDiarias)
            .sort((a, b) => metricas.metricasDiarias[a].timestamp - metricas.metricasDiarias[b].timestamp);

        const impressoesDiarias = datasOrdenadas.map(d => metricas.metricasDiarias[d].impressions);

        new Chart(document.getElementById('dailyImpressionsChart'), {
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

        new Chart(document.getElementById('dailyCostChart'), {
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

        new Chart(document.getElementById('citiesChart'), {
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

        new Chart(document.getElementById('countriesChart'), {
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

        new Chart(document.getElementById('citysCostChart'), {
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

        new Chart(document.getElementById('cppChart'), {
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
