-- Ver o usuário admin atual
SELECT id, email, password_hash, name, role, client_id 
FROM users 
WHERE id = 1 OR email = 'admin@emidias.com';

-- Atualizar para garantir que é admin
UPDATE users 
SET role = 'admin', client_id = NULL 
WHERE id = 1;
