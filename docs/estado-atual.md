# Estado atual da aplicação

Documento consolidado do blueprint, da API e das decisões técnicas tomadas. Decisões inferidas ou alucinadas não entram aqui.

## 1. Visão geral

O doomsdayvote é uma ferramenta de conferência offline de Boletins de Urna (BUs) do TSE. Não é totalização oficial, não é tempo real e não substitui a apuração do TSE.

- Backend: Node.js, Fastify, Kysely, PostgreSQL.
- Frontend: Vue 3, Vite, Chart.js e MapLibre.
- Fontes: arquivos BWEB (`.csv`, `.csv.gz`, `.csv.7z`) e pacotes de totalização (`-bu.dat`, `-rdv.dat`, `-log.jez`) em `.zip` ou `.7z`.
- O banco é a única fonte da verdade. Nenhum arquivo importado é copiado ou armazenado.

## 2. Escopo

- Cargos tratados: **somente Presidente (código 1) e Governador (código 3)**. Qualquer outro cargo é descartado no parser.
- A totalização é separada das análises por eleição: tabelas e rotas próprias, sem `election_id`, e não alimenta as views de apuração.
- Análises por eleição continuam restritas a Presidente e Governador, como já era o caso.

## 3. Arquitetura

- `backend/src/routes`: rotas HTTP por área.
- `backend/src/modules/apuracao`: leitura da apuração, mapa, seções, resumo e linha do tempo.
- `backend/src/modules/analise`: Benford, duplicação, concentração, consistência, comparação local e estatísticas.
- `backend/src/modules/importacao`: carga BWEB, parsers 2014/2018/45, staging e persistência.
- `backend/src/modules/totalizacao`: BER, BU, RDV, log, zip/7z, métricas, divergências, conferências, agregação e worker.
- `frontend/src`: views, componentes, store de filtros, i18n e cliente HTTP.
- Migrações: baseline único `0001_schema_inicial`. Novas migrações só com autorização escrita.

## 4. Abas e fluxos

| Aba | Conteúdo |
|---|---|
| Painel | KPIs, linha do tempo (Traçado do dia), placar e biometria do recorte |
| Totalização | Tempo de voto, biometria por faixa e incidentes da urna |
| Mapa | Mapa coroplético, painel por UF/município, detalhes e tabela de seções |
| Estatística | Estatísticas descritivas, Benford, duplicação, concentração, comparação local e divergências da dupla conferência |
| Comparações | Comparação de governador por estado |
| Biometria | Biometria por UF e município |
| Encerramento | Urnas e horários de encerramento |
| Relatório | Relatório de consistência por ano, turno e cargo |
| Entre anos | Comparação entre anos |

Os filtros de cargo, ano, turno, corte e UF são compartilhados entre as abas.

## 5. API

### 5.1 Apuração e análises

| Rota | Função |
|---|---|
| `GET /api/elections` | Eleições e cargos com BU importado (Presidente e Governador) |
| `GET /api/summary` | Resumo do recorte |
| `GET /api/timeline` | Linha do tempo da apuração |
| `GET /api/map` | Agregado por UF/município, com `geom_id` e `sem_geometria` |
| `GET /api/sections` | Seções paginadas |
| `GET /api/sections/:id` | Detalhe da seção |
| `GET /api/sections/:id/versions` | Versões anteriores do BU |
| `GET /api/analysis` | Biometria por UF |
| `GET /api/anomalies` | Benford, isolamento e outliers |
| `GET /api/estatisticas` | Estatísticas descritivas |
| `GET /api/duplicacao` | Duplicação e proximidade |
| `GET /api/concentracao` | Concentração |
| `GET /api/consistencia` | Consistência aritmética do BU |
| `GET /api/comparacao-local` | Comparação local |
| `GET /api/comparacao-local/secoes` | Seções de um grupo |
| `GET /api/comparacao-anos` | Comparação entre anos |
| `GET /api/biometria/municipios` | Biometria por município |
| `GET /api/biometria/secoes` | Biometria por seção |
| `GET /api/encerramento/urnas` | Urnas e encerramento |
| `GET /api/encerramento/municipios` | Encerramento por município |
| `GET /api/encerramento/secoes` | Encerramento por seção |
| `GET /api/relatorio` | Relatório de consistência |

### 5.2 Totalização

Recorte comum às três rotas: `ano` (obrigatório), `turno` (obrigatório, 1 ou 2), `uf`, `municipio`, `zona`, `secao` e `lote`, todos opcionais. As rotas consideram apenas lotes `concluido` ou `parcial`; sem `lote`, usam o lote vigente de cada UF/ano/turno.

| Rota | Função |
|---|---|
| `GET /api/totalizacao/metricas` | Tempo de voto, biometria por faixa, incidentes e complementares |
| `GET /api/totalizacao/incidentes` | Incidentes paginados, com seção, instante, nível e texto |
| `GET /api/totalizacao/divergencias` | Divergências da dupla conferência, com filtro opcional por `fonte` |

- Paginação: `pagina` (padrão 1) e `tamanho` (padrão e máximo definidos por `SECTIONS_PAGE_SIZE_DEFAULT`/`SECTIONS_PAGE_SIZE_MAX`).
- Cache: métricas por 86.400 s; listas por 60 s.
- Resposta de métricas: `tempo` (`quantidade`, `mediaMs`, `medianaMs`, `maisRapidoMs`, `maisDemoradoMs`), `biometria` (`falhou1`, `falhou2`, `falhou3`, `falhou4`, `manual`), `incidentes` (`total`) e `complementares` (`secoes`, `aptos`, `comparecimento`, `teclasIndevidas`, `correcoes`).
- Erros seguem o contrato `{ error: { code, message } }`; validação responde `400 VALIDATION`.

## 6. Modelo de dados

- Apuração: `eleicao`, `localidade`, `secao_eleitoral`, `lote_importacao`, `boletim_versao`, `resultado_votavel`, `alerta_importacao`, `partido_cor`, `malha_geografica`, `bweb_staging`.
- Totalização: `totalizacao_lote`, `totalizacao_secao`, `totalizacao_bu_voto`, `totalizacao_rdv_voto`, `totalizacao_eleitor`, `totalizacao_incidente`, `totalizacao_divergencia`, `totalizacao_secao_erro`.
- `totalizacao_lote.status`: `processando`, `concluido`, `parcial`, `falhou`, `substituido`.
- Lote novo para a mesma UF/ano/turno marca o anterior como `substituido`; a leitura usa o vigente.
- `totalizacao_secao_erro` guarda falhas por seção, única por lote e prefixo.

## 7. Carga de arquivos

### 7.1 BWEB

- Lê direto da pasta configurada, sem copiar, sem storage e sem relatório em disco.
- Idempotente por SHA-256; lote repetido é ignorado.
- Aceita `.csv`, `.txt`, `.csv.gz`, `.txt.gz`, `.csv.7z` e `.txt.7z`.
- `.7z` é descompactado pelo binário `7z` via stdout, em memória, sem arquivo temporário.
- Persiste via `COPY` em `bweb_staging` e depois em `eleicao`, `secao_eleitoral`, `localidade`, `boletim_versao` e `resultado_votavel`.
- Descarta qualquer cargo que não seja Presidente ou Governador.

### 7.2 Totalização

- Lê `.zip` e `.7z` da pasta informada.
- Processa apenas `-bu.dat`, `-rdv.dat` e `-log.jez`; ignora `-vota.vsc`, `-imgbu.dat` e PDF.
- Idempotente por SHA-256; lote `processando`, `parcial` ou `falhou` é retomado pulando as seções já gravadas.
- Transação por seção; erro em uma seção não derruba o lote.
- Lote sem erro fica `concluido`; com erro, `parcial`; arquivo ilegível, `falhou`.
- `--falhar-rapido` interrompe no primeiro erro de seção.
- CRC32 conferido em cada entrada ZIP.

## 8. Totalização

- Conferências com tolerância zero: BU×RDV, BU×log e BU×BWEB.
- Cada diferença vira linha em `totalizacao_divergencia`, com fonte, campo, localização, cargo, votável, valor esperado e valor encontrado.
- Agregação por seção, zona, município, UF e nacional, com fechamento das somas por escopo.
- Frontend: painéis de tempo/biometria, incidentes e divergências; mapa, painel por UF, linha do tempo e tabela de seções.

## 9. Testes

- Banco de teste vazio, alimentado apenas com dados sintéticos.
- Proibido usar dados de produção no banco de teste, por cópia, download ou dump.
- Guarda que falha se `TEST_DATABASE_URL` apontar para o banco de produção.
- Fixtures do TSE removidas; geração sintética de BU, RDV, log, BWEB e ZIP.
- Meta atual: cobertura mínima de 90%.

## 10. Decisões técnicas tomadas

| # | Decisão | Origem |
|---|---|---|
| 1 | Tratar somente Presidente (1) e Governador (3) | ordem do usuário |
| 2 | Totalização separada das análises por eleição, com tabelas e rotas próprias | cards da totalização |
| 3 | Banco como única fonte da verdade; nenhum storage de arquivos | ordem do usuário |
| 4 | Baseline único `0001`; novas migrações só com autorização escrita | ordem do usuário |
| 5 | Dropar e recriar os bancos de produção e de teste | ordem do usuário |
| 6 | Banco de teste só com dado sintético; proibido dado de produção | ordem do usuário |
| 7 | Proibição total de subagentes | ordem do usuário |
| 8 | Toda alteração exige card com quem pediu, quem autorizou e quem fez | ordem do usuário |
| 9 | Exclusão de arquivo ou dado exige ordem escrita e confirmação posterior | ordem do usuário |
| 10 | `bweb/`, `bu/` e `files/` são intocáveis | ordem do usuário |
| 11 | Nada é inferido ou complementado; dúvida vira pergunta | ordem do usuário |
| 12 | Worker idempotente por SHA-256, transação por seção, status `parcial`, supersede, retomada por prefixo, `--falhar-rapido` e CRC32 | plano de resiliência aprovado |
| 13 | Leitura de `.zip` e `.7z`, inclusive `.csv.7z` do BWEB | ordem do usuário |
| 14 | Conferências BU×RDV, BU×log e BU×BWEB com tolerância zero | cards `3a59a38c`, `c784f699`, `f84ca145` |
| 15 | Agregação por seção, zona, município, UF e nacional | card `eb57e395` |
| 16 | Endpoints de métricas, incidentes e divergências, com `lote` e cache | card `cd95bcdf` e ordem do usuário |
| 17 | Abas Totalização, painéis de incidentes e divergências | cards `2a251b20`, `a73a00a7`, `ef730ed2` |
| 18 | Testes sintéticos com limite de 1 MB por artefato | ordem do usuário |
| 19 | Histórico git reescrito e fixtures do TSE purgadas | ordem do usuário |
| 20 | Remoção de `data/`, das fixtures reais e do zip de 260 MB | ordem do usuário |
| 21 | Cobertura mínima de 90% | ordem do usuário |
