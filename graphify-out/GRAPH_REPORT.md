# Graph Report - doomsdayvote  (2026-11-01)

## Corpus Check
- 241 files · ~199,422 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1591 nodes · 3324 edges · 106 communities (81 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2702376c`
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
- CurvasAnos.vue
- criarDb
- queries.js
- MapTable.vue
- formatarPercentual
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- EncerramentoView.vue
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- EntreAnosView.vue
- ConsistenciaPanel.vue
- validacoes.js
- benford.js
- registrarRotas
- RelatorioView.vue
- API de leitura
- StateBlock.vue
- EstatisticaPanel.vue
- formatarNumero
- SectionsTable.vue
- BenfordPanel.vue
- Entre anos
- UfPanel.vue
- analise.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- BenfordFaixa.vue
- versoes-bu.js
- components.test.js
- concentracao.js
- useSelecaoEleicao
- criarCache
- i18n-codigos-api.test.js
- lote.test.js
- corte.js
- PlacarRanking.vue
- filters.js
- status.js
- importarArquivo
- Tabelas
- useOrdenacao
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- estilo-classes.test.js
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
- geo-carregar.js
- routes/index.js
- partido-cor.test.js
- i18n-chaves.test.js
- entre-anos.js
- apuracao.js
- i18n-texto-fixo.test.js
- 0011_sg_partido_2014.js
- AppError
- caminhoFixture
- mv-secao-candidato.test.js
- duplicacao.js
- schema.test.js
- consistencia.js
- RedisFalso
- Benford
- Internacionalização (i18n)
- benford-faixa.test.js
- server.js
- migracoes.test.js

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 46 edges
2. `useOrdenacao()` - 41 edges
3. `formatarNumero()` - 38 edges
4. `caminhoFixture()` - 36 edges
5. `criarDb()` - 35 edges
6. `aplicarFiltroCorte()` - 31 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `limparBanco()` - 24 edges
10. `useSelecaoEleicao()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (106 total, 10 thin omitted)

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
Nodes (28): formatarSha(), motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar() (+20 more)

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

### Community 12 - "CurvasAnos.vue"
Cohesion: 0.13
Nodes (22): caminhoDe(), dentroDoDominio(), desenhavel(), dominioY, figura, formatarY(), horaDe(), largura (+14 more)

### Community 13 - "criarDb"
Cohesion: 0.12
Nodes (16): criarDb(), contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+8 more)

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (16): linhasTooltip(), aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina (+8 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.16
Nodes (10): percentual(), cobertura, emit, percentual(), percentualRazao(), pontosPercentuais(), props, topMargem (+2 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.10
Nodes (20): Ajustes dos gráficos (2026-10-31), Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31), Decisões do usuário, Decisões do usuário, Decisões do usuário (2026-10-31) (+12 more)

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (16): apiSchema, booleanEnv, carregar(), databaseEnv, loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+8 more)

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

### Community 23 - "EntreAnosView.vue"
Cohesion: 0.12
Nodes (18): coresDosCandidatos(), coresDosPares(), percentualDoTotal(), coresCandidatos, coresPares, dados, { eleicoesDisponiveis }, escolhido (+10 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "validacoes.js"
Cohesion: 0.18
Nodes (16): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador() (+8 more)

### Community 26 - "benford.js"
Cohesion: 0.28
Nodes (10): calcularBenford(), classificarMad(), DIGITOS, distribuicaoMonteCarlo(), distribuicoesMonteCarlo, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito() (+2 more)

### Community 27 - "registrarRotas"
Cohesion: 0.13
Nodes (17): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), registrarRotas(), app, db, app (+9 more)

### Community 28 - "RelatorioView.vue"
Cohesion: 0.11
Nodes (16): queryClient, router, comparacaoLocalQuery, ordenacao, { store }, { alternar, ariaSort, seta, params }, alvo, cargoSelecionado (+8 more)

### Community 29 - "API de leitura"
Cohesion: 0.11
Nodes (17): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+9 more)

### Community 30 - "StateBlock.vue"
Cohesion: 0.11
Nodes (15): campos, camposAusentes, camposNaoInformados, props, { t }, emit, analiseQuery, anomaliasQuery (+7 more)

### Community 31 - "EstatisticaPanel.vue"
Cohesion: 0.22
Nodes (7): { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery, props, { t }, temDoisTurnos

### Community 32 - "formatarNumero"
Cohesion: 0.09
Nodes (19): coberturaEfetiva, entradas, formatarValor(), props, ROTULOS_REGRA, { t, te }, aberto, consulta (+11 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.16
Nodes (14): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+6 more)

### Community 34 - "BenfordPanel.vue"
Cohesion: 0.10
Nodes (18): candidatos, mad(), props, pValor(), ativo, candidatos, dadosDoNivel, emit (+10 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.13
Nodes (21): COLUNAS_CONSISTENCIA, base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato() (+13 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "BenfordFaixa.vue"
Cohesion: 0.14
Nodes (18): areaLargura, centro(), descricao(), faixaDe(), figura, largura, larguraBarra, linhaEsperado (+10 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "components.test.js"
Cohesion: 0.10
Nodes (15): biometria, emit, fatias, participacao, props, { t }, emit, municipioAtivo (+7 more)

### Community 43 - "concentracao.js"
Cohesion: 0.09
Nodes (43): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), criarGrupo(), normalizarSecao() (+35 more)

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 47 - "i18n-codigos-api.test.js"
Cohesion: 0.24
Nodes (10): api, ApiError, montarQuery(), obter(), mensagemErroApi(), NAO_ENCONTRADO, arquivos(), BACKEND (+2 more)

### Community 48 - "lote.test.js"
Cohesion: 0.18
Nodes (10): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db (+2 more)

### Community 49 - "corte.js"
Cohesion: 0.16
Nodes (22): comparacaoLocal(), base(), candidatosPelaMv(), candidatosPelasTabelas(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), agregadosRelatorio() (+14 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.24
Nodes (9): validos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios (+1 more)

### Community 52 - "filters.js"
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 53 - "status.js"
Cohesion: 0.22
Nodes (9): lista, props, avisoInfo(), avisoMensagem(), AVISOS, MENSAGEM_POR_TEXTO, MOTIVOS, STATUS_KEYS (+1 more)

### Community 55 - "importarArquivo"
Cohesion: 0.21
Nodes (12): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+4 more)

### Community 56 - "Tabelas"
Cohesion: 0.25
Nodes (7): Blocos de resumo, Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "useOrdenacao"
Cohesion: 0.09
Nodes (19): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO (+11 more)

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

### Community 61 - "estilo-classes.test.js"
Cohesion: 0.15
Nodes (11): arquivos, classesDefinidas, css, elementos(), ESTRUTURAIS, LISTAS, LISTAS_SEM_CLASSE_PERMITIDAS, PERMITIDAS (+3 more)

### Community 62 - "format.js"
Cohesion: 0.18
Nodes (15): participacao, percentualDoCandidato, props, votosDoCandidato, recebimento(), deInputSaoPaulo(), formatadorOffset, formatadorPartes (+7 more)

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
Cohesion: 0.28
Nodes (13): areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos(), normalizarCodigo() (+5 more)

### Community 83 - "0012_sg_partido_2014_exterior.js"
Cohesion: 0.70
Nodes (4): atualizarViews(), down(), preencherSiglaExterior(), up()

### Community 84 - "i18n/index.js"
Cohesion: 0.38
Nodes (3): definirLocale(), i18n, SUPORTADOS

### Community 85 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 86 - "routes/index.js"
Cohesion: 0.14
Nodes (30): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+22 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "i18n-chaves.test.js"
Cohesion: 0.20
Nodes (6): chavesPt, GRUPOS, LOCALES, prefixos, RAIZ, usadas

### Community 90 - "entre-anos.js"
Cohesion: 0.33
Nodes (10): diferenca(), diferencasEntrePares(), DOMINIO_X, larguraRotulo(), margemDireita(), PALETA_CANDIDATOS, PALETA_DIFERENCAS, TRACOS_ANOS (+2 more)

### Community 91 - "apuracao.js"
Cohesion: 0.25
Nodes (15): corteResposta(), metadadosCorte(), areasComDeltaEntreCortes(), base(), somarMetricasSecao(), somarVotos(), totaisPorArea(), COLUNAS_MAPA (+7 more)

### Community 92 - "i18n-texto-fixo.test.js"
Cohesion: 0.32
Nodes (6): achados(), ATRIBUTOS_TEXTO, PERMITIDOS, RAIZ, template(), temTextoVisivel()

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.52
Nodes (6): down(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews(), recriarVotosFinal(), up()

### Community 95 - "caminhoFixture"
Cohesion: 0.11
Nodes (17): atualizarViews(), caminhoFixture(), app, db, importar(), app, db, importar() (+9 more)

### Community 96 - "mv-secao-candidato.test.js"
Cohesion: 0.32
Nodes (6): db, FINAL, normalizarGrupos(), ordenarListas(), POR_TABELAS, porTexto()

### Community 97 - "duplicacao.js"
Cohesion: 0.33
Nodes (8): agruparAssinaturas(), agruparComVencedorDeZona(), chaveMunicipio(), chaveZona(), COLUNAS_DUPLICACAO, duplicacaoPelaMv(), duplicacaoPorAssinatura(), vencedorDaSecao()

### Community 98 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 99 - "consistencia.js"
Cohesion: 0.19
Nodes (14): agregadoDeResultados(), ausente(), coberturaDoRecorte(), COLUNAS_BU, COLUNAS_RESULTADOS, consistenciaPorSecao(), consultaBase(), montarItem() (+6 more)

### Community 101 - "Benford"
Cohesion: 0.50
Nodes (3): Benford, Candidato e nível, Gráfico

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

### Community 103 - "benford-faixa.test.js"
Cohesion: 0.67
Nodes (3): candidato(), digitos(), faixa

### Community 104 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 105 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

## Knowledge Gaps
- **607 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+602 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 765 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaView.vue`, `MapPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `CurvasAnos.vue`, `MapTable.vue`, `formatarPercentual`, `EncerramentoView.vue`, `ConsistenciaPanel.vue`, `RelatorioView.vue`, `StateBlock.vue`, `EstatisticaPanel.vue`, `SectionsTable.vue`, `BenfordPanel.vue`, `UfPanel.vue`, `components.test.js`, `PlacarRanking.vue`, `useOrdenacao`, `format.js`, `lib.test.js`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `mv-secao-candidato.test.js`, `server.js`, `status-secao.test.js`, `lote.test.js`, `env.js`, `geo-carregar.js`, `importarArquivo`, `partido-cor.test.js`, `registrarRotas`, `caminhoFixture`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `formatarNumero`, `SectionsTable.vue`, `BenfordPanel.vue`, `BiometriaView.vue`, `UfPanel.vue`, `SecaoView.vue`, `components.test.js`, `MapTable.vue`, `formatarPercentual`, `EncerramentoView.vue`, `MapaView.vue`, `ConsistenciaPanel.vue`, `PainelView.vue`, `RelatorioView.vue`, `StateBlock.vue`, `EstatisticaPanel.vue`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _607 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._