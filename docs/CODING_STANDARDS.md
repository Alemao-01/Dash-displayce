# 📐 Padrões de Desenvolvimento - DisplayCE Dashboard

Este documento define os padrões que DEVEM ser seguidos em TODAS as implementações futuras no projeto.

---

## 🎨 1. ESTILOS (CSS)

### ✅ SEMPRE:
- **TODO estilo DEVE estar em `styles.css`**
- Use classes semânticas e reutilizáveis
- Organize CSS por seções com comentários
- Use variáveis CSS (`:root`) para cores e valores repetidos

### ❌ NUNCA:
```html
<!-- ❌ PROIBIDO: Style inline -->
<div style="display: none;">...</div>
<p style="margin-top: 10px; font-size: 0.8em;">...</p>

<!-- ❌ PROIBIDO: Tag <style> no HTML -->
<style>
  .login-card { ... }
</style>
```

### ✅ CORRETO:
```css
/* styles.css */
.hidden {
  display: none;
}

.update-time-text {
  margin-top: 10px;
  font-size: 0.8em;
}
```

```html
<!-- ✅ CORRETO -->
<div class="hidden">...</div>
<p class="update-time-text">...</p>
```

---

## 🔧 2. JAVASCRIPT

### ✅ SEMPRE:
- **TODO JavaScript DEVE estar em arquivos `.js` separados**
- Use event listeners em vez de onclick=
- Nomeie funções de forma descritiva
- Adicione comentários em lógica complexa

### ❌ NUNCA:
```html
<!-- ❌ PROIBIDO: onclick inline -->
<button onclick="switchView('city')">Cidade</button>

<!-- ❌ PROIBIDO: <script> no HTML (exceto imports) -->
<script>
  document.getElementById('form').addEventListener(...)
</script>
```

### ✅ CORRETO:
```html
<!-- ✅ CORRETO -->
<button class="toggle-btn" data-view="city">Cidade</button>
<script src="script.js"></script>
```

```javascript
// script.js
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const view = e.target.dataset.view;
    switchView(view, e.target);
  });
});
```

---

## 📁 3. ORGANIZAÇÃO DE ARQUIVOS

### Estrutura Padrão:
```
public/
├── index.html          # Dashboard principal
├── login.html          # Página de login
├── styles.css          # TODOS os estilos
├── script.js           # JavaScript do dashboard
├── login.js            # JavaScript do login
└── assets/             # Imagens e recursos
    ├── logo-horizontal.png
    └── ...

src/
├── index.js            # Worker principal
├── campaigns.js        # Lógica de campanhas
└── auth.js             # Autenticação
```

---

## 🎯 4. CLASSES CSS UTILITÁRIAS

### Classes de Visibilidade:
```css
.hidden { display: none; }
.visible { display: block; }
```

### Classes de Estado:
```css
.loading { /* spinner animation */ }
.error { /* estilo de erro */ }
.success { /* estilo de sucesso */ }
```

### Uso:
```javascript
// ✅ Alternar visibilidade
element.classList.add('hidden');
element.classList.remove('hidden');

// ❌ NÃO FAZER
element.style.display = 'none';
```

---

## 🚀 5. PERFORMANCE E OTIMIZAÇÃO

### Cache de Elementos DOM:
```javascript
// ✅ CORRETO: Cache no início
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('content');

function showContent() {
  loadingEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
}

// ❌ EVITAR: Buscar toda vez
function showContent() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}
```

### Gerenciamento de Gráficos:
```javascript
// ✅ Sempre destruir antes de recriar
if (graficos.dailyChart) {
  graficos.dailyChart.destroy();
}
graficos.dailyChart = new Chart(ctx, config);
```

### Event Delegation:
```javascript
// ✅ MELHOR: Um listener para múltiplos botões
document.querySelector('.chart-toggles').addEventListener('click', (e) => {
  if (e.target.classList.contains('toggle-btn')) {
    handleToggle(e.target);
  }
});

// ❌ EVITAR: Listener em cada botão
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', handleToggle);
});
```

---

## 📝 6. NOMENCLATURA

### Variáveis e Funções:
```javascript
// ✅ camelCase para JS
const campaignData = {...};
function loadDashboard() {...}

// ✅ kebab-case para CSS
.campaign-selector { }
.btn-refresh { }
```

### IDs e Classes:
```html
<!-- ✅ Descritivo e específico -->
<div id="dailyUnifiedChart">
<button class="btn-refresh-empty">

<!-- ❌ Genérico demais -->
<div id="chart1">
<button class="btn">
```

---

## 🔐 7. SEGURANÇA E BOAS PRÁTICAS

### Sempre Validar Dados:
```javascript
// ✅ Validação antes de usar
if (!campaignUuid || campaignUuid === '') {
  showError('Campanha não selecionada');
  return;
}
```

### Tratamento de Erros:
```javascript
// ✅ Try-catch em operações assíncronas
try {
  const response = await fetch('/api/dashboard');
  const data = await response.json();
  processData(data);
} catch (error) {
  console.error('Erro ao carregar:', error);
  showError('Falha ao carregar dados');
}
```

---

## ✨ 8. EXEMPLO COMPLETO

### ❌ ANTES (Ruim):
```html
<div id="box" style="display:none; color: red;">
  <button onclick="alert('teste')">Click</button>
</div>

<style>
  #box { padding: 20px; }
</style>

<script>
  document.getElementById('btn').addEventListener('click', () => {
    document.getElementById('box').style.display = 'block';
  });
</script>
```

### ✅ DEPOIS (Correto):
```html
<!-- HTML -->
<div id="box" class="notification-box hidden">
  <button class="notification-btn">Click</button>
</div>
```

```css
/* styles.css */
.notification-box {
  padding: 20px;
  color: red;
}

.hidden {
  display: none;
}
```

```javascript
// script.js
const box = document.getElementById('box');
const btn = document.querySelector('.notification-btn');

btn.addEventListener('click', () => {
  box.classList.remove('hidden');
  alert('teste');
});
```

---

## 📊 9. CHECKLIST PRÉ-COMMIT

Antes de qualquer commit, SEMPRE verificar:

- [ ] Nenhum `style=` inline no HTML
- [ ] Nenhum `onclick=`, `onload=`, etc. no HTML
- [ ] Nenhuma tag `<style>` no HTML (exceto reset básico se necessário)
- [ ] Nenhuma tag `<script>` com código no HTML (apenas src)
- [ ] CSS organizado por seções em `styles.css`
- [ ] JavaScript em arquivos `.js` separados
- [ ] Variáveis DOM cacheadas quando usadas múltiplas vezes
- [ ] Gráficos destruídos antes de recriar
- [ ] Try-catch em operações assíncronas
- [ ] Console.log() removidos ou comentados

---

## 🎯 RESUMO: Regra de Ouro

> **"Separação de Responsabilidades"**
> - HTML = Estrutura
> - CSS = Apresentação  
> - JavaScript = Comportamento
> 
> **Cada um no seu arquivo. Sempre.**

---

**Criado em:** 14/01/2026  
**Versão:** 1.0  
**Status:** Obrigatório para todas as implementações futuras
