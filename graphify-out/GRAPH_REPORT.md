# Graph Report - doomsdayvote  (2026-11-03)

## Corpus Check
- 273 files · ~196,206 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1973 nodes · 4441 edges · 105 communities (93 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ae7ef2f2`
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
- formatarNumero
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
- dados-sinteticos.js
- db-teste.js
- StateBlock.vue
- API de leitura
- AnaliseView.vue
- outliers.js
- apuracao.js
- SectionsTable.vue
- RelatorioView.vue
- Entre anos
- UfPanel.vue
- analise.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- BenfordFaixa.vue
- versoes-bu.js
- bu.js
- totalizacao.js
- routes/index.js
- useSelecaoEleicao
- scripts/carregar-pasta.js
- status.js
- escreverArquivo
- corte.js
- PlacarRanking.vue
- filters.js
- conferencia-log.test.js
- importarArquivo
- Tabelas
- useOrdenacao
- PainelView.vue
- estilo-classes.test.js
- format.js
- 0001_schema_inicial.js
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
- carga.js
- routes/relatorio.js
- aplicarFiltroCorte
- partido-cor.test.js
- entre-anos.js
- components.test.js
- i18n-texto-fixo.test.js
- conferencia-bweb.js
- registrarRotas
- concentracao.js
- rdv.test.js
- migracoes.js
- consistencia.js
- fixtures.js
- Benford
- Internacionalização (i18n)
- benford-faixa.test.js
- metricas.js
- DivergenciasPanel.vue
- status-carga.js
- totalizacao-carga.test.js
- TotalizacaoView.vue
- geo-carregar.js
- totalizacao-carregar.js
- Mapa
- RedisFalso
- Linha do tempo
- Acessibilidade
- atualizarViews
- FilterBar.vue

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 47 edges
2. `criarDb()` - 44 edges
3. `useOrdenacao()` - 41 edges
4. `formatarNumero()` - 40 edges
5. `escreverArquivo()` - 37 edges
6. `aplicarFiltroCorte()` - 30 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `limparBanco()` - 25 edges
10. `useSelecaoEleicao()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `padronizarRobusto()` --indirect_call--> `mediana()`  [INFERRED]
  backend/src/modules/analise/outliers.js → backend/src/modules/analise/estatistica-basica.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalGrupo.vue → frontend/src/lib/format.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (105 total, 7 thin omitted)

### Community 0 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (15): analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios, erroSecoes, municipios, municipioSelecionado, ordemMunicipios (+7 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.06
Nodes (56): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), TIPOS, detectarLeiaute() (+48 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (43): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.08
Nodes (46): ajustarVisao(), anuncioTeclado, aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas (+38 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.07
Nodes (28): formatarSha(), motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar() (+20 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "formatarNumero"
Cohesion: 0.08
Nodes (27): coberturaEfetiva, entradas, formatarValor(), props, ROTULOS_REGRA, { t, te }, aoIndice(), avisosVisiveis (+19 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.06
Nodes (30): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14.1 Servidor Postgres 16, 14.2 Conexões da aplicação (`backend/src/db/index.js`), 14.3 Índices, 14.4 Estatísticas estendidas (+22 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "comparar.js"
Cohesion: 0.16
Nodes (21): alinhar(), compararAnos(), formatarTurno(), paresDeAnos(), turnoDoAno(), candidatosDoTurno(), CARGO_PRESIDENTE, eleicoesPresidente() (+13 more)

### Community 12 - "CurvasAnos.vue"
Cohesion: 0.13
Nodes (22): caminhoDe(), dentroDoDominio(), desenhavel(), dominioY, figura, formatarY(), horaDe(), largura (+14 more)

### Community 13 - "criarDb"
Cohesion: 0.12
Nodes (11): criarDb(), CENARIO, NOME_2026, db, db, db, app, db (+3 more)

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.14
Nodes (14): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+6 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.10
Nodes (17): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+9 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.05
Nodes (42): Agregação (`eb57e395`), Ajustes dos gráficos (2026-10-31), API (`cd95bcdf`), Contexto, Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31) (+34 more)

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (17): apiSchema, carregar(), databaseEnv, loadApiEnv(), loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+9 more)

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

### Community 23 - "EntreAnosView.vue"
Cohesion: 0.12
Nodes (18): coresDosCandidatos(), coresDosPares(), percentualDoTotal(), coresCandidatos, coresPares, dados, { eleicoesDisponiveis }, escolhido (+10 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 26 - "dados-sinteticos.js"
Cohesion: 0.14
Nodes (31): ALIASES_2018, assinaturaVotavel(), CAMPOS_BWEB_2026, cargoBer(), CARGOS_2014, CARGOS_2018, CARGOS_FORA_DO_ESCOPO, CODIGO_RDV (+23 more)

### Community 27 - "db-teste.js"
Cohesion: 0.11
Nodes (24): campoBweb(), gerarBweb(), gerarBweb2014(), gerarBweb2014Multi(), gerarBweb2018(), linhaDeCampos(), contar(), limparBanco() (+16 more)

### Community 28 - "StateBlock.vue"
Cohesion: 0.07
Nodes (26): emit, candidatos, mad(), props, pValor(), ativo, candidatos, dadosDoNivel (+18 more)

### Community 29 - "API de leitura"
Cohesion: 0.09
Nodes (21): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+13 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (13): analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, divergenciasQuery, fonteDivergencias, ordemConsistencia, ordemMargem (+5 more)

### Community 31 - "outliers.js"
Cohesion: 0.13
Nodes (25): calcularBenford(), classificarMad(), DIGITOS, distribuicaoMonteCarlo(), distribuicoesMonteCarlo, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito() (+17 more)

### Community 32 - "apuracao.js"
Cohesion: 0.15
Nodes (21): ordenacaoSchema(), corteResposta(), resolverCorte(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base(), CODIGO_IBGE_UF (+13 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.16
Nodes (14): alternar(), contexto, emit, horario(), irPara(), irParaUltima(), itens, pagina (+6 more)

### Community 34 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.21
Nodes (11): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+3 more)

### Community 37 - "analise.js"
Cohesion: 0.14
Nodes (20): eleicoesDoAno(), base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato() (+12 more)

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

### Community 42 - "bu.js"
Cohesion: 0.16
Nodes (42): BerError, CLASSE, CODIGO_ERRO_BER, ehContexto(), ehUniversal(), exigirContexto(), exigirUniversal(), filhos() (+34 more)

### Community 43 - "totalizacao.js"
Cohesion: 0.21
Nodes (15): agregarMetricas(), escopoDoRecorte(), filtroDoRecorte(), filtroLoteVigente(), FILTROS_OPCIONAIS, aplicarLocalidade(), baseDivergencias(), baseIncidentes() (+7 more)

### Community 44 - "routes/index.js"
Cohesion: 0.26
Nodes (5): AppError, validar(), comparacaoAnosSchema, registrarComparacaoAnos(), TTL_CACHE_ESTATICO

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 46 - "scripts/carregar-pasta.js"
Cohesion: 0.18
Nodes (7): criarDependencias(), atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, criarCache(), criarLogger(), main(), params

### Community 47 - "status.js"
Cohesion: 0.10
Nodes (22): api, ApiError, montarQuery(), obter(), lista, props, definirLocale(), i18n (+14 more)

### Community 48 - "escreverArquivo"
Cohesion: 0.15
Nodes (10): gerarRelatorioLote(), escreverArquivo(), app, db, importar(), copiaAlterada(), db, juntar() (+2 more)

### Community 49 - "corte.js"
Cohesion: 0.18
Nodes (19): base(), candidatosPelaMv(), estatisticasDaEleicao(), numero(), aplicarCorteMv(), aplicarEscopo(), avisosCorte(), baseEscopo() (+11 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.24
Nodes (9): validos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios (+1 more)

### Community 52 - "filters.js"
Cohesion: 0.29
Nodes (8): deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 53 - "conferencia-log.test.js"
Cohesion: 0.31
Nodes (8): conferirBuLog(), contar(), instanteBu(), primeiroInstante(), bu, conferir(), eventos, LOCALIZACAO

### Community 55 - "importarArquivo"
Cohesion: 0.23
Nodes (12): carimbo(), carregarPasta(), escaparCopy(), importarArquivo(), calcularSha256(), concluirLote(), falharLote(), iniciarLote() (+4 more)

### Community 56 - "Tabelas"
Cohesion: 0.22
Nodes (8): Blocos de resumo, Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Larguras, Recarga, Tabelas, Valor nulo

### Community 58 - "useOrdenacao"
Cohesion: 0.06
Nodes (31): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO (+23 more)

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
Cohesion: 0.13
Nodes (18): campos, camposAusentes, camposNaoInformados, props, { t }, participacao, percentualDoCandidato, props (+10 more)

### Community 63 - "0001_schema_inicial.js"
Cohesion: 0.33
Nodes (11): atualizarViews(), COLUNAS_RESULTADO, definicaoViewCorte(), down(), preencherSiglaExterior(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews() (+3 more)

### Community 75 - "Arquitetura"
Cohesion: 0.25
Nodes (7): Arquitetura, Backend, Carga de totalização, Fluxo de análise, Frontend, Malha geográfica, Observabilidade da carga

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.25
Nodes (7): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Entre anos, Limitações conhecidas, Siglas e cores de partidos, Totalização (BU, RDV e log)

### Community 79 - "status-secao.test.js"
Cohesion: 0.29
Nodes (5): app, db, importar(), itemDaSecao(), itens()

### Community 81 - "routes/secoes.js"
Cohesion: 0.24
Nodes (16): buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql(), statusSql() (+8 more)

### Community 82 - "lib.test.js"
Cohesion: 0.28
Nodes (13): areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), mapaPartidos(), normalizarCodigo() (+5 more)

### Community 84 - "carga.js"
Cohesion: 0.11
Nodes (30): agrupar(), CAMINHO_MUNICIPIOS, carregarSecoesDoLote(), carregarZip(), contarSecoesComErro(), derivarOrigem(), finalizarLote(), reaproveitarLote() (+22 more)

### Community 85 - "routes/relatorio.js"
Cohesion: 0.36
Nodes (8): lerOrdenacao(), agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO, colunasRelatorio(), diferencaPct(), registrarRelatorio()

### Community 86 - "aplicarFiltroCorte"
Cohesion: 0.18
Nodes (20): comparar(), nulo(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao(), DERIVADAS_PARTIDO, ENCERRAMENTO_BU (+12 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.38
Nodes (5): ambiente(), backendDir, db, execFileAsync, semear()

### Community 90 - "entre-anos.js"
Cohesion: 0.33
Nodes (10): diferenca(), diferencasEntrePares(), DOMINIO_X, larguraRotulo(), margemDireita(), PALETA_CANDIDATOS, PALETA_DIFERENCAS, TRACOS_ANOS (+2 more)

### Community 91 - "components.test.js"
Cohesion: 0.08
Nodes (19): biometria, emit, fatias, participacao, props, { t }, biometria, emit (+11 more)

### Community 92 - "i18n-texto-fixo.test.js"
Cohesion: 0.32
Nodes (6): achados(), ATRIBUTOS_TEXTO, PERMITIDOS, RAIZ, template(), temTextoVisivel()

### Community 94 - "conferencia-bweb.js"
Cohesion: 0.21
Nodes (12): CARGOS_TOTALIZACAO, divergenciasBuBweb(), divergenciasDeVotos(), existeBwebDaUf(), filtrarCargos(), divergenciaDeAusencia(), linha(), listarDivergencias() (+4 more)

### Community 95 - "registrarRotas"
Cohesion: 0.17
Nodes (14): buildApp(), detalhesFastify(), detalhesZod(), migracoesPendentes(), isProduction(), registrarRotas(), main(), app (+6 more)

### Community 96 - "concentracao.js"
Cohesion: 0.09
Nodes (44): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+36 more)

### Community 97 - "rdv.test.js"
Cohesion: 0.09
Nodes (23): carregarMunicipios(), inserirSecao(), instanteBu(), conferirBuBweb(), acumularVotos(), chaveVoto(), compararVotos(), conferirBuRdv() (+15 more)

### Community 98 - "migracoes.js"
Cohesion: 0.16
Nodes (9): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, diretorio, migrator, db, migrator (+1 more)

### Community 99 - "consistencia.js"
Cohesion: 0.18
Nodes (15): agregadoDeResultados(), ausente(), coberturaDoRecorte(), COLUNAS_BU, COLUNAS_CONSISTENCIA, COLUNAS_RESULTADOS, consistenciaPorSecao(), consultaBase() (+7 more)

### Community 100 - "fixtures.js"
Cohesion: 0.12
Nodes (19): combinarComCabecalho(), gerarBweb2018Multi(), gerarBwebMulti(), opcoesDeSecoes(), dataBuRecebido(), NOME_2018, secoes2014(), secoes2018() (+11 more)

### Community 101 - "Benford"
Cohesion: 0.50
Nodes (3): Benford, Candidato e nível, Gráfico

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

### Community 103 - "benford-faixa.test.js"
Cohesion: 0.67
Nodes (3): candidato(), digitos(), faixa

### Community 105 - "metricas.js"
Cohesion: 0.18
Nodes (15): biometriaPorFaixa(), contarFalhasBiometria(), duracaoEntre(), incidentesDaSessao(), janelasDaSessao(), parearEleitores(), registrarEleitores(), registrarIncidentes() (+7 more)

### Community 106 - "DivergenciasPanel.vue"
Cohesion: 0.12
Nodes (18): emit, FONTES, irPara(), itens, pagina, props, total, totalPaginas (+10 more)

### Community 107 - "status-carga.js"
Cohesion: 0.20
Nodes (15): loadStatusEnv(), coletarStatus(), detalharLote(), duracao(), DURACAO_MS, formatarLote(), formatarStatus(), instante() (+7 more)

### Community 108 - "totalizacao-carga.test.js"
Cohesion: 0.10
Nodes (21): CODIGO_ERRO_ZIP, gerarLogJez(), gerarZip(), instanteLog(), votosDoCenario(), db, recorte(), recorteDaSecao() (+13 more)

### Community 109 - "TotalizacaoView.vue"
Cohesion: 0.14
Nodes (14): recorteValido(), useTotalizacaoDivergencias(), useTotalizacaoIncidentes(), useTotalizacaoMetricas(), queryClient, router, comparacaoLocalQuery, ordenacao (+6 more)

### Community 111 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 113 - "totalizacao-carregar.js"
Cohesion: 0.38
Nodes (7): loadTotalizacaoEnv(), CAMPOS, linhaDeEvento(), registrarEventoCarga(), lerArgumentos(), main(), segundos()

### Community 114 - "Mapa"
Cohesion: 0.22
Nodes (8): Estados, Estrutura, Interação, Mapa, Modo líder, Modo percentual, Teclado, Tooltip

### Community 116 - "Linha do tempo"
Cohesion: 0.29
Nodes (6): Acessibilidade, Alternância votos/seções, Avisos e vazio, Estrutura, Linha do tempo, Slider

### Community 117 - "Acessibilidade"
Cohesion: 0.33
Nodes (5): Acessibilidade, Contraste, Foco e teclado, Princípios, Rótulos e regiões

### Community 119 - "atualizarViews"
Cohesion: 0.21
Nodes (8): somarVotos(), atualizarViews(), app, db, importar(), db, db, importar()

### Community 120 - "FilterBar.vue"
Cohesion: 0.40
Nodes (4): emit, municipioAtivo, props, UFS

## Knowledge Gaps
- **740 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+735 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 902 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `rdv.test.js`, `fixtures.js`, `metricas.js`, `status-carga.js`, `totalizacao-carga.test.js`, `scripts/carregar-pasta.js`, `geo-carregar.js`, `escreverArquivo`, `totalizacao-carregar.js`, `env.js`, `status-secao.test.js`, `atualizarViews`, `importarArquivo`, `partido-cor.test.js`, `db-teste.js`, `conferencia-bweb.js`, `registrarRotas`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaView.vue`, `SectionsTable.vue`, `RelatorioView.vue`, `MapPanel.vue`, `UfPanel.vue`, `SecaoView.vue`, `CurvasAnos.vue`, `MapTable.vue`, `formatarPercentual`, `PlacarRanking.vue`, `EncerramentoView.vue`, `lib.test.js`, `ConsistenciaPanel.vue`, `useOrdenacao`, `components.test.js`, `StateBlock.vue`, `format.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `BiometriaView.vue`, `SectionsTable.vue`, `RelatorioView.vue`, `UfPanel.vue`, `SecaoView.vue`, `components.test.js`, `TotalizacaoView.vue`, `MapTable.vue`, `formatarPercentual`, `EncerramentoView.vue`, `MapaView.vue`, `ConsistenciaPanel.vue`, `PainelView.vue`, `StateBlock.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _740 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06413730803974707 - nodes in this community are weakly interconnected._