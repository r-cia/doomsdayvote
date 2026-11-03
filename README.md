<p align="center">
  <img src="docs/doomsday.png" alt="Doomsday Vote" width="120" />
</p>

# Doomsday Vote

Conferência **offline** de Boletins de Urna do Tribunal Superior Eleitoral para os cargos **Presidente** e **Governador**.

O sistema reconstrói o dia pelo horário de recebimento do Boletim de Urna, permite consultar por corte temporal, analisa biometria, aplica Benford, identifica padrões de duplicação e proximidade, calcula estatísticas por seção, confere a apuração contra os pacotes de totalização (Boletim de Urna, Registro Digital do Voto e log da urna) e exibe tudo em abas.

> **Importante:** não é totalização oficial, não é tempo real e não substitui a apuração do Tribunal Superior Eleitoral. É uma ferramenta de conferência com base nos arquivos carregados.

A documentação de regras de negócio, API e arquitetura fica nos documentos do Jiraya (`docs/blueprint.md`, `docs/API.md` e `docs/architecture.md`). Este arquivo cobre apenas como rodar o projeto.

## 1. Stack

| Camada | Tecnologias |
| :-- | :-- |
| Backend | Node.js 22 (ESM), Fastify 5, Kysely, PostgreSQL, Redis (opcional), Pino, Zod, pg-copy-streams |
| Frontend | Vue 3, Vite, Pinia, TanStack Query (Vue), Chart.js, MapLibre GL |
| Dados | Arquivos de Boletim de Urna na web (leiautes 2014, 2018, 2022 e 2026), pacotes de totalização por unidade da federação e malhas do IBGE em `frontend/public/geo/` |
| Portas | API em `http://localhost:7000`; frontend em `http://localhost:7010` |

## 2. Pré-requisitos

| Ferramenta | Versão mínima | Observação |
| :-- | :-- | :-- |
| [Node.js](https://nodejs.org/) | 22.x | Obrigatório |
| [PostgreSQL](https://www.postgresql.org/) | 15.x | Obrigatório |
| [Redis](https://redis.io/) | 7.x | Opcional. Se estiver indisponível, o backend ignora o cache e segue |
| `7z` (p7zip) | Qualquer recente | Necessário para ler arquivos `.7z` |
| [Git](https://git-scm.com/) | Qualquer recente | Para clonar o repositório |

## 3. Configurar variáveis de ambiente

Copie o exemplo e ajuste os valores:

```bash
cp backend/.env.example backend/.env
```

Variáveis principais (todas documentadas em `backend/.env.example`):

| Variável | Uso |
| :-- | :-- |
| `DATABASE_URL` | Banco usado pela API e pelas cargas (papel de aplicação) |
| `DATABASE_MIGRATION_URL` | Migrações e atualização das views materializadas (papel dono do banco) |
| `REDIS_URL` | Cache (opcional) |
| `PORT` | Porta da API (padrão 7000) |
| `BWEB_INPUT_DIR` | Pasta com os arquivos de Boletim de Urna na web |
| `TEST_DATABASE_URL` e `TEST_DATABASE_MIGRATION_URL` | Banco dos testes de integração |

O frontend aponta para `http://localhost:7000`. Para alterar, crie `frontend/.env` com `VITE_API_BASE`.

## 4. Instalar dependências

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 5. Preparar o banco

```bash
cd backend
npm run migrate
```

Há uma única migração, `0001_schema_inicial`, que cria todas as tabelas. Para reaplicar do zero em ambiente local (apaga os dados):

```bash
npm run migrate:reset
npm run migrate
```

## 6. Carregar dados

### 6.1 Boletins de Urna na web

Coloque os arquivos na pasta apontada por `BWEB_INPUT_DIR`. Formatos aceitos: `.csv`, `.txt`, `.csv.gz`, `.txt.gz`, `.csv.7z` e `.txt.7z`.

O importador lê direto da pasta, sem copiar o arquivo, usa `COPY` em tabela de passagem, é idempotente pelo hash do arquivo e aceita arquivos fora de ordem. Só importa Presidente e Governador.

```bash
cd backend
npm run carga
```

Ao terminar, a carga atualiza as views materializadas e invalida o cache. Só uma carga roda por vez.

### 6.2 Pacotes de totalização

Pacotes `.zip` ou `.7z` por unidade da federação, nomeados `bu_imgbu_logjez_rdv_vscmr_<ano>_<turno>t_<UF>`.

```bash
cd backend
npm run totalizacao:carregar -- --pasta <diretório> [--arquivo <nome.zip|nome.7z>] [--falhar-rapido]
```

- Processa só `-bu.dat`, `-rdv.dat` e `-log.jez` de cada seção.
- Cada seção é uma transação; erro em uma seção não derruba o arquivo e deixa o lote `parcial`.
- Lote repetido é ignorado pelo hash; lote incompleto é retomado pulando as seções já gravadas.
- Um lote novo substitui o anterior da mesma unidade, ano e turno.

Para consultar o estado das cargas:

```bash
npm run carga:status -- [--lote <id>] [--json]
```

### 6.3 Malhas geográficas

```bash
cd backend
npm run geo:carregar
```

### 6.4 Cores dos partidos

```bash
cd backend
npm run seed:cores
npm run cores:pendentes
```

## 7. Rodar a aplicação

Em dois terminais, a partir da raiz do projeto:

```bash
# Terminal 1 — API
cd backend
npm run dev     # ou npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

A API sobe em `http://localhost:7000` e recusa iniciar se houver migração pendente. O frontend sobe em `http://localhost:7010`.

## 8. Usando a aplicação

Use a barra de filtros (cargo, ano, turno, corte temporal e unidade da federação) para definir o recorte. Os filtros são compartilhados entre as abas.

| Aba | Conteúdo |
| :-- | :-- |
| Painel | Indicadores, linha do tempo do dia, placar e votos por estado |
| Mapa | Mapa por unidade da federação e município, painel de detalhes e tabela de seções |
| Estatística | Estatísticas descritivas, Benford, duplicação e proximidade, outliers |
| Biometria | Biometria por unidade da federação, município e seção |
| Encerramento | Urnas por faixa de horário de encerramento |

O backend também expõe a totalização, a consistência aritmética, a concentração, a comparação local, o relatório, a comparação entre anos e as versões do Boletim de Urna; essas telas ainda não existem no frontend.

## 9. Scripts

### Backend

| Script | Descrição |
| :-- | :-- |
| `npm run dev` | API em desenvolvimento, com reinício automático |
| `npm start` | API em produção |
| `npm run migrate` | Aplica as migrações pendentes |
| `npm run migrate:reset` | Reaplica as migrações do zero (apaga os dados) |
| `npm run carga` | Importa os Boletins de Urna da pasta `BWEB_INPUT_DIR` |
| `npm run totalizacao:carregar` | Importa pacotes de totalização |
| `npm run carga:status` | Mostra o estado dos lotes |
| `npm run geo:carregar` | Sincroniza as malhas do IBGE |
| `npm run seed:cores` | Cadastra as cores dos partidos |
| `npm run cores:pendentes` | Lista partidos sem cor |
| `npm test` | Testes unitários |
| `npm run test:coverage` | Testes unitários com cobertura |
| `npm run test:integration` | Testes de integração (exigem `TEST_DATABASE_URL`) |

### Frontend

| Script | Descrição |
| :-- | :-- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Visualiza o build |
| `npm test` | Testes |

## 10. Estrutura

```text
doomsdayvote/
├── backend/
│   ├── data/                 # cadastro de municípios e cores de partidos
│   ├── src/
│   │   ├── db/               # conexão, migrações e views materializadas
│   │   ├── lib/              # cache, ordenação, erros, datas, logs de carga
│   │   ├── migrations/       # 0001_schema_inicial
│   │   ├── modules/
│   │   │   ├── apuracao/         # corte temporal, seções, linha do tempo, totais
│   │   │   ├── analise/          # Benford, biometria, duplicação, outliers e demais análises
│   │   │   ├── comparacao-anos/  # curvas e estatística da comparação entre anos
│   │   │   ├── importacao/       # leiautes, validações, lotes e persistência
│   │   │   └── totalizacao/      # Boletim, Registro Digital do Voto, log, conferências, agregação
│   │   ├── routes/           # rotas HTTP por domínio
│   │   └── scripts/          # cargas, migrações e utilitários de linha de comando
│   └── tests/                # unitários e de integração
├── frontend/
│   ├── public/geo/           # malhas do IBGE
│   └── src/                  # views, components, composables, stores e lib
├── docs/                     # imagem do projeto
└── README.md
```

## 11. Testes

```bash
# Backend, unitários
cd backend && npm test

# Backend, integração (exige Postgres e TEST_DATABASE_URL)
cd backend && npm run test:integration

# Frontend
cd frontend && npm test
```

## 12. Problemas comuns

| Problema | Solução |
| :-- | :-- |
| Erro de conexão com o Postgres | Confira `DATABASE_URL`, o serviço e a existência dos bancos |
| API não sobe e registra `MIGRACOES_PENDENTES` | Rode `npm run migrate` |
| Carga encerra com `CARGA_EM_ANDAMENTO` | Já existe uma carga em execução; aguarde o término |
| Arquivo `.7z` não abre | Instale o `7z` (p7zip) |
| Redis não conecta | Normal: o cache é opcional |
| Mapa sem geometrias | Rode `npm run geo:carregar` |
| Porta em uso | Altere `PORT` no backend ou a porta do Vite |

## 13. Observações

- Os arquivos do Tribunal Superior Eleitoral são públicos, mas não são versionados neste repositório.
- O projeto não é oficial e não substitui a totalização oficial.
- Tudo roda localmente; nenhum dado é enviado a terceiros.
