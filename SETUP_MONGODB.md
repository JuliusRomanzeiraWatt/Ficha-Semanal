# 🚀 Guia de Configuração - MongoDB + Netlify

## 📋 Passo a Passo Completo

### 1️⃣ **Criar Conta no MongoDB Atlas (Gratuito)**

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita
3. Crie um novo cluster (escolha a opção FREE - M0)
4. Aguarde a criação do cluster (2-5 minutos)

### 2️⃣ **Configurar Acesso ao MongoDB**

1. No painel do MongoDB Atlas, clique em **"Database Access"**
2. Clique em **"Add New Database User"**
3. Escolha autenticação por senha
4. Crie um usuário (ex: `watt_user`) e uma senha forte
5. Em **"Database User Privileges"**, selecione **"Read and write to any database"**
6. Clique em **"Add User"**

### 3️⃣ **Liberar Acesso de IP**

1. No painel do MongoDB Atlas, clique em **"Network Access"**
2. Clique em **"Add IP Address"**
3. Clique em **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Necessário porque o Netlify usa IPs dinâmicos
4. Clique em **"Confirm"**

### 4️⃣ **Obter String de Conexão**

1. Volte para **"Database"**
2. Clique em **"Connect"** no seu cluster
3. Escolha **"Connect your application"**
4. Copie a string de conexão (algo como):
   ```
   mongodb+srv://watt_user:<password>@cluster0.xxxxx.mongodb.net/
   ```
5. **Substitua** `<password>` pela senha real do usuário

### 5️⃣ **Configurar Variáveis no Netlify**

1. No painel do Netlify, acesse seu site
2. Vá em **"Site settings"** → **"Environment variables"**
3. Clique em **"Add a variable"**
4. Adicione:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://watt_user:SUA_SENHA@cluster0.xxxxx.mongodb.net/`
5. Adicione outra variável:
   - **Key:** `DB_NAME`
   - **Value:** `watt_consultoria`
6. Clique em **"Save"**

### 6️⃣ **Fazer Deploy no Netlify**

#### Opção A: Deploy via Git (Recomendado)

1. Faça commit de todos os arquivos:
   ```bash
   git add .
   git commit -m "Adiciona integração com MongoDB"
   git push
   ```
2. O Netlify fará o deploy automaticamente

#### Opção B: Deploy Manual

1. No painel do Netlify, vá em **"Deploys"**
2. Arraste a pasta do projeto para a área de upload
3. Aguarde o deploy

### 7️⃣ **Testar a Integração**

1. Acesse seu site no Netlify
2. Preencha o formulário completamente
3. Clique em **"Salvar no BD"**
4. Deve aparecer: ✅ Ficha semanal salva com sucesso!

### 8️⃣ **Verificar Dados no MongoDB**

1. No MongoDB Atlas, vá em **"Database"** → **"Browse Collections"**
2. Selecione o database `watt_consultoria`
3. Veja a collection `fichas_semanais`
4. Os dados salvos aparecerão lá!

---

## 🎯 Estrutura dos Arquivos

```
Ficha-Semanal/
├── index.html                          # Frontend
├── favicon.svg                         # Ícone
├── package.json                        # Dependências
├── netlify.toml                        # Config Netlify
├── .env.example                        # Exemplo de variáveis
└── netlify/
    └── functions/
        └── salvar-ficha.js            # API Serverless
```

---

## 🔍 Estrutura do Documento no MongoDB

```json
{
  "_id": "ObjectId('...')",
  "colaborador": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "cargo": "Consultor"
  },
  "periodo": {
    "dataInicio": "2025-12-01",
    "dataFim": "2025-12-07"
  },
  "tarefas": [
    {
      "id": 1,
      "descricao": "Desenvolver novo módulo",
      "selecionada": true
    },
    ...
  ],
  "dificuldades": "Prazo apertado...",
  "dataGeracao": "2025-12-03T14:30:00.000Z",
  "criadoEm": "2025-12-03T14:30:05.123Z",
  "ip": "192.168.1.1"
}
```

---

## ❓ Troubleshooting

### Erro: "Configuração do MongoDB não encontrada"
✅ Verifique se a variável `MONGODB_URI` está configurada no Netlify

### Erro: "Authentication failed"
✅ Verifique se a senha na string de conexão está correta
✅ Confirme que o usuário tem permissão de escrita

### Erro: "Connection timeout"
✅ Verifique se o IP 0.0.0.0/0 está liberado no Network Access

### Botão não faz nada
✅ Abra o Console do navegador (F12) para ver erros
✅ Verifique se fez o deploy após adicionar as variáveis

---

## 📊 Consultar Dados (Opcional)

Para criar um painel de visualização dos dados, você pode:

1. Usar o **MongoDB Charts** (built-in)
2. Criar outra Netlify Function para listar dados
3. Usar **MongoDB Compass** (aplicativo desktop)

---

## 💰 Custos

- **MongoDB Atlas (M0):** Gratuito (512MB)
- **Netlify Functions:** Gratuito até 125k requisições/mês
- **Netlify Hosting:** Gratuito para sites simples

✅ **Totalmente gratuito para uso da Watt Consultoria!**
