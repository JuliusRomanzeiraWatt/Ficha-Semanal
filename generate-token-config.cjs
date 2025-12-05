// Script para gerar token-config.js durante o build do Netlify
const fs = require('fs');
const path = require('path');

// Tenta carregar do .env local (se existir)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/TOKEN_REQUEST_SECRET=(.+)/);
  if (match && !process.env.TOKEN_REQUEST_SECRET) {
    process.env.TOKEN_REQUEST_SECRET = match[1];
  }
}

const tokenSecret = process.env.TOKEN_REQUEST_SECRET;

if (!tokenSecret) {
  console.error('❌ TOKEN_REQUEST_SECRET não encontrado nas variáveis de ambiente!');
  process.exit(1);
}

const content = `// Configuração para requisição de tokens JWT
// Gerado automaticamente durante o build
window.TOKEN_CONFIG = {
  secret: '${tokenSecret}'
};
`;

const filePath = path.join(__dirname, 'token-config.js');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ token-config.js gerado com sucesso!');
