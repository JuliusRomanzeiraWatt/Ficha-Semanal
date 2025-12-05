// Módulo de autenticação para Netlify Functions
const crypto = require('crypto');

/**
 * Comparação timing-safe para prevenir timing attacks
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Verifica autenticação por API key
 * @param {Object} event - Evento do Netlify
 * @param {string} type - Tipo de autenticação: 'write' ou 'read'
 * @returns {Object} { authorized: boolean, error: string }
 */
function verificarAutenticacao(event, type = 'write') {
  // Em desenvolvimento, permite acesso sem autenticação
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ Modo desenvolvimento: Autenticação desabilitada');
    return { authorized: true };
  }

  const apiKey = event.headers['x-api-key'];
  
  if (!apiKey) {
    return {
      authorized: false,
      error: 'API key não fornecida. Inclua o header x-api-key na requisição.'
    };
  }

  let expectedKey;
  
  if (type === 'write') {
    expectedKey = process.env.API_SECRET_KEY;
  } else if (type === 'read') {
    expectedKey = process.env.POWERBI_API_KEY;
  }

  if (!expectedKey) {
    console.error(`❌ Variável de ambiente não configurada para tipo: ${type}`);
    return {
      authorized: false,
      error: 'Servidor não configurado corretamente. Entre em contato com o administrador.'
    };
  }

  if (!timingSafeEqual(apiKey, expectedKey)) {
    return {
      authorized: false,
      error: 'API key inválida.'
    };
  }

  return { authorized: true };
}

module.exports = {
  verificarAutenticacao,
  timingSafeEqual
};
