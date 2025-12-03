// Função Serverless do Netlify para salvar dados no MongoDB
const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Método não permitido' 
      })
    };
  }

  // Conexão com MongoDB
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || 'watt_consultoria';
  const COLLECTION_NAME = 'fichas_semanais';

  console.log('MONGODB_URI exists:', !!MONGODB_URI);
  console.log('DB_NAME:', DB_NAME);

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Configuração do MongoDB não encontrada',
        message: 'MONGODB_URI não configurada nas variáveis de ambiente do Netlify'
      })
    };
  }

  // Garante que o URI tenha os parâmetros necessários
  let mongoUri = MONGODB_URI.trim();
  
  // Remove barra final se houver
  if (mongoUri.endsWith('/') && !mongoUri.includes('?')) {
    mongoUri = mongoUri.slice(0, -1);
  }
  
  // Adiciona parâmetros se não estiverem presentes
  if (!mongoUri.includes('retryWrites')) {
    const separator = mongoUri.includes('?') ? '&' : '?';
    mongoUri += `${separator}retryWrites=true&w=majority&appName=Cluster0`;
  }

  console.log('Connecting to MongoDB...');

  let client;

  try {
    // Parse dos dados recebidos
    const data = JSON.parse(event.body);

    // Validação básica
    if (!data.colaborador || !data.periodo || !data.tarefas) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Dados incompletos' 
        })
      };
    }

    // Conecta ao MongoDB com configurações otimizadas para Netlify
    client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
      retryWrites: true,
      retryReads: true
    });
    
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connected successfully!');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Insere o documento
    const result = await collection.insertOne({
      ...data,
      criadoEm: new Date(),
      ip: event.headers['x-forwarded-for'] || event.headers['client-ip']
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: result.insertedId,
        message: 'Ficha semanal salva com sucesso!'
      })
    };

  } catch (error) {
    console.error('Erro ao salvar no MongoDB:', error);
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao conectar com o banco de dados';
    
    if (error.message?.includes('MongoServerSelectionError')) {
      errorMessage = 'Não foi possível conectar ao MongoDB. Verifique: 1) Se o IP está liberado no MongoDB Atlas (Network Access), 2) Se as credenciais estão corretas';
    } else if (error.message?.includes('Authentication failed')) {
      errorMessage = 'Erro de autenticação. Verifique usuário e senha do MongoDB';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        message: error.message,
        details: error.toString()
      })
    };

  } finally {
    // Fecha a conexão
    if (client) {
      await client.close();
    }
  }
};
