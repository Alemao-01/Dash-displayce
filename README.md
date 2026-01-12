# Dashboard de Performance - DisplayCE

Dashboard interativo para visualização de métricas de campanhas de publicidade em telas digitais.

## 📊 Funcionalidades

- **Métricas em tempo real**: Investimento total, impressões, plays, telas ativas, cidades e países
- **Mapa interativo**: Visualização geográfica de todas as telas ativas com Leaflet.js
- **Gráficos dinâmicos**: 
  - Impressões e investimento diário (gráficos de linha)
  - Distribuição por cidade e país (gráficos de pizza e barras)
- **Design responsivo**: Funciona perfeitamente em desktop, tablet e mobile

## 🚀 Como usar

### Pré-requisitos

- Python 3.x instalado

### Instalação

1. Clone este repositório:
```bash
git clone <url-do-repositorio>
cd Dash
```

2. Execute o servidor local:
```bash
python server.py
```

3. Acesse o dashboard no navegador:
```
http://localhost:8000
```

## 📁 Estrutura de arquivos

```
Dash/
├── index.html              # Interface do dashboard
├── script.js               # Lógica e processamento de dados
├── styles.css              # Estilos (não utilizado - estilos inline no HTML)
├── server.py               # Servidor HTTP local
├── performance_diaria.json # Dados de performance por dia
└── performance_por_tela.json # Dados de performance por tela
```

## 🗺️ Dados

O dashboard consome dois arquivos JSON:

- **performance_diaria.json**: Métricas agregadas por data
- **performance_por_tela.json**: Métricas detalhadas por tela (inclui geolocalização)

## 🛠️ Tecnologias

- HTML5 / CSS3 / JavaScript
- [Chart.js](https://www.chartjs.org/) - Gráficos interativos
- [Leaflet.js](https://leafletjs.com/) - Mapas interativos
- Python (servidor HTTP simples)

## 📝 Notas

- Os dados são carregados localmente dos arquivos JSON
- O mapa utiliza OpenStreetMap como base
- Marcadores no mapa são proporcionais ao número de impressões

---

**Desenvolvido para análise de campanhas DisplayCE**
