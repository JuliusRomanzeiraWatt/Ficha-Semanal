// Endpoint para gerar token JWT para o formulário
const crypto = require('crypto');

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  
  const signatureBase64 = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64');
  
  // Converte base64 para base64url
  const signature = signatureBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signature}`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Apenas GET permitido' })
    };
  }

  // 🔒 PROTEÇÃO: Verifica origem da requisição
  const referer = event.headers['referer'] || event.headers['origin'] || '';
  const allowedDomains = [
    'fichasemanalwatt.netlify.app',
    'localhost',
    '127.0.0.1'
  ];
  
  const isValidOrigin = allowedDomains.some(domain => referer.includes(domain));
  
  if (!isValidOrigin) {
    console.warn('⚠️ Requisição de token bloqueada - origem inválida:', referer);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Acesso negado. Este endpoint só pode ser acessado através do formulário oficial.' 
      })
    };
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    
    // Gera um ID único para esta sessão
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Token válido por 1 hora
    const payload = {
      sub: sessionId,                    // Subject (ID da sessão)
      aud: 'ficha-semanal',              // Audience (aplicação)
      action: 'submit',                  // Ação permitida
      iat: Math.floor(Date.now() / 1000), // Issued at
      exp: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
      jti: crypto.randomBytes(8).toString('hex') // JWT ID único
    };

    const token = createJWT(payload, jwtSecret);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token,
        expiresIn: 3600
      })
    };

  } catch (error) {
    console.error('Erro ao gerar JWT:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao gerar token'
      })
    };
  }
};
