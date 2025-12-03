# ⚠️ ERRO: Configuração do MongoDB não encontrada

## 🔧 Solução Rápida

Você precisa configurar as variáveis de ambiente no Netlify. Siga estes passos:

### 📍 Passo 1: Acesse o Painel do Netlify

1. Acesse: https://app.netlify.com
2. Clique no seu site **"fichasemanalwatt"**

### 📍 Passo 2: Configure as Variáveis

1. No menu lateral, clique em **"Site configuration"**
2. Clique em **"Environment variables"**
3. Clique no botão **"Add a variable"**

### 📍 Passo 3: Adicione as Variáveis

**Variável 1:**
- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://juliusromanzeira_db_user:Tarcizinho1@cluster0.yifjtek.mongodb.net/`
- Clique em **"Create variable"**

**Variável 2:**
- **Key:** `DB_NAME`
- **Value:** `watt_consultoria`
- Clique em **"Create variable"**

### 📍 Passo 4: Redesploy

1. Vá em **"Deploys"** no menu lateral
2. Clique no botão **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Aguarde o deploy finalizar (1-2 minutos)

### 📍 Passo 5: Teste

1. Acesse seu site novamente
2. Preencha o formulário
3. Clique em **"Concluir Formulário"**
4. Deve funcionar agora! ✅

---

## 🎯 Screenshot das Configurações

As variáveis devem ficar assim no Netlify:

```
MONGODB_URI = mongodb+srv://juliusromanzeira_db_user:Tarcizinho1@cluster0.yifjtek.mongodb.net/
DB_NAME = watt_consultoria
```

---

## ❓ Ainda com problemas?

Se ainda não funcionar, verifique:

1. ✅ As variáveis foram salvas corretamente
2. ✅ Você fez um novo deploy após adicionar as variáveis
3. ✅ O link do MongoDB está correto
4. ✅ A senha do MongoDB está correta

---

## 📞 Suporte

Se precisar de ajuda, me chame!
