// API Protegida para consultar dados do Power BI (requer POWERBI_API_KEY)
const { MongoClient } = require('mongodb');
const { verificarAutenticacao } = require('./auth');

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Apenas GET é permitido' 
      })
    };
  }

  // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO
  const auth = verificarAutenticacao(event, 'read');
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

    // Busca todos os dados
    const dados = await collection.find({}).sort({ criadoEm: -1 }).toArray();
    
    console.log(`Total de documentos encontrados: ${dados.length}`);
    
    // Transforma os dados em formato tabular (normalizado) para Power BI
    const dadosTabulares = [];
    
    dados.forEach(doc => {
      // Verifica se o documento tem a estrutura esperada
      if (!doc.tarefas || !Array.isArray(doc.tarefas)) {
        console.warn(`Documento ${doc._id} não possui campo tarefas válido`);
        return;
      }
      
      if (!doc.colaborador || !doc.periodo) {
        console.warn(`Documento ${doc._id} está com dados incompletos`);
        return;
      }
      
      // Para cada tarefa, cria uma linha na tabela
      doc.tarefas.forEach(tarefa => {
        try {
          dadosTabulares.push({
            ficha_id: doc._id.toString(),
            colaborador_nome: doc.colaborador?.nome || '',
            colaborador_cpf: doc.colaborador?.cpf || '',
            periodo_inicio: doc.periodo?.inicio || '',
            periodo_fim: doc.periodo?.fim || '',
            tarefa_numero: tarefa.numero || 0,
            tarefa_descricao: tarefa.descricao || '',
            tarefa_segunda: tarefa.dias?.segunda ? 1 : 0,
            tarefa_terca: tarefa.dias?.terca ? 1 : 0,
            tarefa_quarta: tarefa.dias?.quarta ? 1 : 0,
            tarefa_quinta: tarefa.dias?.quinta ? 1 : 0,
            tarefa_sexta: tarefa.dias?.sexta ? 1 : 0,
            tarefa_sabado: tarefa.dias?.sabado ? 1 : 0,
            tarefa_domingo: tarefa.dias?.domingo ? 1 : 0,
            data_criacao: doc.criadoEm || new Date(),
            ip_origem: doc.ip || null
          });
        } catch (tarefaError) {
          console.error(`Erro ao processar tarefa:`, tarefaError);
        }
      });
    });
    
    console.log(`Total de registros tabulares gerados: ${dadosTabulares.length}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_registros: dadosTabulares.length,
        total_fichas: dados.length,
        dados: dadosTabulares
      })
    };

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro ao buscar dados',
        message: error.message
      })
    };

  } finally {
    if (client) {
      await client.close();
    }
  }
};
