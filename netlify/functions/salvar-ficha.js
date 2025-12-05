// Função Serverless do Netlify para salvar e consultar dados no MongoDB
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// 🔐 Funções JWT Simplificadas (sem dependências externas)
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(str, 'base64').toString('utf8');
}

function createHmacSignature(data, secret) {
  const base64 = crypto.createHmac('sha256', secret).update(data).digest('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    
    // Verifica assinatura
    const expectedSignature = createHmacSignature(`${headerB64}.${payloadB64}`, secret);
    
    if (signature !== expectedSignature) {
      console.warn('⚠️ JWT signature invalid');
      return null;
    }

    // Decodifica payload
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    
    // Verifica expiração
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('⚠️ JWT expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

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

  // 🔐 PROTEÇÃO JWT: Valida token em requisições POST
  if (event.httpMethod === 'POST') {
    const authHeader = event.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // ⚠️ MODO TEMPORÁRIO: Se JWT_SECRET não estiver configurado, permite sem autenticação
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.warn('⚠️ JWT_SECRET não configurado - permitindo acesso sem autenticação (TEMPORÁRIO)');
      // Continua sem validar JWT
    } else if (!token) {
      console.warn('⚠️ Requisição bloqueada - JWT ausente');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Token de autenticação necessário' 
        })
      };
    } else {
      // Valida JWT
      const payload = verifyJWT(token, jwtSecret);

      if (!payload) {
        console.warn('⚠️ Requisição bloqueada - JWT inválido ou expirado');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Token inválido ou expirado' 
          })
        };
      }

      // Verifica se o token é para este endpoint
      if (payload.aud !== 'ficha-semanal' || payload.action !== 'submit') {
        console.warn('⚠️ JWT com audience/action incorreto');
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Token não autorizado para esta ação' 
          })
        };
      }

      console.log('✅ JWT válido para usuário:', payload.sub);
    }
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

    // 🛡️ PROTEÇÃO: Validação rigorosa dos dados
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

    // 🛡️ PROTEÇÃO: Sanitização - Remove scripts e caracteres perigosos
    const sanitize = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/[<>]/g, '')
        .trim();
    };

    // Sanitiza os dados do colaborador
    if (data.colaborador) {
      data.colaborador.nome = sanitize(data.colaborador.nome);
      data.colaborador.cpf = sanitize(data.colaborador.cpf);
      data.colaborador.cargo = sanitize(data.colaborador.cargo);
    }

    // Sanitiza dificuldades
    if (data.dificuldades) {
      data.dificuldades = sanitize(data.dificuldades);
    }

    // Sanitiza tarefas
    if (Array.isArray(data.tarefas)) {
      data.tarefas = data.tarefas.map(tarefa => ({
        ...tarefa,
        descricao: sanitize(tarefa.descricao)
      }));
    }

    // 🛡️ PROTEÇÃO: Limita tamanho dos dados (previne ataques de payload gigante)
    const payloadSize = JSON.stringify(data).length;
    if (payloadSize > 100000) { // 100KB max
      console.warn('⚠️ Payload muito grande bloqueado:', payloadSize, 'bytes');
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Dados muito grandes' 
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
