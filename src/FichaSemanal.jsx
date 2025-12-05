import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configuração do Axios
const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/.netlify/functions'
    : '/.netlify/functions',
  timeout: 30000
});

// Interceptor para adicionar JWT automaticamente
let jwtToken = null;

api.interceptors.request.use(async (config) => {
  // Se não tiver token ou estiver expirado, busca um novo
  if (!jwtToken && config.url.includes('salvar-ficha')) {
    try {
      const { data } = await axios.get(`${config.baseURL}/get-token`);
      if (data.success) {
        jwtToken = data.token;
        console.log('✅ JWT token obtido');
      }
    } catch (error) {
      console.error('Erro ao obter JWT:', error);
    }
  }

  // Adiciona token nas requisições POST
  if (jwtToken && config.method === 'post') {
    config.headers.Authorization = `Bearer ${jwtToken}`;
  }

  return config;
});

// Interceptor para tratar erros 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Renova o token
        const { data } = await axios.get(`${originalRequest.baseURL}/get-token`);
        if (data.success) {
          jwtToken = data.token;
          originalRequest.headers.Authorization = `Bearer ${jwtToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Validação de CPF
const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;

  return digito2 === parseInt(cpf.charAt(10));
};

const formatarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
};

const FichaSemanal = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cargo: '',
    dataInicio: '',
    dataFim: '',
    dificuldades: ''
  });

  const [tarefas, setTarefas] = useState([
    { id: 1, descricao: '', selecionada: false }
  ]);

  const [salvando, setSalvando] = useState(false);
  const [formularioConcluido, setFormularioConcluido] = useState(false);
  const [errors, setErrors] = useState([]);

  // Atualiza campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: formatarCPF(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Adiciona nova tarefa
  const adicionarTarefa = () => {
    const novoId = Math.max(...tarefas.map(t => t.id), 0) + 1;
    setTarefas([...tarefas, { id: novoId, descricao: '', selecionada: false }]);
  };

  // Remove tarefa
  const removerTarefa = (id) => {
    if (tarefas.length > 1) {
      setTarefas(tarefas.filter(t => t.id !== id));
    }
  };

  // Atualiza descrição da tarefa
  const atualizarTarefa = (id, descricao) => {
    setTarefas(tarefas.map(t => 
      t.id === id ? { ...t, descricao } : t
    ));
  };

  // Valida formulário
  const validarFormulario = () => {
    const newErrors = [];

    if (!formData.nome) newErrors.push('Nome é obrigatório');
    if (!formData.cargo) newErrors.push('Cargo é obrigatório');
    
    if (!formData.cpf) {
      newErrors.push('CPF é obrigatório');
    } else if (!validarCPF(formData.cpf)) {
      newErrors.push('CPF inválido');
    }

    if (!formData.dataInicio || !formData.dataFim) {
      newErrors.push('Datas de Início e Fim são obrigatórias');
    } else {
      const inicio = new Date(formData.dataInicio);
      const fim = new Date(formData.dataFim);
      const diffDays = Math.ceil(Math.abs(fim - inicio) / (1000 * 60 * 60 * 24));

      if (fim < inicio) {
        newErrors.push('Data final não pode ser anterior à data inicial');
      } else if (diffDays > 7) {
        newErrors.push('O período não pode ser superior a 7 dias');
      }
    }

    if (tarefas.every(t => !t.descricao.trim())) {
      newErrors.push('Adicione pelo menos uma tarefa');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Submete o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      alert('⚠️ Preencha todos os campos obrigatórios:\n\n' + errors.join('\n'));
      return;
    }

    setSalvando(true);

    const dados = {
      colaborador: {
        nome: formData.nome,
        cpf: formData.cpf,
        cargo: formData.cargo
      },
      periodo: {
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim
      },
      tarefas: tarefas
        .filter(t => t.descricao.trim())
        .map(t => ({
          id: t.id,
          descricao: t.descricao,
          selecionada: t.selecionada
        })),
      dificuldades: formData.dificuldades,
      dataGeracao: new Date().toISOString()
    };

    try {
      const response = await api.post('/salvar-ficha', dados);

      if (response.data.success) {
        setFormularioConcluido(true);
        alert(`✅ Formulário salvo com sucesso!\n\nID: ${response.data.id}\n\nAgora você pode imprimir o PDF.`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);

      let mensagem = 'Erro ao salvar o formulário';
      
      if (error.response?.status === 401) {
        mensagem = 'Token de autenticação expirado. Tente novamente.';
      } else if (error.response?.data?.error) {
        mensagem = error.response.data.error;
      } else if (error.message) {
        mensagem = error.message;
      }

      alert(`❌ ${mensagem}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <img src="favicon.svg" alt="Logo Watt" className="logo" />
        <h1>Ficha Semanal - Watt Consultoria</h1>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <section className="section">
          <h2>📋 Dados do Colaborador</h2>
          
          <div className="form-group">
            <label htmlFor="nome">Nome Completo *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cpf">CPF *</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                maxLength="14"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cargo">Cargo *</label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                placeholder="Seu cargo"
                required
              />
            </div>
          </div>
        </section>

        <section className="section">
          <h2>📅 Período</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataInicio">Data Início *</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataFim">Data Fim *</label>
              <input
                type="date"
                id="dataFim"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </section>

        <section className="section">
          <h2>✅ Tarefas</h2>
          
          {tarefas.map((tarefa, index) => (
            <div key={tarefa.id} className="tarefa-item">
              <span className="tarefa-numero">#{index + 1}</span>
              <input
                type="text"
                value={tarefa.descricao}
                onChange={(e) => atualizarTarefa(tarefa.id, e.target.value)}
                placeholder="Descrição da tarefa"
                className="tarefa-input"
              />
              {tarefas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerTarefa(tarefa.id)}
                  className="btn-remover"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={adicionarTarefa}
            className="btn-adicionar"
          >
            + Adicionar Tarefa
          </button>
        </section>

        <section className="section">
          <h2>💬 Dificuldades (Opcional)</h2>
          
          <div className="form-group">
            <textarea
              id="dificuldades"
              name="dificuldades"
              value={formData.dificuldades}
              onChange={handleInputChange}
              placeholder="Descreva as dificuldades encontradas durante o período..."
              rows="4"
            />
          </div>
        </section>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={salvando || formularioConcluido}
          >
            {salvando ? '⏳ Salvando...' : formularioConcluido ? '✅ Concluído' : '💾 Concluir Formulário'}
          </button>

          {formularioConcluido && (
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary"
            >
              🖨️ Imprimir PDF
            </button>
          )}
        </div>

        {errors.length > 0 && (
          <div className="errors">
            <h3>⚠️ Atenção:</h3>
            <ul>
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>

      <footer className="footer">
        <p>🔒 Conexão segura com autenticação JWT</p>
        <p>© 2025 Watt Consultoria - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default FichaSemanal;
