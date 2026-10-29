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

## 14. Licença e observações

- **Uso:** Projeto voltado à conferência e auditoria offline de BUs. 
- **Dados:** Os arquivos BWEB são públicos do TSE, mas não são versionados neste repositório. Você deve obtê-los por conta própria.
- **Não oficial:** Este projeto **não** é oficial do TSE e **não** substitui a totalização oficial.
- **Privacidade:** Tudo roda localmente. Nenhum dado é enviado para terceiros.