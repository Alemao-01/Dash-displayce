// ===================================
// Login Page Script - DisplayCE Dashboard
// ===================================

// URL da API - Caminho relativo para funcionar em qualquer domínio
const API_BASE = '';

// Elementos DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = loginForm.querySelector('button[type="submit"]');

// Event Listener do Form
loginForm.addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    // Desabilita botão e mostra estado de loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando...";
    errorMsg.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Salva token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redireciona para dashboard
            window.location.href = 'index.html';
        } else {
            throw new Error(data.error || 'Erro ao logar');
        }
    } catch (error) {
        // Mostra erro
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');

        // Reabilita botão
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
    }
}
