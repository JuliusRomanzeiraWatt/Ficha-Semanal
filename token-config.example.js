// Configuração para requisição de tokens JWT
// INSTRUÇÕES:
// 1. Copie este arquivo para 'token-config.js'
// 2. Substitua 'SUA_TOKEN_REQUEST_SECRET_AQUI' pelo valor de TOKEN_REQUEST_SECRET do .env
// 3. Este arquivo (token-config.js) NÃO deve ser comitado no git (está no .gitignore)

window.TOKEN_CONFIG = {
  secret: 'SUA_TOKEN_REQUEST_SECRET_AQUI'
};
