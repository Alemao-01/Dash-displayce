import requests
import json
from datetime import datetime, timedelta
import os

# CONFIGURATIONS
# TODO: Use environment variables or a config file for sensitive data in production
TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlpWazRMMk9uR0lmT3ZaeWttZTQ4WiJ9.eyJwZ3Jlc3Rfcm9sZSI6InBvc3RncmVzdCIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9wdWJsaXNoZXIiOm51bGwsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS91c2VyX3V1aWQiOiI4OGNkNjQ3Yy1jYTg2LTRmYzItYTQ5Zi0zMjk1Zjg5YzY5ZDkiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vYWdlbmN5X3V1aWQiOiI2YWVhMzk2MC03ZDQwLTRjYTUtODVhZC0xNzY5OGRiYWQ4NDYiLCJodHRwczovL3NvbHV0aW9uLmRpc3BsYXljZS5jb20vaGFzX2FjY2VzcyI6dHJ1ZSwiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeSI6MTA4NywiaHR0cHM6Ly9zb2x1dGlvbi5kaXNwbGF5Y2UuY29tL2FnZW5jeV9uYW1lIjoiQWdlbmNpYSBFLVLDoWRpb3MgLSBCUiIsImh0dHBzOi8vc29sdXRpb24uZGlzcGxheWNlLmNvbS9yb2xlcyI6WyJyb2xlX3RyYWRlcl9ydGIiLCJyb2xlX2FnZW5jeV9hZG1pbiJdLCJuaWNrbmFtZSI6InRhdGljbzEiLCJuYW1lIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyL2ViYjE2ZDY4YjdlZDk0OGJlZDg3NjViOWYwNTNiMDk0P3M9NDgwJnI9cGcmZD1odHRwcyUzQSUyRiUyRmNkbi5hdXRoMC5jb20lMkZhdmF0YXJzJTJGdGEucG5nIiwidXBkYXRlZF9hdCI6IjIwMjYtMDEtMDlUMTk6NDk6NDIuNzEyWiIsImVtYWlsIjoidGF0aWNvMUBodWJyYWRpb3MuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vZGlzcGxheWNlLmV1LmF1dGgwLmNvbS8iLCJhdWQiOiIxaDd6NnljVG91UDFoZ2JwRnd6czF5YVEyZkw0UmFNMiIsInN1YiI6ImF1dGgwfDY5M2M0N2NmZjdhMjI4ZTBiNzE0Zjc0OSIsImlhdCI6MTc2Nzk4ODE4MywiZXhwIjoxNzY4MDI0MTgzfQ.Afpp-nU88VbYeOmr333nXZOZdi9fUJKjV7hJYufcyPolpt08IGrzXE8LVeKtMjiLLH6nBJQMI7WBS361X8aBcTFswuuYKEVr53RYJXlBJeerKVAaUjB9QzAcefRMvv4dNboRtdqFeGScweYc7pBXus2YZJAjEHB65vMf2_SXnK2ixOJVLq0Fim47uec7jpi8b-dl38f9KEcStXXy0lyxKBz1K9CN3arLzsyLvusX3jm3C7D6t7EAjK8a_ehZZnxFdmbzHQLkV99UUWIZuwXKpOQ5NWSECEPM6MNAPTQDV9n8Qiok0xat3ck7b3ogL4oIJU9-6lvrbpct6Lkv83CF_g"
API_BASE_URL = "https://datahub.displayce.com/agencies/v2/rtb"

# Ensure output directory exists
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
if not os.path.exists(PUBLIC_DIR):
    os.makedirs(PUBLIC_DIR)


def get_headers():
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }


def list_campaigns():
    """Fetches and lists all campaigns."""
    url = f"{API_BASE_URL}/campaigns"
    print(f"🔍 Fetching campaigns from: {url}")
    
    response = requests.get(url, headers=get_headers())
    
    if response.status_code == 200:
        campaigns = response.json()
        print(f"✅ Found {len(campaigns)} campaigns.")
        return campaigns
    else:
        print(f"❌ Error fetching campaigns: {response.status_code} - {response.text}")
        return []


def save_json(filename, data):
    """Saves data to the public directory."""
    filepath = os.path.join(PUBLIC_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved {filename} to {filepath}")


def fetch_report(campaign_uuid, params, report_type):
    """Generic function to fetch report data."""
    url = f"{API_BASE_URL}/reports/delivery/{campaign_uuid}"
    print(f"🔍 Fetching {report_type} report for {campaign_uuid}...")
    
    response = requests.get(url, headers=get_headers(), params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Loaded {len(data)} records for {report_type}.")
        return data
    else:
        print(f"❌ Error fetching {report_type}: {response.status_code} - {response.text}")
        return []


def update_dashboard_data(campaign_uuid):
    """Updates all necessary data for the dashboard for a specific campaign."""
    print(f"\n🔄 Updating dashboard for campaign: {campaign_uuid}")
    
    # 1. Daily Performance
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    daily_params = {
        "date_filter": start_date.strftime("%Y-%m-%d"),
        "date_filter_end": end_date.strftime("%Y-%m-%d"),
        "time_grouping": "day",
        "show_campaign_dates": "true"
    }
    daily_data = fetch_report(campaign_uuid, daily_params, "Daily Performance")
    if daily_data:
        save_json("performance_diaria.json", daily_data)

    # 2. Screen/Location Performance
    screen_params = {
        "screen_grouping": "true",
        "show_campaign_dates": "true"
    }
    screen_data = fetch_report(campaign_uuid, screen_params, "Screen Performance")
    if screen_data:
        save_json("performance_por_tela.json", screen_data)


def main():
    print("🚀 DisplayCE Manager Started")
    
    # 1. List Campaigns
    campaigns = list_campaigns()
    
    if campaigns:
        # Save campaigns list just in case
        save_json("campanhas.json", campaigns)
        
        # 2. Find active campaign
        # Using the logic from previous scripts: preferring status 1 (Running)
        active_campaigns = [c for c in campaigns if c.get('status') == 1]
        
        target_uuid = None
        if active_campaigns:
            print(f"\n🔥 Found {len(active_campaigns)} active campaigns.")
            target_campaign = active_campaigns[0] # Pick the first active one
            target_uuid = target_campaign.get('uuid')
            print(f"👉 Selecting: {target_campaign.get('name')} ({target_uuid})")
        elif campaigns:
             print("\n⚠️ No active campaigns found. Using the first available campaign.")
             target_uuid = campaigns[0].get('uuid')
        
        # 3. Fetch Data if we have a target
        if target_uuid:
            update_dashboard_data(target_uuid)
        else:
            print("❌ No campaign UUID available to fetch data.")
            
    else:
        print("❌ No campaigns found. Check your token or connection.")

if __name__ == "__main__":
    main()
