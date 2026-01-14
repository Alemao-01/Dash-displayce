# 🔍 Auditoria de Código - DisplayCE Dashboard

## Problemas Identificados

### ❌ Críticos

#### 1. **Estilos Inline no HTML** (login.html)
**Localização:** `login.html` linhas 13-97
- **Problema:** Tag `<style>` completa dentro do HTML com 84 linhas de CSS
- **Impacto:** Dificulta manutenção, CSS não é cacheável, viola separação de responsabilidades
- **Solução:** Mover tudo para `styles.css`

#### 2. **JavaScript Inline no HTML** (login.html)
**Localização:** `login.html` linhas 120-158
- **Problema:** Script completo (38 linhas) dentro do HTML
- **Impacto:** Não é cacheável, viola CSP, dificulta debugging
- **Solução:** Mover para arquivo `login.js` separado

#### 3. **Atributos style= Inline** (index.html)
**Localização:**
- Linha 55: `style="display:none;"`
- Linha 63: `style="display:none;"`  
- Linha 65: `style="display:none;"`
- Linha 207: `style="margin-top: 10px; font-size: 0.8em;"`

**Solução:** Criar classes CSS no `styles.css`

#### 4. **Atributos onclick= Inline** (index.html)
**Localização:**
- Linha 59: `onclick="document.getElementById('refreshBtn').click()"`
- Linha 174: `onclick="switchImpressionsView('city', this)"`
- Linha 176: `onclick="switchImpressionsView('country', this)"`
- Linha 190: `onclick="switchInvestmentView('city', this)"`
- Linha 192: `onclick="switchInvestmentView('country', this)"`

**Solução:** Adicionar event listeners em `script.js`

---

### ⚠️ Médios

#### 5. **CSS Duplicado e Conflitante**
**Localização:** `styles.css`
- Linha 103-104: `.campaign-selector-container { display: none !important; }`
- Linhas 220-222: `.metrics-grid { display: none !important; }` mas depois tem estilos para `.metrics-grid`
- **Problema:** Código morto, uso excessivo de `!important`

#### 6. **Gerenciamento de Gráficos**
**Localização:** `script.js`
- **Problema:** Objeto `graficos` para evitar memory leaks, mas não há verificação consistente
- **Solução:** Implementar destroy() antes de recriar gráficos

#### 7. **Cache HTTP Inexistente**
**Localização:** `src/index.js`
- **Problema:** Nenhum header de cache para assets estáticos
- **Solução:** Adicionar Cache-Control headers

---

### 💡 Melhorias Sugeridas

#### 8. **Organização de Arquivos**
```
public/
├── index.html
├── login.html
├── styles.css
├── script.js
└── login.js  ← CRIAR
```

#### 9. **localStorage Não Otimizado**
**Localização:** `script.js`
- Acessos repetidos ao localStorage
- **Solução:** Cache em variável

#### 10. **Falta de Debounce em Event Handlers**
- Seletor de campanha dispara carregamento imediatamente
- **Solução:** Debounce para evitar múltiplas requisições

---

## 📋 Checklist de Melhorias

### Frontend
- [ ] Mover CSS inline de login.html para styles.css
- [ ] Mover JavaScript inline de login.html para login.js
- [ ] Remover style= inline do index.html
- [ ] Remover onclick= inline do index.html
- [ ] Limpar CSS duplicado/morto
- [ ] Adicionar classes utilitárias (.hidden, .update-time-text)
- [ ] Implementar destroy() adequado para gráficos
- [ ] Otimizar acessos ao localStorage

### Backend
- [ ] Adicionar Cache-Control headers para assets
- [ ] Implementar ETag para verificação de mudanças

### Documentação
- [ ] Criar documento de padrões de código
- [ ] Adicionar comentários JSDoc em funções principais

---

## 🎯 Prioridades

### Alta (Fazer Agora)
1. Mover CSS e JS inline para arquivos separados
2. Remover atributos inline (style=, onclick=)
3. Limpar código CSS morto

### Média (Próxima Sprint)
1. Implementar cache HTTP
2. Otimizar gráficos e memory management

### Baixa (Backlog)
1. Adicionar JSDoc
2. Implementar debounce
