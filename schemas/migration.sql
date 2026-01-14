-- ===================================
-- MIGRATION INCREMENTAL - Adicionar novas colunas
-- ===================================

-- 1. Adicionar client_id à tabela users (se não existir)
ALTER TABLE users ADD COLUMN client_id INTEGER;

-- 2. Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    advertiser_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Adicionar colunas à tabela campaigns
ALTER TABLE campaigns ADD COLUMN custom_name TEXT;
ALTER TABLE campaigns ADD COLUMN custom_advertiser TEXT;
ALTER TABLE campaigns ADD COLUMN client_id INTEGER;

-- 4. Criar tabela de overrides
CREATE TABLE IF NOT EXISTS campaign_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_uuid TEXT NOT NULL UNIQUE,
    custom_cost REAL NOT NULL,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (campaign_uuid) REFERENCES campaigns(uuid),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_overrides_campaign ON campaign_overrides(campaign_uuid);

-- 6. Inserir cliente exemplo: SECOM
INSERT OR IGNORE INTO clients (id, name, advertiser_name) 
VALUES (1, 'SECOM', 'ESTADO DO RIO GRANDE DO SUL');

-- 7. Atualizar user admin para ter permissão total
UPDATE users SET role = 'admin', client_id = NULL WHERE email = 'admin@emidias.com';
INSERT OR IGNORE INTO users (id, email, password_hash, name, role, client_id) 
VALUES (1, 'admin@emidias.com', 'admin123', 'Administrador', 'admin', NULL);
