# Integração com Power BI via ODBC

## Visão Geral

A API agora retorna dados em formato tabular normalizado, pronto para consumo no Power BI através do driver ODBC ou Web Connector.

## 🔒 Endpoints de Dados

### ✅ Endpoint Protegido (RECOMENDADO)

**URL:** `https://seu-site.netlify.app/.netlify/functions/api-powerbi`  
**Método:** `GET`  
**Autenticação:** Header `x-api-key` obrigatório

```http
x-api-key: SUA_POWERBI_API_KEY_AQUI
```

### ⚠️ Endpoint Legado (Sem Proteção)

**URL:** `https://seu-site.netlify.app/.netlify/functions/salvar-ficha`  
**Método:** `GET`  
**Autenticação:** Não requer

> **Recomendação**: Use o endpoint `/api-powerbi` com autenticação para maior segurança.

## Estrutura da Tabela Retornada

Cada linha representa uma tarefa individual de uma ficha semanal:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ficha_id` | String | ID único da ficha semanal |
| `colaborador_nome` | String | Nome do colaborador |
| `colaborador_cpf` | String | CPF do colaborador |
| `periodo_inicio` | Date | Data de início do período |
| `periodo_fim` | Date | Data de fim do período |
| `tarefa_numero` | Number | Número da tarefa |
| `tarefa_descricao` | String | Descrição da tarefa |
| `tarefa_segunda` | Number | 1 se executada na segunda, 0 caso contrário |
| `tarefa_terca` | Number | 1 se executada na terça, 0 caso contrário |
| `tarefa_quarta` | Number | 1 se executada na quarta, 0 caso contrário |
| `tarefa_quinta` | Number | 1 se executada na quinta, 0 caso contrário |
| `tarefa_sexta` | Number | 1 se executada na sexta, 0 caso contrário |
| `tarefa_sabado` | Number | 1 se executada no sábado, 0 caso contrário |
| `tarefa_domingo` | Number | 1 se executada no domingo, 0 caso contrário |
| `data_criacao` | DateTime | Data e hora de criação da ficha |
| `ip_origem` | String | IP de origem do envio (pode ser null) |

## Formato de Resposta JSON

```json
{
  "success": true,
  "total_registros": 150,
  "dados": [
    {
      "ficha_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "colaborador_nome": "João Silva",
      "colaborador_cpf": "123.456.789-00",
      "periodo_inicio": "2024-01-01",
      "periodo_fim": "2024-01-07",
      "tarefa_numero": 1,
      "tarefa_descricao": "Desenvolvimento de funcionalidade X",
      "tarefa_segunda": 1,
      "tarefa_terca": 1,
      "tarefa_quarta": 0,
      "tarefa_quinta": 1,
      "tarefa_sexta": 1,
      "tarefa_sabado": 0,
      "tarefa_domingo": 0,
      "data_criacao": "2024-01-07T15:30:00.000Z",
      "ip_origem": "192.168.1.1"
    }
  ]
}
```

## Como Conectar no Power BI

### Opção 1: Web Connector (Recomendado)

1. Abra o Power BI Desktop
2. Clique em **Obter Dados** > **Web**
3. Cole a URL: `https://seu-site.netlify.app/.netlify/functions/salvar-ficha`
4. Clique em **OK**
5. Na janela de navegação, expanda o campo `dados`
6. Clique em **Para Tabela** e depois em **Carregar**

### Opção 2: Script Power Query (M)

```m
let
    Origem = Json.Document(Web.Contents("https://seu-site.netlify.app/.netlify/functions/salvar-ficha")),
    dados = Origem[dados],
    ConvertidoParaTabela = Table.FromList(dados, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    ExpandidoColunas = Table.ExpandRecordColumn(ConvertidoParaTabela, "Column1", 
        {"ficha_id", "colaborador_nome", "colaborador_cpf", "periodo_inicio", "periodo_fim", 
         "tarefa_numero", "tarefa_descricao", "tarefa_segunda", "tarefa_terca", "tarefa_quarta", 
         "tarefa_quinta", "tarefa_sexta", "tarefa_sabado", "tarefa_domingo", "data_criacao", "ip_origem"}
    )
in
    ExpandidoColunas
```

### Opção 3: ODBC Generic (Avançado)

Para usar ODBC, você precisará de um driver ODBC REST/API. Alguns drivers populares:

- **CData ODBC Driver for REST**
- **Simba REST ODBC Driver**

Configuração:
1. Instale o driver ODBC
2. Configure o DSN apontando para a URL do endpoint
3. No Power BI, vá em **Obter Dados** > **ODBC**
4. Selecione o DSN configurado

## Transformações Recomendadas no Power BI

### Converter Tipos de Dados

```m
// No Power Query Editor
#"Tipos Alterados" = Table.TransformColumnTypes(DadosOriginais, {
    {"ficha_id", type text},
    {"colaborador_nome", type text},
    {"colaborador_cpf", type text},
    {"periodo_inicio", type date},
    {"periodo_fim", type date},
    {"tarefa_numero", Int64.Type},
    {"tarefa_descricao", type text},
    {"tarefa_segunda", Int64.Type},
    {"tarefa_terca", Int64.Type},
    {"tarefa_quarta", Int64.Type},
    {"tarefa_quinta", Int64.Type},
    {"tarefa_sexta", Int64.Type},
    {"tarefa_sabado", Int64.Type},
    {"tarefa_domingo", Int64.Type},
    {"data_criacao", type datetime},
    {"ip_origem", type text}
})
```

### Criar Coluna de Total de Dias Trabalhados

```m
#"Dias Trabalhados" = Table.AddColumn(#"Tipos Alterados", "total_dias", 
    each [tarefa_segunda] + [tarefa_terca] + [tarefa_quarta] + 
         [tarefa_quinta] + [tarefa_sexta] + [tarefa_sabado] + [tarefa_domingo]
)
```

### Unpivot dos Dias da Semana (Para Análises Temporais)

```m
#"Colunas Dinâmicas Removidas" = Table.UnpivotOtherColumns(
    DadosOriginais, 
    {"ficha_id", "colaborador_nome", "colaborador_cpf", "periodo_inicio", "periodo_fim", 
     "tarefa_numero", "tarefa_descricao", "data_criacao", "ip_origem"}, 
    "dia_semana", 
    "executado"
)
```

## Exemplos de DAX

### Medida: Total de Tarefas Executadas

```dax
Total Tarefas = 
COUNTROWS(
    FILTER(
        Fichas,
        Fichas[tarefa_segunda] = 1 || 
        Fichas[tarefa_terca] = 1 || 
        Fichas[tarefa_quarta] = 1 || 
        Fichas[tarefa_quinta] = 1 || 
        Fichas[tarefa_sexta] = 1 || 
        Fichas[tarefa_sabado] = 1 || 
        Fichas[tarefa_domingo] = 1
    )
)
```

### Medida: Média de Dias por Tarefa

```dax
Media Dias Por Tarefa = 
AVERAGE(
    ADDCOLUMNS(
        Fichas,
        "TotalDias",
        [tarefa_segunda] + [tarefa_terca] + [tarefa_quarta] + 
        [tarefa_quinta] + [tarefa_sexta] + [tarefa_sabado] + [tarefa_domingo]
    )
)
```

### Medida: Taxa de Execução por Dia da Semana

```dax
Taxa Segunda = 
DIVIDE(
    SUM(Fichas[tarefa_segunda]),
    COUNTROWS(Fichas),
    0
)
```

## Atualização de Dados

### Atualização Manual
No Power BI Desktop: **Página Inicial** > **Atualizar**

### Atualização Automática (Power BI Service)
1. Publique o relatório no Power BI Service
2. Vá para as configurações do conjunto de dados
3. Configure a **Atualização agendada**
4. Defina frequência (recomendado: 1x ao dia)

## Troubleshooting

### Erro de CORS
- Certifique-se de que o endpoint permite requisições GET
- Verifique os headers CORS no código da função

### Dados não aparecem
- Verifique se há dados no MongoDB
- Teste a URL diretamente no navegador
- Verifique os logs do Netlify

### Performance lenta
- Considere adicionar filtros de data na query
- Implemente paginação se o volume de dados crescer muito
- Use cache no Power BI

## Próximos Passos

Para melhorar a performance com grandes volumes:

1. **Adicionar filtros de data na URL:**
   ```
   /.netlify/functions/salvar-ficha?dataInicio=2024-01-01&dataFim=2024-12-31
   ```

2. **Implementar paginação:**
   ```
   /.netlify/functions/salvar-ficha?page=1&limit=100
   ```

3. **Criar índices no MongoDB** nas colunas mais consultadas

4. **Implementar cache** com tempo de expiração configurável
