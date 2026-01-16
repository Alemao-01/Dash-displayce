-- ===================================
-- FIX CRÍTICO: Permitir custom_cost NULL
-- ===================================

-- Recriar tabela campaign_overrides sem NOT NULL
DROP TABLE IF EXISTS campaign_overrides;

CREATE TABLE campaign_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_uuid TEXT NOT NULL UNIQUE,
    custom_cost REAL,  -- ✅ Agora aceita NULL
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (campaign_uuid) REFERENCES campaigns(uuid),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_overrides_campaign ON campaign_overrides(campaign_uuid);
