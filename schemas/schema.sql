-- Criação da tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'client', -- 'admin' ou 'client'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da tabela de Campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status INTEGER,
    advertiser_name TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    user_id INTEGER, -- Dono da campanha (cliente)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criação da tabela de Métricas Diárias
CREATE TABLE IF NOT EXISTS daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_uuid TEXT NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_uuid) REFERENCES campaigns(uuid),
    UNIQUE(campaign_uuid, date)
);

-- Criação da tabela de Métricas por Tela (Geolocalização)
CREATE TABLE IF NOT EXISTS screen_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_uuid TEXT NOT NULL,
    screen_name TEXT,
    city TEXT,
    country TEXT,
    address TEXT,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    impressions INTEGER DEFAULT 0,
    plays INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_uuid) REFERENCES campaigns(uuid),
    UNIQUE(campaign_uuid, screen_name) -- Simplificação: 1 registro acumulado por tela por campanha
);

-- Índices para performance
CREATE INDEX idx_campaigns_user ON campaigns(user_id);
CREATE INDEX idx_daily_campaign ON daily_metrics(campaign_uuid);
CREATE INDEX idx_screen_campaign ON screen_metrics(campaign_uuid);
