# Graph Report - doomsdayvote  (2026-11-01)

## Corpus Check
- 234 files · ~194,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1524 nodes · 3205 edges · 100 communities (77 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff578a7d`
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
- criarDb
- queries.js
- MapTable.vue
- ComparacaoLocalGrupo.vue
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- outliers.js
- EncerramentoView.vue
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- TabelaScroll.vue
- StateBlock.vue
- validacoes.js
- db-teste.js
- registrarRotas
- RelatorioView.vue
- API de leitura
- AnaliseView.vue
- corte.js
- env.js
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
- i18n-codigos-api.test.js
- lote.test.js
- routes/relatorio.js
- PlacarRanking.vue
- filters.js
- status.js
- importarArquivo
- Tabelas
- BiometriaUfPanel.vue
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- aplicarFiltroCorte
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
- ordenarLista
- partido-cor.test.js
- i18n-chaves.test.js
- benford.js
- mv-secao-candidato.test.js
- i18n-texto-fixo.test.js
- 0011_sg_partido_2014.js
- integration/ordenacao.test.js
- caminhoFixture
- FilterBar.vue
- AnaliseCobertura.vue
- consistencia.js
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
- `padronizarRobusto()` --indirect_call--> `mediana()`  [INFERRED]
  backend/src/modules/analise/outliers.js → backend/src/modules/analise/estatistica-basica.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BiometriaUfPanel.vue → frontend/src/composables/ordenacao.js
- `percentual()` --calls--> `formatarPercentual()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalGrupo.vue → frontend/src/lib/format.js

## Import Cycles
- None detected.

## Communities (100 total, 8 thin omitted)

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
Cohesion: 0.14
Nodes (23): alinhar(), compararAnos(), formatarTurno(), paresDeAnos(), turnoDoAno(), candidatosDoTurno(), CARGO_PRESIDENTE, eleicoesPresidente() (+15 more)

### Community 12 - "EntreAnosView.vue"
Cohesion: 0.06
Nodes (47): caminhoDe(), dentroDoDominio(), desenhavel(), dominioY, figura, formatarY(), largura, linhaZero (+39 more)

### Community 13 - "criarDb"
Cohesion: 0.26
Nodes (5): criarDependencias(), criarDb(), criarLogger(), db, fixture

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.14
Nodes (14): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+6 more)

### Community 16 - "ComparacaoLocalGrupo.vue"
Cohesion: 0.20
Nodes (8): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t }

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.10
Nodes (19): Ajustes dos gráficos (2026-10-31), Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31), Decisões do usuário, Decisões do usuário, Decisões do usuário (2026-10-31) (+11 more)

### Community 18 - "outliers.js"
Cohesion: 0.15
Nodes (14): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+6 more)

### Community 19 - "EncerramentoView.vue"
Cohesion: 0.08
Nodes (18): carregandoMunicipios, carregandoSecoes, carregandoUrnas, erroMunicipios, erroSecoes, erroUrnas, municipios, municipioSelecionado (+10 more)

### Community 20 - "colors.js"
Cohesion: 0.18
Nodes (19): itensGradiente(), legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido() (+11 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "TabelaScroll.vue"
Cohesion: 0.11
Nodes (18): candidatos, mad(), props, formatarMad(), { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery (+10 more)

### Community 24 - "StateBlock.vue"
Cohesion: 0.09
Nodes (16): emit, ativo, candidatos, emit, minimo, props, cobertura, diferenca() (+8 more)

### Community 25 - "validacoes.js"
Cohesion: 0.19
Nodes (13): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), normalizar() (+5 more)

### Community 26 - "db-teste.js"
Cohesion: 0.19
Nodes (11): contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, app, db, db, db (+3 more)

### Community 27 - "registrarRotas"
Cohesion: 0.16
Nodes (16): buildApp(), detalhesFastify(), detalhesZod(), migracoesPendentes(), loadApiEnv(), isProduction(), registrarRotas(), main() (+8 more)

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
Cohesion: 0.36
Nodes (8): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), resolverCorte(), erroDe()

### Community 32 - "env.js"
Cohesion: 0.05
Nodes (36): DIRETORIO_MIGRACOES, apiSchema, booleanEnv, carregar(), databaseEnv, loadMigrateEnv(), loadWorkerEnv(), logLevel (+28 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.16
Nodes (14): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+6 more)

### Community 34 - "useOrdenacao"
Cohesion: 0.12
Nodes (12): cobertura, emit, grupos, props, props, grupos, props, comparacao (+4 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.14
Nodes (23): COLUNAS_CONSISTENCIA, base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base(), baseSecaoCandidato(), benfordDosNiveis() (+15 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "components.test.js"
Cohesion: 0.13
Nodes (11): biometria, emit, fatias, participacao, props, { t }, candidatos, ControleFalso (+3 more)

### Community 43 - "concentracao.js"
Cohesion: 0.10
Nodes (35): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), criarGrupo(), normalizarSecao() (+27 more)

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 46 - "criarCache"
Cohesion: 0.14
Nodes (3): criarCache(), params, RedisFalso

### Community 47 - "i18n-codigos-api.test.js"
Cohesion: 0.24
Nodes (10): api, ApiError, montarQuery(), obter(), mensagemErroApi(), NAO_ENCONTRADO, arquivos(), BACKEND (+2 more)

### Community 48 - "lote.test.js"
Cohesion: 0.14
Nodes (13): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, carimbo(), carregarPasta(), gerarRelatorioLote(), main(), backendDir, db (+5 more)

### Community 49 - "routes/relatorio.js"
Cohesion: 0.33
Nodes (9): agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO, buscarEleicao(), escopoDe(), colunasRelatorio(), diferencaPct() (+1 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.22
Nodes (10): validos, candidatos, deltas, emit, escolher(), props, validos, validosAte1715 (+2 more)

### Community 52 - "filters.js"
Cohesion: 0.29
Nodes (8): deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 53 - "status.js"
Cohesion: 0.22
Nodes (9): lista, props, avisoInfo(), avisoMensagem(), AVISOS, MENSAGEM_POR_TEXTO, MOTIVOS, STATUS_KEYS (+1 more)

### Community 55 - "importarArquivo"
Cohesion: 0.26
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), criarValidador() (+5 more)

### Community 56 - "Tabelas"
Cohesion: 0.29
Nodes (6): Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "BiometriaUfPanel.vue"
Cohesion: 0.22
Nodes (8): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO

### Community 59 - "PainelView.vue"
Cohesion: 0.12
Nodes (17): candidatos, {
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
}, resumoQuery, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos (+9 more)

### Community 61 - "aplicarFiltroCorte"
Cohesion: 0.26
Nodes (15): comparacaoLocal(), duplicacaoPorAssinatura(), aplicarEscopo(), aplicarFiltroCorte(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base() (+7 more)

### Community 62 - "format.js"
Cohesion: 0.12
Nodes (25): cobertura, emit, percentual(), percentualRazao(), pontosPercentuais(), topMargem, topShare, participacao (+17 more)

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
Cohesion: 0.17
Nodes (23): metadadosCorte(), buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql() (+15 more)

### Community 82 - "lib.test.js"
Cohesion: 0.26
Nodes (14): areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos() (+6 more)

### Community 83 - "0012_sg_partido_2014_exterior.js"
Cohesion: 0.70
Nodes (4): atualizarViews(), down(), preencherSiglaExterior(), up()

### Community 84 - "i18n/index.js"
Cohesion: 0.38
Nodes (3): definirLocale(), i18n, SUPORTADOS

### Community 85 - "CoberturaBlock.vue"
Cohesion: 0.33
Nodes (4): coberturaEfetiva, entradas, props, { t, te }

### Community 86 - "ordenarLista"
Cohesion: 0.16
Nodes (24): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+16 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "i18n-chaves.test.js"
Cohesion: 0.20
Nodes (6): chavesPt, GRUPOS, LOCALES, prefixos, RAIZ, usadas

### Community 90 - "benford.js"
Cohesion: 0.39
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

### Community 94 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 95 - "caminhoFixture"
Cohesion: 0.10
Nodes (17): atualizarViews(), caminhoFixture(), app, db, importar(), app, db, importar() (+9 more)

### Community 96 - "FilterBar.vue"
Cohesion: 0.40
Nodes (4): emit, municipioAtivo, props, UFS

### Community 97 - "AnaliseCobertura.vue"
Cohesion: 0.33
Nodes (5): campos, camposAusentes, camposNaoInformados, props, { t }

### Community 99 - "consistencia.js"
Cohesion: 0.19
Nodes (14): agregadoDeResultados(), ausente(), coberturaDoRecorte(), COLUNAS_BU, COLUNAS_RESULTADOS, consistenciaPorSecao(), consultaBase(), montarItem() (+6 more)

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

## Knowledge Gaps
- **574 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+569 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 729 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `env.js`, `mv-secao-candidato.test.js`, `status-secao.test.js`, `lote.test.js`, `importarArquivo`, `partido-cor.test.js`, `db-teste.js`, `registrarRotas`, `integration/ordenacao.test.js`, `caminhoFixture`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `MapaFalso` connect `MapaFalso` to `components.test.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `format.js` to `BiometriaView.vue`, `MapPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `EntreAnosView.vue`, `MapTable.vue`, `ComparacaoLocalGrupo.vue`, `EncerramentoView.vue`, `TabelaScroll.vue`, `StateBlock.vue`, `RelatorioView.vue`, `SectionsTable.vue`, `useOrdenacao`, `UfPanel.vue`, `components.test.js`, `PlacarRanking.vue`, `BiometriaUfPanel.vue`, `lib.test.js`, `AnaliseCobertura.vue`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _574 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._