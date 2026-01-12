import requests
import json

# SEU TOKEN (cole o token gigante que você recebeu)
TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpWazRMMk9uR0lmT3ZaeWttZTQ4WiJ9.eyJwZ3Jlc3Rfcm9sZSI6InBvc3RncmVzdCIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9wdWJsaXNoZXIiOm51bGwsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS91c2VyX3V1aWQiOiI4OGNkNjQ3Yy1jYTg2LTRmYzItYTQ5Zi0zMjk1Zjg5YzY5ZDkiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vYWdlbmN5X3V1aWQiOiI2YWVhMzk2MC03ZDQwLTRjYTUtODVhZC0xNzY5OGRiYWQ4NDYiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vaGFzX2FjY2VzcyI6dHJ1ZSwiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeSI6MTA4NywiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeV9uYW1lIjoiQWdlbmNpYSBFLVLDoWRpb3MgLSBCUiIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9yb2xlcyI6WyJyb2xlX3RyYWRlcl9ydGIiLCJyb2xlX2FnZW5jeV9hZG1pbiJdLCJuaWNrbmFtZSI6InRhdGljbzEiLCJuYW1lIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2ViYjE2ZDY4YjdlZDk0OGJlZDg3NjViOWYwNTNiMDk0P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGdGEucG5nIiwidXBkYXRlZF9hdCI6IjIwMjYtMDEtMDlUMTk6NDk6NDIuNzEyWiIsImVtYWlsIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vZGlzcGxheWNlLmV1LmF1dGgwLmNvbS8iLCJhdWQiOiIxaDd6NnljVG91UDFoZ2JwRnd6czF5YVEyZkw0UmFNMiIsInN1YiI6ImF1dGgwfDY5M2M0N2NmZjdhMjI4ZTBiNzE0Zjc0OSIsImlhdCI6MTc2Nzk4ODE4MywiZXhwIjoxNzY4MDI0MTgzfQ.Afpp-nU88VbYeOmr333nXZOZdi9fUJKjV7hJYufcyPolpt08IGrzXE8LVeKtMjiLLH6nBJQMI7WBS361X8aBcTFswuuYKEVr53RYJXlBJeerKVAaUjB9QzAcefRMvv4dNboRtdqFeGScweYc7pBXus2YZJAjEHB65vMf2_SXnK2ixOJVLq0Fim47uec7jpi8b-dl38f9KEcStXXy0lyxKBz1K9CN3arLzsyLvusX3jm3C7D6t7EAjK8a_ehZZnxFdmbzHQLkV99UUWIZuwXKpOQ5NWSECEPM6MNAPTQDV9n8Qiok0xat3ck7b3ogL4oIJU9-6lvrbpct6Lkv83CF_g"

def listar_campanhas():
    # Headers com seu token
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }
    
    # URL CORRETA (sem agency_id)
    url = "https://datahub.displayce.com/agencies/v2/rtb/campaigns"
    
    print("Buscando suas campanhas...")
    print(f"URL: {url}")
    
    # Fazer requisição
    response = requests.get(url, headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        campanhas = response.json()
        
        print(f"\n✅ SUCESSO! Encontradas {len(campanhas)} campanhas:")
        print("=" * 50)
        
        for i, campanha in enumerate(campanhas, 1):
            nome = campanha.get('name', 'Sem nome')
            uuid = campanha.get('uuid', 'Sem UUID')
            estado = campanha.get('status', 'Desconhecido')
            
            # Converter estado para texto
            status_map = {0: "Pendente", 1: "Em execução", 2: "Terminado"}
            status_texto = status_map.get(estado, f"Status {estado}")
            
            print(f"{i}. {nome}")
            print(f"   UUID: {uuid}")
            print(f"   Status: {status_texto}")
            
            # Mostrar outros campos interessantes se existirem
            if 'advertiser_name' in campanha:
                print(f"   Anunciante: {campanha['advertiser_name']}")
            if 'created_at' in campanha:
                print(f"   Criado: {campanha['created_at']}")
            if 'budget' in campanha:
                print(f"   Budget: {campanha['budget']}")
                
            print("-" * 30)
        
        return campanhas
        
    else:
        print(f"❌ ERRO: {response.status_code}")
        print(f"Resposta: {response.text}")
        
        # Se for erro 401, token expirou
        if response.status_code == 401:
            print("\n🔄 Token provavelmente expirou. Faça login novamente.")
        
        return None

def fazer_login_se_necessario():
    """Função extra para renovar token se necessário"""
    print("Renovando token...")
    
    data = {
        "username": "tatico1@hubradios.com", 
        "password": "sua_senha_atual"  # Coloque sua senha atual
    }
    
    response = requests.post(
        "https://datahub.displayce.com/agencies/v2/rtb/reports/login",
        data=data
    )
    
    if response.status_code == 200:
        novo_token = response.json()
        print("✅ Novo token obtido!")
        print("Cole este token no código:")
        print(f'TOKEN = "{novo_token}"')
        return novo_token
    else:
        print(f"❌ Erro no login: {response.text}")
        return None

# Executar
campanhas = listar_campanhas()

# Se der certo, salvar em arquivo
if campanhas:
    with open("campanhas.json", "w", encoding="utf-8") as f:
        json.dump(campanhas, f, indent=2, ensure_ascii=False)
    print(f"\n💾 Campanhas salvas em 'campanhas.json'")
    
    # Mostrar UUIDs das campanhas ativas para próximo passo
    ativas = [c for c in campanhas if c.get('status') == 1]
    if ativas:
        print(f"\n🔥 {len(ativas)} campanhas EM EXECUÇÃO:")
        for c in ativas:
            print(f"- {c['name']}: {c['uuid']}")