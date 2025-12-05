# Ficha Semanal - Next.js

Aplicação moderna de acompanhamento semanal com **frontend e backend completamente separados**.

## 🏗️ Arquitetura

```
ficha-semanal-nextjs/
├── app/
│   ├── api/
│   │   ├── fichas/route.ts      # POST - Salvar fichas
│   │   └── powerbi/route.ts     # GET - Dados para Power BI
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── FichaSemanalForm.tsx     # Componente principal do formulário
├── lib/
│   └── mongodb.ts               # Conexão MongoDB (apenas backend)
├── types/
│   └── index.ts                 # TypeScript types
├── utils/
│   └── validations.ts           # Validações (CPF, formatação)
└── .env.local                   # Credenciais (NÃO vai pro Git)
```

## 🔒 Segurança

### ✅ O que está protegido:
- **Credenciais do MongoDB**: Apenas no servidor (`.env.local`)
- **Conexão com banco**: Apenas nas API Routes (server-side)
- **Nenhum dado sensível** exposto no frontend
- **API protegida**: Endpoints externos requerem API Key
- **Autenticação em camadas**: 
  - Formulário web: endpoint interno sem API Key
  - API externa: requer `API_SECRET_KEY`
  - Power BI: requer `POWERBI_API_KEY` (read-only)

### 🔑 Autenticação da API

A API possui **3 endpoints** com diferentes níveis de segurança:

| Endpoint | Método | Autenticação | Uso |
|----------|--------|--------------|-----|
| `/api/submit` | POST | ❌ Não requer | Formulário web (interno) |
| `/api/fichas` | POST | ✅ API_SECRET_KEY | API externa (write) |
| `/api/powerbi` | GET | ✅ POWERBI_API_KEY | Power BI (read-only) |

**[📖 Ver documentação completa de autenticação](./AUTENTICACAO.md)**

### ❌ O que o frontend NÃO pode acessar:
- String de conexão do MongoDB
- Credenciais do banco de dados
- Código de conexão com o banco

## 📡 API Endpoints

### POST `/api/fichas`
Salva uma nova ficha semanal no MongoDB.

### GET `/api/powerbi`
Retorna dados em formato tabular para Power BI.

## 🚀 Instalação e Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local e adicione sua MONGODB_URI
```

**Exemplo de `.env.local`:**
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=watt_consultoria

# Gere chaves seguras:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_SECRET_KEY=sua-chave-secreta-64-caracteres
POWERBI_API_KEY=sua-chave-powerbi-64-caracteres
```

### 3. Executar em desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

### 4. Build para produção
```bash
npm run build
npm start
```

## 📊 Integração com Power BI

### URL do endpoint:
```
https://seu-site.vercel.app/api/powerbi
```

### No Power BI Desktop:
1. **Obter Dados** > **Web**
2. Cole a URL acima
3. Expanda o campo `dados`
4. Clique em **Carregar**

## 🌐 Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configurar variáveis de ambiente na Vercel:**
1. Acesse o dashboard do projeto
2. Vá em **Settings** > **Environment Variables**
3. Adicione `MONGODB_URI` e `DB_NAME`

## 🔐 Segurança - Checklist

- ✅ `.env.local` no `.gitignore`
- ✅ MongoDB apenas nas API Routes
- ✅ Validações no frontend E backend
- ✅ TypeScript para type safety
- ✅ Sem credenciais hardcoded

## 📦 Tecnologias

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **MongoDB** (via official driver)
- **React 18**

