# 🔐 Autenticação das APIs - Netlify Functions

## ✅ O que foi implementado

Adicionamos **3 camadas de segurança** nas APIs do projeto:

### 1. **API Interna** (Formulário Web) - `/.netlify/functions/salvar-ficha`
- ✅ **SEM autenticação** - Usado pelo formulário HTML
- Mantém a funcionalidade existente
- Apenas POST aceito

### 2. **API Externa para Escrita** - `/.netlify/functions/api-fichas`
- 🔒 **Requer API_SECRET_KEY**
- Para integração de sistemas externos que precisam salvar fichas
- Apenas POST aceito
- Header obrigatório: `x-api-key: <API_SECRET_KEY>`

### 3. **API de Leitura Power BI** - `/.netlify/functions/api-powerbi`
- 🔒 **Requer POWERBI_API_KEY**
- Retorna dados formatados para Power BI
- Apenas GET aceito
- Header obrigatório: `x-api-key: <POWERBI_API_KEY>`

---

## 🔑 API Keys Geradas

⚠️ **IMPORTANTE**: As chaves reais estão no arquivo `.env` (que não é versionado no Git por segurança).

Exemplo de formato:
```
API_SECRET_KEY=<chave-de-64-caracteres-hexadecimais>
POWERBI_API_KEY=<chave-de-64-caracteres-hexadecimais>
```

> ⚠️ **NUNCA** commite as chaves reais no Git! Use apenas variáveis de ambiente.

---

## 📋 Como Configurar no Netlify

### Passo 1: Acesse as Variáveis de Ambiente

1. Acesse o [Netlify](https://app.netlify.com/)
2. Selecione seu site
3. Vá em: **Site configuration** → **Environment variables**

### Passo 2: Adicione as Novas Variáveis

Clique em **Add a variable** e adicione cada uma (use as chaves do arquivo `.env` local):

| Nome da Variável | Valor |
|------------------|-------|
| `API_SECRET_KEY` | Copie do arquivo `.env` |
| `POWERBI_API_KEY` | Copie do arquivo `.env` |
| `JWT_SECRET` | Copie do arquivo `.env` |

> ✅ As variáveis `MONGODB_URI` e `DB_NAME` já devem estar configuradas.

### Passo 3: Faça o Deploy

Após adicionar as variáveis:
- Faça `git push` das alterações
- O Netlify fará o deploy automaticamente
- As APIs protegidas estarão ativas!

---

## 🧪 Como Testar as APIs

### Testar API de Escrita (POST)

```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/api-fichas \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_API_SECRET_KEY_AQUI" \
  -d '{
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "semana": "2024-01-01",
    "tarefas": [{"descricao": "Tarefa teste"}]
  }'
```

### Testar API do Power BI (GET)

```bash
curl -X GET https://seu-site.netlify.app/.netlify/functions/api-powerbi \
  -H "x-api-key: SUA_POWERBI_API_KEY_AQUI"
```

### Testar API Interna (sem autenticação)

```bash
curl -X POST https://seu-site.netlify.app/.netlify/functions/salvar-ficha \
  -H "Content-Type: application/json" \
  -d '{"colaborador":{"nome":"Teste"},"periodo":{"inicio":"2024-01-01"},"tarefas":[]}'
```

---

## 🔒 Segurança Implementada

✅ **Timing-safe comparison** - Previne timing attacks  
✅ **Chaves de 256 bits** - Geradas com crypto.randomBytes  
✅ **Separação de privilégios** - Chaves diferentes para escrita e leitura  
✅ **CORS configurado** - Permite integrações externas  
✅ **Validação de método HTTP** - Apenas os métodos permitidos  

---

## 📖 Estrutura de Arquivos

```
netlify/functions/
├── auth.js              # Módulo de autenticação compartilhado
├── salvar-ficha.js      # API interna (SEM proteção) - formulário web
├── api-fichas.js        # API protegida para escrita (API_SECRET_KEY)
└── api-powerbi.js       # API protegida para leitura (POWERBI_API_KEY)
```

---

## 🆘 Solução de Problemas

### Erro 401 - Unauthorized

- Verifique se o header `x-api-key` está presente
- Confirme que a chave está correta (sem espaços extras)
- Verifique se a variável de ambiente está configurada no Netlify

### Erro 500 - Internal Server Error

- Confirme que `API_SECRET_KEY` e `POWERBI_API_KEY` estão configuradas no Netlify
- Verifique os logs do Netlify para mais detalhes

---

## 📝 Atualização do Power BI

O endpoint do Power BI mudou:

**Antes**: `/.netlify/functions/salvar-ficha?method=GET`  
**Agora**: `/.netlify/functions/api-powerbi`

Não esqueça de:
1. Atualizar a URL no Power BI
2. Adicionar o header: `x-api-key: SUA_POWERBI_API_KEY_AQUI`
