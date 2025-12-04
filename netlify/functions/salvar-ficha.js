// Função Serverless do Netlify para salvar e consultar dados no MongoDB
const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
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

    // Endpoint GET: Retorna dados em formato tabular para Power BI
    if (event.httpMethod === 'GET') {
      try {
        const dados = await collection.find({}).sort({ criadoEm: -1 }).toArray();
        
        console.log(`Total de documentos encontrados: ${dados.length}`);
        
        // Transforma os dados em formato tabular (normalizado)
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
      } catch (getError) {
        console.error('Erro ao buscar dados:', getError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Erro ao buscar dados',
            message: getError.message,
            details: getError.toString()
          })
        };
      }
    }

    // Endpoint POST: Salva nova ficha (código existente)
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
