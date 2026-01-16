-- 1. Remover qualquer usuário que possa conflitar (ID 1 ou email admin)
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE email = 'admin@emidias.com';

-- 2. Inserir Admin limpo
INSERT INTO users (id, email, password_hash, name, role, client_id) 
VALUES (1, 'admin@emidias.com', 'admin123', 'Administrador', 'admin', NULL);
