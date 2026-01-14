-- ===================================
-- SCHEMA ATUALIZADO - Sistema Multi-Cliente
-- ===================================

-- Tabela de Usuários (atualizada)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'client', -- 'admin' ou 'client'
    client_id INTEGER, -- FK para clients (NULL se admin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Tabela de Clientes/Anunciantes (NOVA)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- Ex: "SECOM", "Prefeitura"
    advertiser_name TEXT NOT NULL, -- Nome exato da DisplayCE API
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Campanhas (atualizada)
CREATE TABLE IF NOT EXISTS campaigns (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    custom_name TEXT, -- Nome customizado pelo admin (opcional)
    advertiser_name TEXT NOT NULL,
    custom_advertiser TEXT, -- Nome customizado pelo admin (opcional)
    client_id INTEGER, -- FK para clients
    status TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Tabela de Override de Valores (NOVA)
CREATE TABLE IF NOT EXISTS campaign_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_uuid TEXT NOT NULL UNIQUE,
    custom_cost REAL NOT NULL, -- Valor customizado (manual)
    notes TEXT, -- Observações internas
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER, -- FK para users (admin que editou)
    FOREIGN KEY (campaign_uuid) REFERENCES campaigns(uuid),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Tabela de Métricas Diárias
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

-- Tabela de Métricas por Tela (Geolocalização)
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
    UNIQUE(campaign_uuid, screen_name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_campaign ON daily_metrics(campaign_uuid);
CREATE INDEX IF NOT EXISTS idx_screen_campaign ON screen_metrics(campaign_uuid);
CREATE INDEX IF NOT EXISTS idx_overrides_campaign ON campaign_overrides(campaign_uuid);

-- ===================================
-- DADOS INICIAIS (Admin padrão)
-- ===================================

-- Inserir usuário admin padrão (senha: admin123)
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, client_id) 
VALUES (1, 'admin@emidias.com', 'admin123', 'Administrador', 'admin', NULL);

-- Inserir cliente exemplo: SECOM
INSERT OR IGNORE INTO clients (id, name, advertiser_name) 
VALUES (1, 'SECOM', 'ESTADO DO RIO GRANDE DO SUL');
