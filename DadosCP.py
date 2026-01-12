import requests
import json
from datetime import datetime, timedelta

TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpWazRMMk9uR0lmT3ZaeWttZTQ4WiJ9.eyJwZ3Jlc3Rfcm9sZSI6InBvc3RncmVzdCIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9wdWJsaXNoZXIiOm51bGwsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS91c2VyX3V1aWQiOiI4OGNkNjQ3Yy1jYTg2LTRmYzItYTQ5Zi0zMjk1Zjg5YzY5ZDkiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vYWdlbmN5X3V1aWQiOiI2YWVhMzk2MC03ZDQwLTRjYTUtODVhZC0xNzY5OGRiYWQ4NDYiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vaGFzX2FjY2VzcyI6dHJ1ZSwiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeSI6MTA4NywiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeV9uYW1lIjoiQWdlbmNpYSBFLVLDoWRpb3MgLSBCUiIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9yb2xlcyI6WyJyb2xlX3RyYWRlcl9ydGIiLCJyb2xlX2FnZW5jeV9hZG1pbiJdLCJuaWNrbmFtZSI6InRhdGljbzEiLCJuYW1lIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2ViYjE2ZDY4YjdlZDk0OGJlZDg3NjViOWYwNTNiMDk0P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGdGEucG5nIiwidXBkYXRlZF9hdCI6IjIwMjYtMDEtMDlUMTk6NDk6NDIuNzEyWiIsImVtYWlsIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vZGlzcGxheWNlLmV1LmF1dGgwLmNvbS8iLCJhdWQiOiIxaDd6NnljVG91UDFoZ2JwRnd6czF5YVEyZkw0UmFNMiIsInN1YiI6ImF1dGgwfDY5M2M0N2NmZjdhMjI4ZTBiNzE0Zjc0OSIsImlhdCI6MTc2Nzk4ODE4MywiZXhwIjoxNzY4MDI0MTgzfQ.Afpp-nU88VbYeOmr333nXZOZdi9fUJKjV7hJYufcyPolpt08IGrzXE8LVeKtMjiLLH6nBJQMI7WBS361X8aBcTFswuuYKEVr53RYJXlBJeerKVAaUjB9QzAcefRMvv4dNboRtdqFeGScweYc7pBXus2YZJAjEHB65vMf2_SXnK2ixOJVLq0Fim47uec7jpi8b-dl38f9KEcStXXy0lyxKBz1K9CN3arLzsyLvusX3jm3C7D6t7EAjK8a_ehZZnxFdmbzHQLkV99UUWIZuwXKpOQ5NWSECEPM6MNAPTQDV9n8Qiok0xat3ck7b3ogL4oIJU9-6lvrbpct6Lkv83CF_g"
CAMPAIGN_UUID = "4b57a25c-7edc-4026-9661-94802403fd3f"

def buscar_dados_agrupados(tipo_agrupamento="day", periodo_dias=30):
    """
    Busca dados com diferentes agrupamentos
    tipo_agrupamento: 'day', 'week', 'hour'
    """
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }
    
    # Calcular datas (últimos 30 dias)
    data_fim = datetime.now()
    data_inicio = data_fim - timedelta(days=periodo_dias)
    
    # Parâmetros para API
    params = {
        "date_filter": data_inicio.strftime("%Y-%m-%d"),
        "date_filter_end": data_fim.strftime("%Y-%m-%d"),
        "time_grouping": tipo_agrupamento,
        "show_campaign_dates": "true"
    }
    
    url = f"https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/{CAMPAIGN_UUID}"
    
    print(f"🔍 Buscando dados agrupados por {tipo_agrupamento}...")
    print(f"📅 Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}")
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        dados = response.json()
        print(f"✅ {len(dados)} registros encontrados")
        return dados
    else:
        print(f"❌ Erro: {response.status_code}")
        print(f"Resposta: {response.text}")
        return None

def buscar_dados_por_tela():
    """Busca performance agrupada por tela/local"""
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }
    
    params = {
        "screen_grouping": "true",
        "show_campaign_dates": "true"
    }
    
    url = f"https://datahub.displayce.com/agencies/v2/rtb/reports/delivery/{CAMPAIGN_UUID}"
    
    print("📍 Buscando dados por tela/local...")
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        dados = response.json()
        print(f"✅ {len(dados)} telas encontradas")
        return dados
    else:
        print(f"❌ Erro: {response.status_code}")
        return None

def analisar_performance_diaria(dados_diarios):
    """Analisa performance dia a dia"""
    
    if not dados_diarios:
        return
    
    print("\n📊 PERFORMANCE DIÁRIA:")
    print("=" * 60)
    
    total_plays = 0
    total_impressions = 0
    total_cost = 0
    
    for dia in dados_diarios[:10]:  # Primeiros 10 dias
        data = dia.get('RTBCampaignReports.displayTime', 'N/A')
        plays = dia.get('RTBCampaignReports.plays', 0)
        impressions = dia.get('RTBCampaignReports.imps', 0) 
        cost = dia.get('RTBCampaignReports.netCost', 0)
        
        print(f"📅 {data}")
        print(f"   Inserções: {plays:,}")
        print(f"   Impressões: {impressions:,}")
        print(f"   Custo: R\$ {cost:.2f}")
        if impressions > 0:
            cpm = (cost / impressions) * 1000
            print(f"   CPM: R\$ {cpm:.2f}")
        print("-" * 30)
        
        total_plays += plays
        total_impressions += impressions
        total_cost += cost
    
    print(f"\n📈 TOTAIS DO PERÍODO:")
    print(f"   Inserções: {total_plays:,}")
    print(f"   Impressões: {total_impressions:,}")
    print(f"   Custo Total: R\$ {total_cost:.2f}")
    if total_impressions > 0:
        print(f"   CPM Médio: R\$ {(total_cost/total_impressions)*1000:.2f}")

def analisar_performance_por_tela(dados_telas):
    """Analisa performance por tela/local"""
    
    if not dados_telas:
        return
    
    print("\n📍 PERFORMANCE POR LOCAL:")
    print("=" * 60)
    
    # Ordenar por número de plays (maior primeiro)
    dados_ordenados = sorted(dados_telas, 
                           key=lambda x: x.get('RTBCampaignReports.plays', 0), 
                           reverse=True)
    
    for i, tela in enumerate(dados_ordenados[:10]):  # Top 10 telas
        endereco = tela.get('RTBCampaignReports.geocodedFullAddress', 'Endereço não disponível')
        cidade = tela.get('RTBCampaignReports.geocodedCity', '')
        plays = tela.get('RTBCampaignReports.plays', 0)
        impressions = tela.get('RTBCampaignReports.imps', 0)
        cost = tela.get('RTBCampaignReports.netCost', 0)
        device_id = tela.get('RTBCampaignReports.deviceId', 'N/A')
        
        print(f"\n🏆 #{i+1} MELHOR TELA:")
        print(f"   📍 Local: {endereco}")
        print(f"   🏙️ Cidade: {cidade}")
        print(f"   🆔 Device: {device_id}")
        print(f"   🎯 Inserções: {plays:,}")
        print(f"   👁️ Impressões: {impressions:,}")
        print(f"   💰 Custo: R\$ {cost:.2f}")
        if plays > 0:
            print(f"   📊 Impressões/Play: {impressions/plays:.1f}")

def gerar_dashboard_completo():
    """Gera dashboard completo para o cliente"""
    
    print("🚀 GERANDO DASHBOARD COMPLETO...")
    print("=" * 60)
    
    # 1. Dados por dia
    dados_diarios = buscar_dados_agrupados("day", 30)
    
    # 2. Dados por tela
    dados_telas = buscar_dados_por_tela()
    
    # 3. Análises
    if dados_diarios:
        analisar_performance_diaria(dados_diarios)
        
        # Salvar dados diários
        with open("performance_diaria.json", "w", encoding="utf-8") as f:
            json.dump(dados_diarios, f, indent=2, ensure_ascii=False)
        print("\n💾 Dados diários salvos: performance_diaria.json")
    
    if dados_telas:
        analisar_performance_por_tela(dados_telas)
        
        # Salvar dados por tela
        with open("performance_por_tela.json", "w", encoding="utf-8") as f:
            json.dump(dados_telas, f, indent=2, ensure_ascii=False)
        print("\n💾 Dados por tela salvos: performance_por_tela.json")
    
    return dados_diarios, dados_telas

# Executar dashboard completo
dados_dia, dados_local = gerar_dashboard_completo()