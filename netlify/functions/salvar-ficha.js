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
        message: 'Por favor, configure a variável MONGODB_URI no Netlify.\n\n1. Vá em Site settings > Environment variables\n2. Adicione MONGODB_URI com seu link do MongoDB Atlas'
      })
    };
  }

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

    // Conecta ao MongoDB (removendo opções depreciadas)
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    
    await client.connect();

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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao salvar dados',
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
