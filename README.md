<p align="center">
  <img src="docs/doomsday.png" alt="Doomsday Vote" width="120" />
</p>

# Doomsday Vote

Conferência **offline** de Boletins de Urna (BUs) do TSE para os cargos **Presidente** e **Governador**. 

O sistema reconstrói o dia pelo horário oficial de recebimento (`DT_BU_RECEBIDO`), permite consultar por corte temporal, analisa biometria, testa Benford, identifica padrões de duplicação/proximidade, calcula estatísticas descritivas por seção e exibe tudo em abas (`Painel`, `Mapa`, `Análise`).

> **Importante:** Não é totalização oficial, não é tempo real, não é um sistema de apuração. É uma ferramenta de conferência auditável com base nos BUs carregados.

## 1. Stack

| Camada | Tecnologias |
| :-- | :-- |
| **Backend** | Node.js 22 (ESM), Fastify 5, Kysely, PostgreSQL, Redis (opcional), Pino, Zod, pg-copy-streams |
| **Frontend** | Vue 3, Vite 8, Pinia, Vue Query (TanStack), MapLibre GL, TypeScript/JS vanilla |
| **Dados** | BUs do TSE (formatos BWEB 2014/2018/2022/2026), malhas IBGE locais em `frontend/public/geo/` |
| **Portas** | API: `http://localhost:7000` \| Frontend: `http://localhost:7010` |

## 2. Pré-requisitos

Antes de começar, garanta que tem instalado:

| Ferramenta | Versão mínima | Observação |
| :-- | :-- | :-- |
| [Node.js](https://nodejs.org/) | `22.x` | Obrigatório |
| [PostgreSQL](https://www.postgresql.org/) | `15.x` | Obrigatório |
| [Redis](https://redis.io/) | `7.x` | Opcional. O backend funciona com *fail-open* (se indisponível, ignora cache e segue normalmente) |
| [Git](https://git-scm.com/) | Qualquer recente | Para clonar o repositório |

## 3. Clonar o projeto

```bash
git clone https://github.com/SEU_USUARIO/doomsdayvote.git
cd doomsdayvote
```

## 4. Configurar variáveis de ambiente

### 4.1 Backend

Copie o exemplo e preencha com seus dados:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` com o seguinte conteúdo mínimo:

```env
# Banco principal
DATABASE_URL=postgres://usuario:senha@localhost:5432/doomsdayvote

# Banco para testes de integração
TEST_DATABASE_URL=postgres://usuario:senha@localhost:5432/doomsdayvote_test

# Redis (opcional)
REDIS_URL=redis://127.0.0.1:6379

# Porta da API
PORT=7000

# Pasta com arquivos BWEB (.csv, .txt, .csv.gz, .txt.gz)
BWEB_INPUT_DIR=/caminho/absoluto/para/pasta/com/bus
```

> **Dica:** Crie os bancos `doomsdayvote` e `doomsdayvote_test` no PostgreSQL antes de rodar as migrações.

### 4.2 Frontend

O frontend já aponta para `http://localhost:7000` por padrão. Caso precise alterar, crie `frontend/.env`:

```env
VITE_API_BASE=http://localhost:7000
```

## 5. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 6. Preparar banco de dados

```bash
cd backend
# Rodar migrações
npm run migrate
```

Caso precise resetar completamente o banco em ambiente local:

```bash
npm run migrate:reset
npm run migrate
```

## 7. Carregar dados (BUs, malhas e cores)

### 7.1 Adicionar arquivos BWEB

Coloque todos os arquivos de Boletins de Urna do TSE na pasta apontada por `BWEB_INPUT_DIR`. 

Formatos aceitos:

- `.csv`
- `.txt`
- `.csv.gz`
- `.txt.gz`

O importador faz cópia para `storage/` com hash, usa `COPY` + staging `UNLOGGED`, é idempotente e suporta arquivos fora de ordem.

### 7.2 Carregar BUs

```bash
cd backend
npm run carga
```

### 7.3 Carregar malhas geográficas (IBGE)

As malhas `br-uf.geojson` e `br-municipios.geojson` já vêm versionadas em `frontend/public/geo/`. Mesmo assim, é recomendado rodar para sincronizar `localidade.geom_id` e atualizar o manifesto:

```bash
cd backend
npm run geo:carregar
```

### 7.4 Carregar cores dos partidos

```bash
cd backend
npm run seed:cores
```

Se houver pendências:

```bash
npm run cores:pendentes
```

## 8. Rodar a aplicação

Abra **dois terminais** na raiz do projeto.

**Terminal 1 - API (Backend)**

```bash
cd backend
npm run dev
# ou em produção
# npm start
```

API disponível em: [http://localhost:7000](http://localhost:7000)

**Terminal 2 - Frontend**

```bash
cd frontend
npm run dev
```

Aplicação disponível em: [http://localhost:7010](http://localhost:7010)

## 9. Usando a aplicação

Após abrir o frontend:

1. Aguarde o carregamento das eleições disponíveis
2. Use a **barra de comando fixa** (Cargo / Ano / Turno / Corte temporal / UF) para definir o recorte
3. Navegue pelas abas:
   - **Painel**: KPIs, linha do tempo, placar, biometria do recorte
   - **Mapa**: mapa coroplético, painel por UF/município, "Detalhes" paginado e tabela de seções (carrega apenas ao selecionar um município)
   - **Análise**: Estatística descritiva (média/mediana/desvio populacional por seção), Benford, duplicação e proximidade, isolamento/LOF

Os filtros são compartilhados entre abas. Trocar de aba preserva o recorte e aproveita o cache.

## 10. Scripts úteis

### Backend

| Script | Descrição |
| :-- | :-- |
| `npm run dev` | API em modo desenvolvimento com watch |
| `npm start` | API em modo produção |
| `npm run migrate` | Aplica migrações pendentes |
| `npm run migrate:reset` | Reseta e reaplica migrações (apaga dados!) |
| `npm run carga` | Importa BUs da pasta `BWEB_INPUT_DIR` |
| `npm run geo:carregar` | Sincroniza malhas IBGE e correspondência TSE/IBGE |
| `npm run seed:cores` | Popula cores dos partidos |
| `npm run cores:pendentes` | Lista partidos sem cor definida |
| `npm test` | Testes unitários |
| `npm run test:integration` | Testes de integração (requer `TEST_DATABASE_URL`) |

### Frontend

| Script | Descrição |
| :-- | :-- |
| `npm run dev` | Servidor Vite em `http://localhost:7010` |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build gerado |
| `npm test` | Testes com Vitest |

## 11. Estrutura do projeto

```text
doomsdayvote/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── importacao/  # Parsers BWEB, validação, staging COPY, persistência
│   │   │   ├── apuracao/    # Corte temporal, somas, totais por área
│   │   │   └── analise/     # Biometria, Benford, duplicação, outliers, estatísticas
│   │   ├── routes/          # Rotas REST da API
│   │   ├── lib/             # Cache Redis, utils
│   │   └── scripts/         # carga, geo:carregar, seed:cores
│   └── tests/               # unitários e integração
├── frontend/
│   ├── src/
│   │   ├── components/      # UI reutilizável (mapa, tabelas, painéis)
│   │   ├── views/           # Páginas/abas (Painel, Mapa, Análise, Seção)
│   │   ├── composables/     # Queries Vue Query
│   │   ├── stores/          # Pinia (filtros)
│   │   └── lib/             # Formatação, agregações, cores
│   └── public/geo/          # Malhas IBGE (br-uf.geojson, br-municipios.geojson)
├── docs/                    # Documentação (API, formatos BWEB, arquitetura)
├── fixtures/                # Fixtures para testes
└── README.md
```

## 12. Troubleshooting

| Problema | Solução |
| :-- | :-- |
| **Erro de conexão com Postgres** | Verifique `DATABASE_URL`/`TEST_DATABASE_URL`, se o serviço está rodando e se os bancos foram criados. |
| **Redis não conecta** | Normal. O cache é *fail-open*. Se quiser usar cache, suba o Redis e aponte `REDIS_URL`. |
| **Arquivos BWEB não importam** | Confirme `BWEB_INPUT_DIR` com caminho absoluto, permissões de leitura e formatos suportados (`.csv/.txt/.gz`). |
| **Mapa sem geometrias** | Rode `npm run geo:carregar` no backend. Os arquivos já existem em `frontend/public/geo/`, mas o script sincroniza `localidade.geom_id`. |
| **Nomes de municípios errados/códigos** | Rode `npm run geo:carregar`. Ele usa `backend/data/geo/municipios-tse-ibge.csv` para casar TSE ↔ IBGE. |
| **Porta em uso (7000/7010)** | Altere `PORT` no backend ou use outra porta no Vite. |
| **Cache desatualizado após mudanças** | Em dev, rode `redis-cli FLUSHALL` ou aguarde o TTL (300s). Em produção, o `dv:versao` invalida automaticamente na carga. |

## 13. Testes

```bash
# Backend unitários
cd backend && npm test

# Backend integração (precisa de TEST_DATABASE_URL e Postgres limpo)
cd backend && npm run test:integration

# Frontend
cd frontend && npm test
```

## 14. Tuning do banco de dados

Ajustes feitos para que as consultas sobre milhões de versões de BU e dezenas de milhões de linhas de votos respondam em tempo interativo.

### 14.1 Servidor Postgres 16

O `postgresql.conf` fica fora do repositório. Estes são os valores em uso, todos diferentes do padrão:

| Parâmetro | Valor | Função |
| :-- | :-- | :-- |
| `shared_buffers` | 7.5 GB | Cache de páginas do próprio Postgres. |
| `effective_cache_size` | 22.5 GB | Diz ao planejador quanto cache (Postgres + SO) existe, o que favorece índices. |
| `work_mem` | 64 MB | Memória por operação de ordenação/hash antes de ir para disco. |
| `maintenance_work_mem` | 1 GB | Acelera `CREATE INDEX`, `REFRESH MATERIALIZED VIEW` e `VACUUM`. |
| `autovacuum_work_mem` | 256 MB | Memória do autovacuum após as cargas. |
| `max_parallel_workers_per_gather` | 4 | Paralelismo nas agregações grandes. |
| `max_parallel_maintenance_workers` | 4 | Paralelismo na criação de índices. |

O serviço é limitado por systemd em `ops/systemd/postgresql@16-main.service.d/override.conf` (`MemoryHigh=22G`, `MemoryMax=24G`). O teto de memória do banco vem desse limite, não do pool da aplicação.

### 14.2 Conexões da aplicação (`backend/src/db/index.js`)

| Ajuste | Valor | Configuração |
| :-- | :-- | :-- |
| Pool por processo | 20 conexões | `DB_POOL_MAX` (máx. 32) |
| `work_mem` por sessão | 64 MB | `DB_WORK_MEM_MB` (8–64) |
| `statement_timeout` da API | 180 s | fixo em `criarDb` |
| `statement_timeout` da carga | sem limite | o `COPY` de arquivos grandes passa do limite da API |
| Sessão da API | somente leitura | `default_transaction_read_only=on` |
| Fuso da sessão | UTC | `-c timezone=UTC` |

Os parâmetros de sessão vão em `options` da conexão porque o driver `pg` descarta `statement_timeout = 0`.

### 14.3 Índices

| Migration | Índice | Colunas | Uso |
| :-- | :-- | :-- | :-- |
| `0002` | `resultado_votavel_eleicao_idx` | `ano_eleicao, nr_turno` | Recorte de votos por pleito. |
| `0002` | `resultado_votavel_uf_cargo_idx` | `ano_eleicao, nr_turno, sg_uf, cd_cargo_pergunta` | Recorte por UF e cargo. |
| `0004` | `boletim_versao_eleicao_cargo_recebimento_idx` | `eleicao_id, cd_cargo_pergunta, precisao_dt_bu_recebido, dt_bu_recebido_ts` (parcial, `ativo`) | Corte temporal por horário de recebimento. |
| `0004` | `boletim_versao_eleicao_cargo_data_idx` | `eleicao_id, cd_cargo_pergunta, dt_bu_recebido_data` (parcial, `ativo`) | Corte temporal por data. |
| `0004` | `boletim_versao_secao_ativo_idx` | `secao_id, eleicao_id, cd_cargo_pergunta` (parcial, `ativo`) | Junção BU ↔ seção. |
| `0004` | `resultado_votavel_boletim_categoria_idx` | `boletim_versao_id, categoria, nr_votavel` | Junção BU ↔ votos e agregação por candidato. |
| `0004` | `secao_eleitoral_localidade_full_idx` | `sg_uf, cd_municipio_tse` | Filtro por UF e município. |

Os índices parciais em `ativo` deixam de fora as versões substituídas de BU, que nunca entram nas consultas.

### 14.4 Estatísticas estendidas

A migration `0009` cria `boletim_versao_filtro_stats` (`dependencies, ndistinct, mcv`) sobre `eleicao_id, cd_cargo_pergunta, ativo, cd_tipo_urna, lower(ds_cargo_pergunta)`. São as colunas filtradas juntas nas views e na API. As estatísticas estendidas dão ao planejador a dependência entre elas, o que melhora a estimativa de linhas desses filtros combinados.

### 14.5 Views materializadas

O corte final e sem recorte temporal (o caso mais comum) lê agregados prontos em vez de varrer as tabelas:

| View | Migration | Conteúdo | Índice |
| :-- | :-- | :-- | :-- |
| `mv_votos_final` | `0005`, `0006` | Votos por eleição, cargo e votável, já com a cor do partido e os votos antes/depois de 17:15. | `eleicao_id, cargo` |
| `mv_metricas_final` | `0005` | Aptos, comparecimento, abstenções e BUs considerados por eleição e cargo. | — |
| `mv_totais_area` | `0007` | Totais por município e candidato, usados no mapa. | `eleicao_id, cargo, sg_uf` |
| `mv_secao_candidato_final` | `0008`, `0010` | Agregado por seção e votável, usado pelas análises (estatísticas, concentração, comparação local, duplicação). | `eleicao_id, cargo, sg_uf, cd_municipio_tse` |

Cortes parciais (`as_of`, `as_of_date`) continuam lendo as tabelas.

As views são atualizadas no fim de `npm run carga`, com o papel dono (`DATABASE_MIGRATION_URL`), porque `REFRESH MATERIALIZED VIEW` exige o dono da view. A migration `0011` recria as views `mv_votos_final`, `mv_totais_area` e `mv_secao_candidato_final` lendo a sigla do partido como `coalesce(sg_partido, nm_partido)` (os dados de 2014 já importados mantêm `sg_partido` nulo). Se a carga for interrompida antes do fim, rode `npm run carga` de novo: os arquivos já importados são ignorados e as views são atualizadas.

### 14.6 Cache

Além do banco, as respostas da API ficam no Redis com TTL por rota. Metadados e avisos do corte ficam 24 h. A carga invalida o cache pela versão `dv:versao`.

## 15. Licença e observações

- **Uso:** Projeto voltado à conferência e auditoria offline de BUs. 
- **Dados:** Os arquivos BWEB são públicos do TSE, mas não são versionados neste repositório. Você deve obtê-los por conta própria.
- **Não oficial:** Este projeto **não** é oficial do TSE e **não** substitui a totalização oficial.
- **Privacidade:** Tudo roda localmente. Nenhum dado é enviado para terceiros.