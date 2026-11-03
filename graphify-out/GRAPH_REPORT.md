# Graph Report - doomsdayvote  (2026-11-03)

## Corpus Check
- 288 files · ~228,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1986 nodes · 4184 edges · 124 communities (98 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ae90b313`
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
- loadWorkerEnv
- EncerramentoView.vue
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- EntreAnosView.vue
- ConsistenciaPanel.vue
- validacoes.js
- benford.js
- integration/ordenacao.test.js
- RelatorioView.vue
- API de leitura
- AnaliseView.vue
- outliers.js
- apuracao.js
- SectionsTable.vue
- StateBlock.vue
- Entre anos
- UfPanel.vue
- analise.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- BenfordFaixa.vue
- versoes-bu.js
- bu.js
- totalizacao.js
- useSelecaoEleicao
- scripts/carregar-pasta.js
- i18n-codigos-api.test.js
- lote.test.js
- corte.js
- PlacarRanking.vue
- useFiltersStore
- log.js
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
- carga.js
- routes/relatorio.js
- aplicarFiltroCorte
- partido-cor.test.js
- i18n-chaves.test.js
- entre-anos.js
- components.test.js
- i18n-texto-fixo.test.js
- 0011_sg_partido_2014.js
- conferencia-bweb.test.js
- routes/index.js
- mv-secao-candidato.test.js
- rdv.test.js
- migracoes.js
- consistencia.js
- caminhoFixture
- Benford
- Internacionalização (i18n)
- benford-faixa.test.js
- 0014_mv_secao_candidato_corte.js
- metricas.js
- DivergenciasPanel.vue
- status-carga.js
- totalizacao-carga.test.js
- TotalizacaoView.vue
- env.js
- geo-carregar.js
- status.js
- totalizacao-carregar.js
- Mapa
- RedisFalso
- Linha do tempo
- Acessibilidade
- AnaliseCobertura.vue
- integration/comparacao-local.test.js
- FilterBar.vue

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 47 edges
2. `criarDb()` - 46 edges
3. `useOrdenacao()` - 41 edges
4. `formatarNumero()` - 40 edges
5. `caminhoFixture()` - 37 edges
6. `aplicarFiltroCorte()` - 30 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `limparBanco()` - 25 edges
10. `useSelecaoEleicao()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `padronizarRobusto()` --indirect_call--> `mediana()`  [INFERRED]
  backend/src/modules/analise/outliers.js → backend/src/modules/analise/estatistica-basica.js
- `escreverEmbaralhado()` --indirect_call--> `base()`  [INFERRED]
  backend/tests/integration/importacao-fora-de-ordem.test.js → backend/tests/helpers/cortes-por-tabelas.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalGrupo.vue → frontend/src/lib/format.js

## Import Cycles
- None detected.

## Communities (124 total, 8 thin omitted)

### Community 0 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (15): analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios, erroSecoes, municipios, municipioSelecionado, ordemMunicipios (+7 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (44): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), detectarLeiaute(), detectarLeiauteDeCampos() (+36 more)

### Community 2 - "scripts"
Cohesion: 0.04
Nodes (44): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+36 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.08
Nodes (45): ajustarVisao(), anuncioTeclado, aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas (+37 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.07
Nodes (27): motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar(), habilitado (+19 more)

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
Cohesion: 0.14
Nodes (23): alinhar(), compararAnos(), formatarTurno(), paresDeAnos(), turnoDoAno(), candidatosDoTurno(), CARGO_PRESIDENTE, eleicoesPresidente() (+15 more)

### Community 12 - "CurvasAnos.vue"
Cohesion: 0.13
Nodes (22): caminhoDe(), dentroDoDominio(), desenhavel(), dominioY, figura, formatarY(), horaDe(), largura (+14 more)

### Community 13 - "criarDb"
Cohesion: 0.12
Nodes (17): criarDb(), contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+9 more)

### Community 14 - "queries.js"
Cohesion: 0.27
Nodes (21): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), recorteValido(), useAnalise(), useAnomalias(), useComparacaoAnos() (+13 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (15): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+7 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.10
Nodes (17): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+9 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.05
Nodes (42): Agregação (`eb57e395`), Ajustes dos gráficos (2026-10-31), API (`cd95bcdf`), Contexto, Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31) (+34 more)

### Community 18 - "loadWorkerEnv"
Cohesion: 0.18
Nodes (8): loadWorkerEnv(), db, env, main(), cores, db, env, ambienteValido

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
Cohesion: 0.19
Nodes (13): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), normalizar() (+5 more)

### Community 26 - "benford.js"
Cohesion: 0.28
Nodes (10): calcularBenford(), classificarMad(), DIGITOS, distribuicaoMonteCarlo(), distribuicoesMonteCarlo, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito() (+2 more)

### Community 27 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 28 - "RelatorioView.vue"
Cohesion: 0.07
Nodes (27): candidatos, mad(), props, pValor(), formatarMad(), { alternar, ariaSort, seta, params }, blocos, escopo (+19 more)

### Community 29 - "API de leitura"
Cohesion: 0.09
Nodes (21): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+13 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (13): analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, divergenciasQuery, fonteDivergencias, ordemConsistencia, ordemMargem (+5 more)

### Community 31 - "outliers.js"
Cohesion: 0.24
Nodes (15): featuresDasSecoes(), amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest() (+7 more)

### Community 32 - "apuracao.js"
Cohesion: 0.19
Nodes (16): aplicarEscopo(), corteResposta(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base(), CODIGO_IBGE_UF, codigoIbgeUf() (+8 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.15
Nodes (15): alternar(), contexto, emit, horario(), irPara(), irParaUltima(), itens, pagina (+7 more)

### Community 34 - "StateBlock.vue"
Cohesion: 0.14
Nodes (11): emit, ativo, candidatos, dadosDoNivel, emit, minimo, NIVEIS, nivelAtivo (+3 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.12
Nodes (25): concentracao(), COLUNAS_CONSISTENCIA, base(), candidatosPelaMv(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base() (+17 more)

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
Cohesion: 0.15
Nodes (43): BerError, CLASSE, CODIGO_ERRO_BER, ehContexto(), ehUniversal(), exigirContexto(), exigirUniversal(), filhos() (+35 more)

### Community 43 - "totalizacao.js"
Cohesion: 0.10
Nodes (27): agregarMetricas(), escopoDoRecorte(), filtroDoRecorte(), filtroLoteVigente(), FILTROS_OPCIONAIS, aplicarLocalidade(), baseDivergencias(), baseIncidentes() (+19 more)

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.29
Nodes (6): useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara()

### Community 46 - "scripts/carregar-pasta.js"
Cohesion: 0.18
Nodes (7): criarDependencias(), atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, criarCache(), criarLogger(), main(), params

### Community 47 - "i18n-codigos-api.test.js"
Cohesion: 0.24
Nodes (10): api, ApiError, montarQuery(), obter(), mensagemErroApi(), NAO_ENCONTRADO, arquivos(), BACKEND (+2 more)

### Community 48 - "lote.test.js"
Cohesion: 0.24
Nodes (7): carimbo(), carregarPasta(), gerarRelatorioLote(), copiaAlterada(), db, fixture, juntar()

### Community 49 - "corte.js"
Cohesion: 0.28
Nodes (9): validar(), avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), resolverCorte() (+1 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.24
Nodes (9): validos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios (+1 more)

### Community 52 - "useFiltersStore"
Cohesion: 0.26
Nodes (11): useEleicoes(), deInputSaoPaulo(), formatarCargo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS (+3 more)

### Community 53 - "log.js"
Cohesion: 0.12
Nodes (22): conferirBuLog(), contar(), instanteBu(), primeiroInstante(), CLASSIFICADORES, classificar(), criarEvento(), extrairLogd() (+14 more)

### Community 55 - "importarArquivo"
Cohesion: 0.26
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), criarValidador() (+5 more)

### Community 56 - "Tabelas"
Cohesion: 0.22
Nodes (8): Blocos de resumo, Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Larguras, Recarga, Tabelas, Valor nulo

### Community 58 - "useOrdenacao"
Cohesion: 0.08
Nodes (22): agregado, agrupar, agruparRegiao, base, CODIGOS_REGIAO, emit, props, REGIAO (+14 more)

### Community 59 - "PainelView.vue"
Cohesion: 0.11
Nodes (19): candidatos, {
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
}, resumoQuery, candidatos, useResumo(), candidatosNominais(), candidatos, analiseQuery (+11 more)

### Community 61 - "estilo-classes.test.js"
Cohesion: 0.15
Nodes (11): arquivos, classesDefinidas, css, elementos(), ESTRUTURAIS, LISTAS, LISTAS_SEM_CLASSE_PERMITIDAS, PERMITIDAS (+3 more)

### Community 62 - "format.js"
Cohesion: 0.14
Nodes (17): participacao, percentualDoCandidato, props, votosDoCandidato, recebimento(), definirLocale(), i18n, SUPORTADOS (+9 more)

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
Cohesion: 0.15
Nodes (25): AppError, metadadosCorte(), buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes() (+17 more)

### Community 82 - "lib.test.js"
Cohesion: 0.25
Nodes (14): indiceAreas, areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos() (+6 more)

### Community 83 - "0012_sg_partido_2014_exterior.js"
Cohesion: 0.70
Nodes (4): atualizarViews(), down(), preencherSiglaExterior(), up()

### Community 84 - "carga.js"
Cohesion: 0.15
Nodes (23): agrupar(), CAMINHO_MUNICIPIOS, carregarMunicipios(), carregarSecoesDoLote(), carregarZip(), contarSecoesComErro(), derivarOrigem(), finalizarLote() (+15 more)

### Community 85 - "routes/relatorio.js"
Cohesion: 0.31
Nodes (9): agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO, escopoDe(), TTL_CACHE_ESTATICO, colunasRelatorio(), diferencaPct() (+1 more)

### Community 86 - "aplicarFiltroCorte"
Cohesion: 0.16
Nodes (25): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+17 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "i18n-chaves.test.js"
Cohesion: 0.20
Nodes (6): chavesPt, GRUPOS, LOCALES, prefixos, RAIZ, usadas

### Community 90 - "entre-anos.js"
Cohesion: 0.33
Nodes (10): diferenca(), diferencasEntrePares(), DOMINIO_X, larguraRotulo(), margemDireita(), PALETA_CANDIDATOS, PALETA_DIFERENCAS, TRACOS_ANOS (+2 more)

### Community 91 - "components.test.js"
Cohesion: 0.08
Nodes (19): biometria, emit, fatias, participacao, props, { t }, biometria, emit (+11 more)

### Community 92 - "i18n-texto-fixo.test.js"
Cohesion: 0.32
Nodes (6): achados(), ATRIBUTOS_TEXTO, PERMITIDOS, RAIZ, template(), temTextoVisivel()

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.52
Nodes (6): down(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews(), recriarVotosFinal(), up()

### Community 94 - "conferencia-bweb.test.js"
Cohesion: 0.13
Nodes (16): conferirBuBweb(), divergenciasDeVotos(), divergenciaDeAusencia(), linha(), listarDivergencias(), registrarDivergencias(), bu, conferir() (+8 more)

### Community 95 - "routes/index.js"
Cohesion: 0.11
Nodes (24): buildApp(), detalhesFastify(), detalhesZod(), migracoesPendentes(), loadApiEnv(), isProduction(), registrarRotas(), main() (+16 more)

### Community 96 - "mv-secao-candidato.test.js"
Cohesion: 0.07
Nodes (52): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+44 more)

### Community 97 - "rdv.test.js"
Cohesion: 0.13
Nodes (17): acumularVotos(), chaveVoto(), compararVotos(), conferirBuRdv(), votosDoBu(), bu, conferir(), LOCALIZACAO (+9 more)

### Community 98 - "migracoes.js"
Cohesion: 0.18
Nodes (7): DIRETORIO_MIGRACOES, db, diretorio, migrator, db, migrator, TABELAS

### Community 99 - "consistencia.js"
Cohesion: 0.19
Nodes (14): agregadoDeResultados(), ausente(), coberturaDoRecorte(), COLUNAS_BU, COLUNAS_RESULTADOS, consistenciaPorSecao(), consultaBase(), montarItem() (+6 more)

### Community 100 - "caminhoFixture"
Cohesion: 0.13
Nodes (15): atualizarViews(), caminhoFixture(), app, db, importar(), db, importar(), app (+7 more)

### Community 101 - "Benford"
Cohesion: 0.50
Nodes (3): Benford, Candidato e nível, Gráfico

### Community 102 - "Internacionalização (i18n)"
Cohesion: 0.50
Nodes (3): Glossário, Internacionalização (i18n), Regras

### Community 103 - "benford-faixa.test.js"
Cohesion: 0.67
Nodes (3): candidato(), digitos(), faixa

### Community 104 - "0014_mv_secao_candidato_corte.js"
Cohesion: 0.70
Nodes (4): definicao(), down(), trocar(), up()

### Community 105 - "metricas.js"
Cohesion: 0.16
Nodes (17): biometriaPorFaixa(), contarFalhasBiometria(), duracaoEntre(), incidentesDaSessao(), janelasDaSessao(), parearEleitores(), registrarEleitores(), registrarIncidentes() (+9 more)

### Community 106 - "DivergenciasPanel.vue"
Cohesion: 0.12
Nodes (18): emit, FONTES, irPara(), itens, pagina, props, total, totalPaginas (+10 more)

### Community 107 - "status-carga.js"
Cohesion: 0.20
Nodes (15): loadStatusEnv(), coletarStatus(), detalharLote(), duracao(), DURACAO_MS, formatarLote(), formatarStatus(), instante() (+7 more)

### Community 108 - "totalizacao-carga.test.js"
Cohesion: 0.16
Nodes (9): carregarVariante(), criar7z(), criarZip(), db, escreverZip(), executar, fixtures, SETE_ZIP (+1 more)

### Community 109 - "TotalizacaoView.vue"
Cohesion: 0.16
Nodes (11): useComparacaoLocal(), queryClient, router, comparacaoLocalQuery, ordenacao, { store }, { filtros }, incidentesQuery (+3 more)

### Community 110 - "env.js"
Cohesion: 0.18
Nodes (12): apiSchema, booleanEnv, carregar(), databaseEnv, loadMigrateEnv(), logLevel, migrateSchema, nodeEnv (+4 more)

### Community 111 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 112 - "status.js"
Cohesion: 0.22
Nodes (9): lista, props, avisoInfo(), avisoMensagem(), AVISOS, MENSAGEM_POR_TEXTO, MOTIVOS, STATUS_KEYS (+1 more)

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

### Community 118 - "AnaliseCobertura.vue"
Cohesion: 0.33
Nodes (5): campos, camposAusentes, camposNaoInformados, props, { t }

### Community 119 - "integration/comparacao-local.test.js"
Cohesion: 0.50
Nodes (4): app, contar(), db, importar()

### Community 120 - "FilterBar.vue"
Cohesion: 0.40
Nodes (4): emit, municipioAtivo, props, UFS

## Knowledge Gaps
- **750 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+745 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 939 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `loadWorkerEnv`, `integration/ordenacao.test.js`, `apuracao.js`, `totalizacao.js`, `scripts/carregar-pasta.js`, `lote.test.js`, `importarArquivo`, `status-secao.test.js`, `partido-cor.test.js`, `conferencia-bweb.test.js`, `routes/index.js`, `mv-secao-candidato.test.js`, `caminhoFixture`, `metricas.js`, `status-carga.js`, `totalizacao-carga.test.js`, `geo-carregar.js`, `totalizacao-carregar.js`, `integration/comparacao-local.test.js`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaView.vue`, `SectionsTable.vue`, `StateBlock.vue`, `MapPanel.vue`, `UfPanel.vue`, `SecaoView.vue`, `CurvasAnos.vue`, `MapTable.vue`, `formatarPercentual`, `PlacarRanking.vue`, `EncerramentoView.vue`, `lib.test.js`, `AnaliseCobertura.vue`, `ConsistenciaPanel.vue`, `useOrdenacao`, `components.test.js`, `RelatorioView.vue`, `format.js`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `resolverCorte()` connect `corte.js` to `apuracao.js`, `caminhoFixture`, `analise.js`, `routes/secoes.js`, `routes/relatorio.js`, `aplicarFiltroCorte`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _750 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BiometriaView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._