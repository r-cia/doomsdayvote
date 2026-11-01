# Graph Report - doomsdayvote  (2026-11-01)

## Corpus Check
- 235 files · ~195,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1531 nodes · 3236 edges · 104 communities (81 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `14b95e10`
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
- persistir-bus.js
- PlotDia.vue
- Doomsday Vote
- Design System: Doomsday Vote
- comparar.js
- EntreAnosView.vue
- limparBanco
- queries.js
- MapTable.vue
- formatarPercentual
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- EncerramentoView.vue
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- EstatisticaPanel.vue
- ConsistenciaPanel.vue
- validacoes.js
- criarDb
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
- client.js
- fixtures.js
- resolverCorte
- PlacarRanking.vue
- filters.js
- status.js
- importarArquivo
- Tabelas
- BiometriaUfPanel.vue
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- apuracao.js
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
- i18n/index.js
- CoberturaBlock.vue
- aplicarFiltroCorte
- partido-cor.test.js
- i18n-chaves.test.js
- caminhoFixture
- mv-secao-candidato.test.js
- i18n-texto-fixo.test.js
- 0011_sg_partido_2014.js
- integration/ordenacao.test.js
- db-teste.js
- schema.test.js
- duplicacao.js
- lote.test.js
- consistencia.js
- RedisFalso
- analise/relatorio.js
- Internacionalização (i18n)
- migracoes.test.js

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 46 edges
2. `useOrdenacao()` - 41 edges
3. `caminhoFixture()` - 36 edges
4. `criarDb()` - 35 edges
5. `formatarNumero()` - 32 edges
6. `aplicarFiltroCorte()` - 31 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `limparBanco()` - 24 edges
10. `useSelecaoEleicao()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BiometriaUfPanel.vue → frontend/src/composables/ordenacao.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalGrupo.vue → frontend/src/lib/format.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/composables/ordenacao.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/lib/format.js

## Import Cycles
- None detected.

## Communities (104 total, 8 thin omitted)

### Community 0 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (15): analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios, erroSecoes, municipios, municipioSelecionado, ordemMunicipios (+7 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (45): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), TIPOS, detectarLeiaute() (+37 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.08
Nodes (40): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+32 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.07
Nodes (27): motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar(), habilitado (+19 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.13
Nodes (21): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+13 more)

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
Nodes (51): caminhoDe(), dentroDoDominio(), desenhavel(), dominioY, figura, formatarY(), horaDe(), largura (+43 more)

### Community 13 - "limparBanco"
Cohesion: 0.14
Nodes (5): limparBanco(), db, fixture, db, db

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.14
Nodes (14): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+6 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.10
Nodes (18): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+10 more)

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
Cohesion: 0.18
Nodes (19): itensGradiente(), legenda, clarear(), COR_NEUTRA, corDaArea(), corDoLider(), corPartido(), corPercentual() (+11 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "EstatisticaPanel.vue"
Cohesion: 0.20
Nodes (8): { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery, numero(), props, { t }, temDoisTurnos

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 26 - "criarDb"
Cohesion: 0.21
Nodes (10): criarDb(), loadWorkerEnv(), main(), db, env, main(), cores, db (+2 more)

### Community 27 - "app.js"
Cohesion: 0.17
Nodes (12): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+4 more)

### Community 28 - "RelatorioView.vue"
Cohesion: 0.14
Nodes (12): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, diferenca(), linhas, percentualCobertura (+4 more)

### Community 29 - "API de leitura"
Cohesion: 0.11
Nodes (17): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+9 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (14): queryClient, router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem (+6 more)

### Community 31 - "corte.js"
Cohesion: 0.33
Nodes (10): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), metadadosCorte(), cacheDeCorte() (+2 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.16
Nodes (14): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+6 more)

### Community 34 - "useOrdenacao"
Cohesion: 0.08
Nodes (26): emit, candidatos, mad(), props, ativo, candidatos, emit, formatarMad() (+18 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.20
Nodes (14): COLUNAS_CONSISTENCIA, base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), COLUNAS_BENFORD, COLUNAS_BENFORD_NIVEIS, COLUNAS_BIOMETRIA_UF (+6 more)

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
Cohesion: 0.06
Nodes (63): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito(), agruparPor(), agruparSecoes() (+55 more)

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 46 - "criarCache"
Cohesion: 0.23
Nodes (4): criarDependencias(), criarCache(), criarLogger(), params

### Community 47 - "client.js"
Cohesion: 0.39
Nodes (5): ApiError, montarQuery(), obter(), mensagemErroApi(), NAO_ENCONTRADO

### Community 48 - "fixtures.js"
Cohesion: 0.21
Nodes (10): carimbo(), carregarPasta(), gerarRelatorioLote(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+2 more)

### Community 49 - "resolverCorte"
Cohesion: 0.22
Nodes (14): lerOrdenacao(), ordenacaoSchema(), corteResposta(), resolverCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, registrarBiometria(), buscarEleicao() (+6 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 52 - "filters.js"
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 53 - "status.js"
Cohesion: 0.15
Nodes (14): api, lista, props, avisoInfo(), avisoMensagem(), AVISOS, MENSAGEM_POR_TEXTO, MOTIVOS (+6 more)

### Community 55 - "importarArquivo"
Cohesion: 0.23
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+5 more)

### Community 56 - "Tabelas"
Cohesion: 0.29
Nodes (6): Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "BiometriaUfPanel.vue"
Cohesion: 0.22
Nodes (8): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO

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

### Community 61 - "apuracao.js"
Cohesion: 0.33
Nodes (10): aplicarEscopo(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base(), somarMetricasSecao(), totaisPorArea(), COLUNAS_MAPA (+2 more)

### Community 62 - "format.js"
Cohesion: 0.11
Nodes (24): campos, camposAusentes, camposNaoInformados, props, { t }, participacao, percentualDoCandidato, props (+16 more)

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
Cohesion: 0.22
Nodes (17): buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql(), statusSql() (+9 more)

### Community 82 - "lib.test.js"
Cohesion: 0.25
Nodes (15): areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos() (+7 more)

### Community 83 - "0012_sg_partido_2014_exterior.js"
Cohesion: 0.70
Nodes (4): atualizarViews(), down(), preencherSiglaExterior(), up()

### Community 84 - "i18n/index.js"
Cohesion: 0.38
Nodes (3): definirLocale(), i18n, SUPORTADOS

### Community 85 - "CoberturaBlock.vue"
Cohesion: 0.33
Nodes (4): coberturaEfetiva, entradas, props, { t, te }

### Community 86 - "aplicarFiltroCorte"
Cohesion: 0.20
Nodes (19): comparar(), nulo(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao(), DERIVADAS_PARTIDO, ENCERRAMENTO_BU (+11 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.28
Nodes (7): contar(), ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "i18n-chaves.test.js"
Cohesion: 0.20
Nodes (6): chavesPt, GRUPOS, LOCALES, prefixos, RAIZ, usadas

### Community 90 - "caminhoFixture"
Cohesion: 0.19
Nodes (9): caminhoFixture(), app, db, importar(), db, importar(), app, db (+1 more)

### Community 91 - "mv-secao-candidato.test.js"
Cohesion: 0.32
Nodes (6): db, FINAL, normalizarGrupos(), ordenarListas(), POR_TABELAS, porTexto()

### Community 92 - "i18n-texto-fixo.test.js"
Cohesion: 0.32
Nodes (6): achados(), ATRIBUTOS_TEXTO, PERMITIDOS, RAIZ, template(), temTextoVisivel()

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.52
Nodes (6): down(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews(), recriarVotosFinal(), up()

### Community 94 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 95 - "db-teste.js"
Cohesion: 0.13
Nodes (11): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, somarVotos(), atualizarViews(), db, importar(), db, importar() (+3 more)

### Community 96 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 97 - "duplicacao.js"
Cohesion: 0.33
Nodes (8): agruparAssinaturas(), agruparComVencedorDeZona(), chaveMunicipio(), chaveZona(), COLUNAS_DUPLICACAO, duplicacaoPelaMv(), duplicacaoPorAssinatura(), vencedorDaSecao()

### Community 98 - "lote.test.js"
Cohesion: 0.33
Nodes (4): copiaAlterada(), db, fixture, juntar()

### Community 99 - "consistencia.js"
Cohesion: 0.19
Nodes (14): agregadoDeResultados(), ausente(), coberturaDoRecorte(), COLUNAS_BU, COLUNAS_RESULTADOS, consistenciaPorSecao(), consultaBase(), montarItem() (+6 more)

### Community 101 - "analise/relatorio.js"
Cohesion: 0.60
Nodes (4): agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

### Community 103 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

## Knowledge Gaps
- **577 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+572 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 730 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `lote.test.js`, `mv-secao-candidato.test.js`, `limparBanco`, `criarCache`, `status-secao.test.js`, `fixtures.js`, `importarArquivo`, `partido-cor.test.js`, `caminhoFixture`, `app.js`, `integration/ordenacao.test.js`, `db-teste.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `BiometriaView.vue`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `components.test.js`, `MapTable.vue`, `formatarPercentual`, `EncerramentoView.vue`, `MapaView.vue`, `EstatisticaPanel.vue`, `ConsistenciaPanel.vue`, `BiometriaUfPanel.vue`, `PainelView.vue`, `RelatorioView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `MapaFalso` connect `MapaFalso` to `components.test.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _577 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07867494824016563 - nodes in this community are weakly interconnected._