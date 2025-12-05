# 🔐 Configuração de Segurança - Netlify

## Variáveis de Ambiente Necessárias

Configure estas variáveis no Netlify: **Site configuration → Environment variables**

### 1. Banco de Dados MongoDB
```
MONGODB_URI=mongodb+srv://juliusromanzeira_db_user:Tarcizinho1@cluster0.yifjtek.mongodb.net/
DB_NAME=watt_consultoria
```

### 2. Autenticação JWT
```
JWT_SECRET=<copie do arquivo .env local>
```

### 3. Secret para Requisitar Tokens (NOVO!)
```
TOKEN_REQUEST_SECRET=<copie do arquivo .env local>
```

### 4. APIs Externas (Power BI, etc)
```
API_SECRET_KEY=<copie do arquivo .env local>
POWERBI_API_KEY=<copie do arquivo .env local>
```

## ⚠️ Importante

- Marque todas como **"Contains secret values"**
- Configure para **"All scopes"** (Builds, Functions, Runtime)
- **NUNCA** commite estes valores no Git

## Arquivo Local `token-config.js`

Este arquivo contém o `TOKEN_REQUEST_SECRET` e deve estar presente no Netlify:

1. No Netlify, vá em **Deploys → Trigger deploy → Clear cache and deploy site**
2. O arquivo `token-config.js` será criado automaticamente durante o build (se configurado)
3. Ou você pode fazer upload manual do arquivo via Netlify UI

**Conteúdo do arquivo:**
```javascript
window.TOKEN_CONFIG = {
  secret: '<copie TOKEN_REQUEST_SECRET do .env>'
};
```

## Como Funciona a Segurança

1. **Frontend** carrega `token-config.js` (contém `TOKEN_REQUEST_SECRET`)
2. **Frontend** faz GET para `/get-token` enviando header `X-Token-Secret`
3. **Backend** valida o secret e retorna um JWT válido por 1 hora
4. **Frontend** usa o JWT para fazer POST em `/salvar-ficha`
5. **Backend** valida o JWT e salva no MongoDB

### Camadas de Proteção:
- ✅ Verificação de origem (referer/origin)
- ✅ Secret para obter token (`TOKEN_REQUEST_SECRET`)
- ✅ JWT com assinatura e expiração
- ✅ Bloqueio de GET direto em `/salvar-ficha`
