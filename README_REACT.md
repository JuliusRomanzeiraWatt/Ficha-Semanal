# 🔐 Ficha Semanal - React + JWT + Axios

## ✅ Implementação Completa

### 🎯 Stack Tecnológica

- **Frontend**: React 19 + Vite
- **HTTP Client**: Axios com interceptors
- **Autenticação**: JWT (JSON Web Tokens) - 512 bits
- **Backend**: Netlify Functions (Serverless)
- **Banco de Dados**: MongoDB Atlas
- **Segurança**: 3 camadas de proteção

---

## 🔒 Arquitetura de Segurança

### 1. **Token JWT Automático**
```javascript
// O Axios busca automaticamente o JWT antes de cada requisição
api.interceptors.request.use(async (config) => {
  if (!jwtToken) {
    const { data } = await axios.get('/get-token');
    jwtToken = data.token;
  }
  config.headers.Authorization = `Bearer ${jwtToken}`;
  return config;
});
```

### 2. **Renovação Automática**
```javascript
// Se o token expirar (401), renova automaticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Renova token e tenta novamente
      const { data } = await axios.get('/get-token');
      jwtToken = data.token;
      return api(originalRequest);
    }
  }
);
```

### 3. **Validação no Backend**
```javascript
// salvar-ficha.js valida JWT em todas as requisições POST
const payload = verifyJWT(token, jwtSecret);
if (!payload || payload.aud !== 'ficha-semanal') {
  return { statusCode: 401, error: 'Token inválido' };
}
```

---

## 🚀 Como Rodar

### Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:3001

### Build para Produção

```bash
npm run build
```

Arquivos serão gerados em `dist-react/`

---

## 📁 Estrutura do Projeto

```
Ficha-Semanal/
├── src/
│   ├── FichaSemanal.jsx       ← Componente React principal
│   ├── index.jsx              ← Entry point
│   └── styles.css             ← Estilos
├── netlify/functions/
│   ├── salvar-ficha.js        ← POST/GET com validação JWT
│   ├── get-token.js           ← Gera tokens JWT
│   ├── api-fichas.js          ← API protegida (API_SECRET_KEY)
│   ├── api-powerbi.js         ← API protegida (POWERBI_API_KEY)
│   └── auth.js                ← Módulo de autenticação
├── index.html                 ← HTML com React
├── vite.config.js             ← Configuração Vite
└── .env                       ← Variáveis de ambiente
```

---

## 🔑 Variáveis de Ambiente (Netlify)

Configure estas variáveis no Netlify:

| Variável | Valor | Uso |
|----------|-------|-----|
| `MONGODB_URI` | `mongodb+srv://...` | Conexão MongoDB |
| `DB_NAME` | `watt_consultoria` | Nome do banco |
| `JWT_SECRET` | `e8c7d6f91f57bde...` | Assinatura JWT (512 bits) |
| `API_SECRET_KEY` | `18d4a7d2c80a03...` | API externa (escrita) |
| `POWERBI_API_KEY` | `c59a2ff2ea6c4d...` | API Power BI (leitura) |

---

## 🎨 Features do React

✅ **Axios com Interceptors** - Adiciona JWT automaticamente  
✅ **Renovação automática de token** - Sem interrupção do usuário  
✅ **Validação em tempo real** - CPF, datas, campos obrigatórios  
✅ **Feedback visual** - Loading states e mensagens claras  
✅ **Gerenciamento de tarefas** - Adicionar/remover dinamicamente  
✅ **Responsivo** - Mobile-first design  
✅ **Print-friendly** - CSS otimizado para impressão  

---

## 🛡️ Segurança Implementada

| Camada | Proteção |
|--------|----------|
| **JWT** | Token assinado com HS256, expira em 1h |
| **Sanitização** | Remove scripts e HTML dos inputs |
| **Validação** | CPF, datas, tamanho do payload |
| **Rate Limiting** | Controle de requisições por IP |
| **CORS** | Configurado para origens permitidas |
| **Timing-safe** | Comparação de strings resistente a timing attacks |

---

## 📊 Endpoints Disponíveis

### 1. `GET /get-token`
Gera um novo token JWT

**Resposta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### 2. `POST /salvar-ficha` 🔒
Salva ficha (requer JWT no header Authorization)

**Headers:**
```
Authorization: Bearer {jwt_token}
```

### 3. `POST /api-fichas` 🔒
API externa (requer API_SECRET_KEY)

**Headers:**
```
x-api-key: 18d4a7d2c80a0397efbdd423864c4d36b25deb77986b9001a432602fc98ec78b
```

### 4. `GET /api-powerbi` 🔒
Power BI (requer POWERBI_API_KEY)

**Headers:**
```
x-api-key: c59a2ff2ea6c4dbb595172ec1333dfa6892efa2695758c57b70101c23ede4b0f
```

---

## 🔄 Fluxo de Autenticação

```
1. Usuário abre formulário
   ↓
2. React/Axios faz GET /get-token automaticamente
   ↓
3. Backend gera JWT assinado (válido 1h)
   ↓
4. Axios armazena token em memória
   ↓
5. Usuário preenche formulário
   ↓
6. Ao submeter, Axios adiciona "Authorization: Bearer {token}"
   ↓
7. Backend valida assinatura, expiração e audience
   ↓
8. Se válido → Salva no MongoDB
   Se inválido → Retorna 401
   ↓
9. Se 401, Axios renova token automaticamente
```

---

## 🎯 Deploy no Netlify

### 1. Build do React

```bash
npm run build
```

### 2. Configurar Build Settings

```toml
[build]
  command = "npm run build"
  publish = "dist-react"
  functions = "netlify/functions"
```

### 3. Adicionar Variáveis

No Netlify Dashboard:
- Site configuration → Environment variables
- Adicionar todas as 5 variáveis listadas acima

### 4. Deploy

```bash
git add .
git commit -m "Add React + JWT authentication"
git push
```

O Netlify fará o deploy automaticamente!

---

## ✅ Vantagens desta Implementação

| Aspecto | Benefício |
|---------|-----------|
| **Segurança** | JWT impossível de falsificar sem a chave secreta |
| **UX** | Token obtido automaticamente, usuário não percebe |
| **Performance** | Token reutilizado por 1h, reduz requisições |
| **Manutenção** | Axios interceptors centralizam a lógica |
| **Escalabilidade** | Pronto para adicionar refresh tokens |

---

## 🆘 Troubleshooting

### Erro 401 - Unauthorized
- ✅ Verifique se `JWT_SECRET` está configurado no Netlify
- ✅ Limpe o cache do navegador
- ✅ O token expira em 1h, será renovado automaticamente

### Erro de CORS
- ✅ Verifique se o domínio está correto no Axios baseURL
- ✅ Headers CORS estão configurados em todas as functions

### Formulário não salva
- ✅ Abra o Console (F12) e verifique erros
- ✅ Verifique se `MONGODB_URI` está configurado
- ✅ Confirme que todas as 5 variáveis estão no Netlify

---

## 📝 Próximos Passos (Opcional)

- [ ] Adicionar Refresh Tokens (JWT de longa duração)
- [ ] Implementar rate limiting por usuário
- [ ] Adicionar Google reCAPTCHA v3
- [ ] Criar dashboard administrativo
- [ ] Adicionar testes unitários (Jest + React Testing Library)

---

**🚀 Pronto para produção com segurança enterprise-level!**
