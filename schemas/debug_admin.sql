-- ===================================
-- DEBUG: Verificar e Criar Usuário Admin
-- ===================================

-- 1. Ver todos os usuários
SELECT 'USUÁRIOS EXISTENTES:' as info;
SELECT id, email, name, role, client_id FROM users;

-- 2. Garantir que o admin existe
DELETE FROM users WHERE email = 'admin@emidias.com';

INSERT INTO users (id, email, password_hash, name, role, client_id) 
VALUES (1, 'admin@emidias.com', 'admin123', 'Administrador', 'admin', NULL);

-- 3. Verificar novamente
SELECT 'ADMIN CRIADO:' as info;
SELECT id, email, name, role FROM users WHERE email = 'admin@emidias.com';
