# Graph Report - doomsdayvote  (2026-11-01)

## Corpus Check
- 234 files · ~193,550 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1515 nodes · 3182 edges · 96 communities (73 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `207e216b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BiometriaView.vue
- ler-arquivo.js
- scripts
- dependencies
- MapPanel.vue
- MapaFalso
- SecaoView.vue
- validacoes.js
- PlotDia.vue
- Doomsday Vote
- Design System: Doomsday Vote
- comparar.js
- EntreAnosView.vue
- criarDb
- queries.js
- MapTable.vue
- formatarNumero
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- EncerramentoView.vue
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- StateBlock.vue
- ConsistenciaPanel.vue
- schema.test.js
- db-teste.js
- app.js
- RelatorioView.vue
- API de leitura
- AnaliseView.vue
- corte.js
- geo-carregar.js
- SectionsTable.vue
- useOrdenacao
- Entre anos
- UfPanel.vue
- analise.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- routes/index.js
- versoes-bu.js
- components.test.js
- concentracao.js
- useSelecaoEleicao
- criarCache
- RedisFalso
- lote.test.js
- apuracao.js
- PlacarRanking.vue
- filters.js
- importarArquivo
- Tabelas
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- limparBanco
- format.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- status-secao.test.js
- routes/secoes.js
- lib.test.js
- 0012_sg_partido_2014_exterior.js
- aplicarEscopo
- aplicarFiltroCorte
- partido-cor.test.js
- i18n-chaves.test.js
- benford.js
- mv-secao-candidato.test.js
- i18n-texto-fixo.test.js
- 0011_sg_partido_2014.js
- caminhoFixture
- AnaliseCobertura.vue
- consistencia.js
- migracoes.test.js
- Internacionalização (i18n)

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 45 edges
2. `useOrdenacao()` - 41 edges
3. `caminhoFixture()` - 35 edges
4. `criarDb()` - 34 edges
5. `formatarNumero()` - 32 edges
6. `aplicarFiltroCorte()` - 31 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `useSelecaoEleicao()` - 24 edges
10. `aplicarEscopo()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (96 total, 8 thin omitted)

### Community 0 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (15): analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios, erroSecoes, municipios, municipioSelecionado, ordemMunicipios (+7 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (44): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), detectarLeiaute(), detectarLeiauteDeCampos() (+36 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.09
Nodes (37): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+29 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.07
Nodes (28): formatarSha(), motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar() (+20 more)

### Community 7 - "validacoes.js"
Cohesion: 0.09
Nodes (34): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), TIPOS, dataHora() (+26 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.06
Nodes (43): api, ApiError, montarQuery(), obter(), lista, props, animar(), aoApontar() (+35 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.06
Nodes (30): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14.1 Servidor Postgres 16, 14.2 Conexões da aplicação (`backend/src/db/index.js`), 14.3 Índices, 14.4 Estatísticas estendidas (+22 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "comparar.js"
Cohesion: 0.16
Nodes (21): alinhar(), compararAnos(), formatarTurno(), paresDeAnos(), turnoDoAno(), candidatosDoTurno(), CARGO_PRESIDENTE, eleicoesPresidente() (+13 more)

### Community 12 - "EntreAnosView.vue"
Cohesion: 0.06
Nodes (46): caminhoDe(), desenhavel(), dominioY, figura, formatarY(), largura, limitesX, linhaZero (+38 more)

### Community 13 - "criarDb"
Cohesion: 0.20
Nodes (11): criarDb(), atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, loadWorkerEnv(), main(), db, env, main() (+3 more)

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.15
Nodes (13): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+5 more)

### Community 16 - "formatarNumero"
Cohesion: 0.11
Nodes (20): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+12 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.10
Nodes (19): Ajustes dos gráficos (2026-10-31), Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31), Decisões do usuário, Decisões do usuário, Decisões do usuário (2026-10-31) (+11 more)

### Community 18 - "env.js"
Cohesion: 0.18
Nodes (12): migracoesPendentes(), apiSchema, booleanEnv, carregar(), databaseEnv, loadApiEnv(), logLevel, migrateSchema (+4 more)

### Community 19 - "EncerramentoView.vue"
Cohesion: 0.08
Nodes (18): carregandoMunicipios, carregandoSecoes, carregandoUrnas, erroMunicipios, erroSecoes, erroUrnas, municipios, municipioSelecionado (+10 more)

### Community 20 - "colors.js"
Cohesion: 0.17
Nodes (20): itensGradiente(), legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido() (+12 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "StateBlock.vue"
Cohesion: 0.07
Nodes (24): emit, candidatos, mad(), props, ativo, candidatos, emit, formatarMad() (+16 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 26 - "db-teste.js"
Cohesion: 0.21
Nodes (7): contar(), FIXTURES, LINHAS_POR_FIXTURE, db, db, fixture, db

### Community 27 - "app.js"
Cohesion: 0.15
Nodes (14): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, app, db (+6 more)

### Community 28 - "RelatorioView.vue"
Cohesion: 0.11
Nodes (16): queryClient, router, comparacaoLocalQuery, ordenacao, { store }, { alternar, ariaSort, seta, params }, alvo, cargoSelecionado (+8 more)

### Community 29 - "API de leitura"
Cohesion: 0.11
Nodes (17): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+9 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.20
Nodes (9): analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem, ordemShare, ordenacoes (+1 more)

### Community 31 - "corte.js"
Cohesion: 0.29
Nodes (11): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), metadadosCorte(), cacheDeCorte() (+3 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.16
Nodes (14): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+6 more)

### Community 34 - "useOrdenacao"
Cohesion: 0.08
Nodes (24): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO (+16 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.12
Nodes (25): COLUNAS_CONCENTRACAO, base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base(), baseSecaoCandidato(), benfordDosNiveis() (+17 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "routes/index.js"
Cohesion: 0.29
Nodes (5): AppError, validar(), comparacaoAnosSchema, registrarComparacaoAnos(), registrarRotas()

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "components.test.js"
Cohesion: 0.10
Nodes (15): biometria, emit, fatias, participacao, props, { t }, emit, municipioAtivo (+7 more)

### Community 43 - "concentracao.js"
Cohesion: 0.10
Nodes (41): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+33 more)

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 46 - "criarCache"
Cohesion: 0.23
Nodes (4): criarDependencias(), criarCache(), criarLogger(), params

### Community 48 - "lote.test.js"
Cohesion: 0.17
Nodes (10): carimbo(), carregarPasta(), gerarRelatorioLote(), backendDir, db, execFileAsync, copiaAlterada(), db (+2 more)

### Community 49 - "apuracao.js"
Cohesion: 0.20
Nodes (17): lerOrdenacao(), ordenacaoSchema(), resolverCorte(), areasComDeltaEntreCortes(), COLUNAS_MAPA, COLUNAS_VOTOS, registrarApuracao(), baseSchema (+9 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 52 - "filters.js"
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 55 - "importarArquivo"
Cohesion: 0.20
Nodes (14): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+6 more)

### Community 56 - "Tabelas"
Cohesion: 0.29
Nodes (6): Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 59 - "PainelView.vue"
Cohesion: 0.12
Nodes (18): candidatos, {
  eleicoesQuery,
  eleicoesDisponiveis,
  cargos,
  anos,
  turnos,
  filtros,
  aoCargo,
  aoAno,
  aoTurno,
  aoCandidato,
  aoCorte,
  aoUf,
  limparMunicipio,
  limpar,
}, resumoQuery, candidatos, candidatosNominais(), candidatos, analiseQuery, avisos (+10 more)

### Community 61 - "limparBanco"
Cohesion: 0.16
Nodes (11): contarSecoesComBu(), base(), somarMetricasSecao(), somarVotos(), totaisPorArea(), limparBanco(), db, importar() (+3 more)

### Community 62 - "format.js"
Cohesion: 0.17
Nodes (16): participacao, percentualDoCandidato, props, validos, votosDoCandidato, recebimento(), deInputSaoPaulo(), formatadorOffset (+8 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.29
Nodes (6): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Entre anos, Limitações conhecidas, Siglas e cores de partidos

### Community 79 - "status-secao.test.js"
Cohesion: 0.29
Nodes (5): app, db, importar(), itemDaSecao(), itens()

### Community 81 - "routes/secoes.js"
Cohesion: 0.24
Nodes (16): buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql(), statusSql() (+8 more)

### Community 82 - "lib.test.js"
Cohesion: 0.22
Nodes (17): nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas() (+9 more)

### Community 83 - "0012_sg_partido_2014_exterior.js"
Cohesion: 0.70
Nodes (4): atualizarViews(), down(), preencherSiglaExterior(), up()

### Community 85 - "aplicarEscopo"
Cohesion: 0.18
Nodes (14): agruparAssinaturas(), agruparComVencedorDeZona(), chaveMunicipio(), chaveZona(), COLUNAS_DUPLICACAO, duplicacaoPelaMv(), duplicacaoPorAssinatura(), vencedorDaSecao() (+6 more)

### Community 86 - "aplicarFiltroCorte"
Cohesion: 0.19
Nodes (21): comparar(), nulo(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao(), DERIVADAS_PARTIDO, ENCERRAMENTO_BU (+13 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "i18n-chaves.test.js"
Cohesion: 0.20
Nodes (6): chavesPt, GRUPOS, LOCALES, prefixos, RAIZ, usadas

### Community 90 - "benford.js"
Cohesion: 0.17
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 91 - "mv-secao-candidato.test.js"
Cohesion: 0.32
Nodes (6): db, FINAL, normalizarGrupos(), ordenarListas(), POR_TABELAS, porTexto()

### Community 92 - "i18n-texto-fixo.test.js"
Cohesion: 0.32
Nodes (6): achados(), ATRIBUTOS_TEXTO, PERMITIDOS, RAIZ, template(), temTextoVisivel()

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.52
Nodes (6): down(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews(), recriarVotosFinal(), up()

### Community 95 - "caminhoFixture"
Cohesion: 0.14
Nodes (16): atualizarViews(), caminhoFixture(), importar(), app, db, importar(), app, db (+8 more)

### Community 97 - "AnaliseCobertura.vue"
Cohesion: 0.33
Nodes (5): campos, camposAusentes, camposNaoInformados, props, { t }

### Community 99 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 101 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

## Knowledge Gaps
- **575 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+570 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 730 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `mv-secao-candidato.test.js`, `criarCache`, `status-secao.test.js`, `lote.test.js`, `importarArquivo`, `partido-cor.test.js`, `db-teste.js`, `app.js`, `limparBanco`, `caminhoFixture`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaView.vue`, `AnaliseCobertura.vue`, `useOrdenacao`, `SectionsTable.vue`, `MapPanel.vue`, `UfPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `components.test.js`, `EntreAnosView.vue`, `MapTable.vue`, `PlacarRanking.vue`, `EncerramentoView.vue`, `lib.test.js`, `StateBlock.vue`, `ConsistenciaPanel.vue`, `RelatorioView.vue`, `format.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `BiometriaView.vue`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `components.test.js`, `MapTable.vue`, `formatarNumero`, `EncerramentoView.vue`, `MapaView.vue`, `StateBlock.vue`, `ConsistenciaPanel.vue`, `PainelView.vue`, `RelatorioView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _575 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._