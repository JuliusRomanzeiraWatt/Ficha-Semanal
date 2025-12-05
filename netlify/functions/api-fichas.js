// API Protegida para salvar fichas semanais (requer API_SECRET_KEY)
const { MongoClient } = require('mongodb');
const { verificarAutenticacao } = require('./auth');

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Aceita OPTIONS para CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Valida método HTTP
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Apenas POST é permitido' 
      })
    };
  }

  // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO
  const auth = verificarAutenticacao(event, 'write');
  if (!auth.authorized) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: auth.error
      })
    };
  }

  // Conexão com MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || 'watt_consultoria';
  const COLLECTION_NAME = 'fichas_semanais';

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Configuração do MongoDB não encontrada'
      })
    };
  }

  let mongoUri = MONGODB_URI.trim();
  if (mongoUri.endsWith('/') && !mongoUri.includes('?')) {
    mongoUri = mongoUri.slice(0, -1);
  }
  if (!mongoUri.includes('retryWrites')) {
    const separator = mongoUri.includes('?') ? '&' : '?';
    mongoUri += `${separator}retryWrites=true&w=majority&appName=Cluster0`;
  }

  let client;

  try {
    // Parse dos dados
    const dados = JSON.parse(event.body);

    // Validações básicas
    if (!dados.nome || !dados.cpf || !dados.semana || !dados.tarefas) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Dados incompletos. Campos obrigatórios: nome, cpf, semana, tarefas'
        })
      };
    }

    // Conecta ao MongoDB
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
      retryWrites: true,
      retryReads: true
    });
    
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Prepara documento
    const documento = {
      ...dados,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    // Insere no banco
    const resultado = await collection.insertOne(documento);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Ficha salva com sucesso',
        id: resultado.insertedId
      })
    };

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao salvar ficha',
        message: error.message
      })
    };

  } finally {
    if (client) {
      await client.close();
    }
  }
};
