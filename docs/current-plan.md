# Plano — Decisões da rodada de perguntas + arquitetura e performance

## Plano — calibração Monte Carlo de Benford (2026-11-01)

- Hipótese nula: primeiros dígitos independentes com probabilidades Benford, condicionado ao n observado.
- Estatística: MAD de Nigrini; 10.000 simulações determinísticas por n e p empírico `(1 + simulações com MAD >= observado) / 10.001`.
- Calcular para Benford por candidato e para níveis seção, zona e município; não corrigir múltiplas comparações e identificar p-valores como exploratórios.
- Mostrar a calibração nos painéis Benford; manter MAD e contratos existentes.
- Testar cálculo e documentar contrato/método em API, blueprint e arquitetura.

## Decisões do usuário (2026-10-31)
| Card | Decisão |
|---|---|
| `a6e3` Timeline | Respeitar o corte: a curva para no instante/data do filtro. |
| `2c76` Encerramento | Manter -03 (Brasília) para todas as UFs e anos. |
| `7287` Relatório | Ordenar por diferença = referência − alvo, com sinal. O top-N continua sendo cortado depois de ordenar todo o conjunto, como já está em `docs/API.md`. |
| `5481` Valor nulo | Travessão (—) em todos os painéis. |
| `2870` Status | A regra fica só em SQL (`statusSql`), usada para filtrar, ordenar e exibir. O ramo `horario_impossivel`/`HORARIOS_INCONSISTENTES` sai. |
| — | `validarRegistros` e `agruparAssinaturas` continuam exportadas. |

## Parte A — Cards já decididos (um commit por card)
1. **`2c76` Encerramento:** registrar a regra em `docs/blueprint.md`: faixas 17:15 e 19:15 em -03 para todas as UFs e anos. Não muda código. Como o card não tem código, o commit é só de documentação.
2. **`2870` Status:**
   - `/api/sections` e `/api/sections/:id` passam a ler o status (e o motivo) calculados em SQL.
   - O SQL precisa devolver também o `motivo` que hoje vem do JS (`TIPO_URNA_AUSENTE`, `PRECISAO_INSUFICIENTE`).
   - `classificarStatusSecao` sai do uso nas rotas. Fica só a montagem dos horários, se ainda for necessária.
   - Remover `HORARIOS_INCONSISTENTES` do i18n e de `lib/status.js`, se existir.
3. **`a6e3` Timeline:**
   - Aplicar o corte nas duas consultas de `/api/timeline` com `aplicarFiltroCorte`.
   - `useTimeline` passa a enviar `as_of` e a incluí-lo na `queryKey`.
   - Atualizar `docs/API.md`.
4. **`7287` Relatório:**
   - `diferenca_participacao` = `participacao_pct` da referência − `participacao_pct` do alvo; `diferenca_abstencao` idem.
   - Nulo quando qualquer um dos lados for nulo.
   - Atualizar `docs/API.md`.
   - Antes de implementar, conferir se a tabela do frontend já calcula e mostra essa diferença, para usar exatamente o mesmo cálculo.
5. **`5481` Valor nulo:**
   - Usar um formatador de `lib/format.js` que devolve "—" para nulo e reutilizá-lo nos painéis (`AnaliseCobertura.vue`, `EstatisticaPanel.vue`, `DuplicacaoPanel.vue` e outros com `numero()` próprio).
   - Atualizar `docs/design-system/` no arquivo do módulo.
   - Muda o que aparece na tela, então as skills de frontend serão aplicadas na ordem `ui-ux-pro-max` → `impeccable` → `frontend-design`.

## Parte B — `916d` Organização das rotas e módulos (proposta para aprovação)
Hoje `backend/src/routes/index.js` tem 1698 linhas e 21 rotas. Proposta:

**Rotas, um arquivo por domínio, registrados por `routes/index.js`:**
| Arquivo | Rotas |
|---|---|
| `routes/comum.js` | `baseSchema`, `corteSchema`, `cacheado`, `buscarEleicao`, `escopoDe`, `escopoDaEleicao`, `metadadosEAvisos`, `tamanhoPagina` |
| `routes/apuracao.js` | `/api/elections`, `/api/summary`, `/api/timeline`, `/api/map` |
| `routes/secoes.js` | `/api/sections`, `/api/sections/:id`, `/api/sections/:id/versions` |
| `routes/analise.js` | `/api/analysis`, `/api/anomalies`, `/api/estatisticas`, `/api/consistencia`, `/api/comparacao-local`, `/api/concentracao` |
| `routes/biometria.js` | `/api/biometria/municipios`, `/api/biometria/secoes` |
| `routes/encerramento.js` | `/api/encerramento/urnas`, `/municipios`, `/secoes` |
| `routes/relatorio.js` | `/api/relatorio` |

**SQL e agregações saem das rotas para `modules/`:**
| Novo módulo | Conteúdo |
|---|---|
| `modules/apuracao/secoes.js` | consultas de lista, detalhe e versões de seção; `statusSql` |
| `modules/apuracao/timeline.js` | consultas da linha do tempo e acumulação |
| `modules/apuracao/totais.js` (existente) | delta entre cortes do mapa |
| `modules/analise/biometria.js` | consultas por município e seção |
| `modules/analise/encerramento.js` | consultas de urnas/municípios/seções e `resumoPartidoVencedor` |
| `modules/analise/relatorio.js` | agregados do relatório e métricas |
| `modules/analise/outliers.js` (existente) | ranking e vencedor por município de `/api/anomalies` |

As constantes `COLUNAS_*` ficam junto da rota que as usa. Os contratos de API não mudam. Validação: testes unitários e de integração, `docs/architecture.md` atualizado.

## Parte C — `a620` Paginação no banco e flags de heap/stack (medir antes de decidir)
1. **Medição, somente leitura:**
   - Subir o backend com `npm run dev`, sem `REDIS_URL` (cache off).
   - Medir com `curl -w %{time_total}` e o RSS do processo as rotas `/api/anomalies`, `/api/consistencia`, `/api/comparacao-local`, `/api/concentracao`, `/api/encerramento/municipios` e `/api/encerramento/secoes` (ordenação por partido).
   - Escopo nacional e uma UF grande, na maior eleição carregada.
2. **Flags:** repetir a medição com o padrão do Node (sem `--max-old-space-size` e sem `--stack-size`) para ver se ainda há estouro.
3. **Decisão:** apresentar a tabela de tempos e memória. Paginar no banco e mudar as flags só com a sua aprovação.

## Decisões de execução (2026-10-31)
- Ordem: A → C (só medição) → B.
- Parte B aprovada em 2 commits: (1) separar `routes/index.js` por domínio sem mudar lógica; (2) mover o SQL para `modules/`.
- Parte C: apresentar a tabela de tempo e memória; a decisão de paginar e de mudar flags é tomada rota a rota pelo usuário.
- Sem `TEST_DATABASE_URL`: validação só por testes unitários. O risco fica registrado no summary dos cards com SQL (Parte A 2–4 e Parte B).

## Parte C — Resultado da medição e decisões (2026-10-31)
- Medição em 2022 1º turno, cargo 1, sem cache:
  - No escopo nacional, `anomalies`, `comparacao-local` e `concentracao` são canceladas pelo `statement_timeout` (180 s); `consistencia` leva 117 s.
  - Em SP, sem as flags: pico de 1,6 GB e nenhum estouro.
- Causa:
  - O planner estima 1.168 boletins onde existem 466.203 e usa nested loop com 466 mil buscas no índice de `resultado_votavel`.
  - `mv_secao_candidato_final` responde ao escopo nacional em 0,36 s, mas só `estatisticas.js` a usa.
- Decisões:
  - **Flags:** removidas de `dev`/`start` e mantidas em `carga`.
  - **C1 — MV no corte final:** uma migration recria `mv_secao_candidato_final` com `nr_local_votacao` e os votos válidos (nominal + legenda) por seção. `concentracao`, `comparacao-local` e `duplicacaoPorAssinatura` passam a ler a MV no corte final; os cortes parciais continuam nas tabelas.
  - **C2 — Estatísticas estendidas:** uma migration cria `CREATE STATISTICS` em `boletim_versao` e roda `ANALYZE`. O EXPLAIN do corte parcial é comparado antes e depois; se o plano não melhorar, a migration é revertida.
  - **C3 — Postgres:** apenas recomendar valores ao usuário, sem mudança no repositório.
  - **C4 — `comparacao-local` (14 MB em SP):**
    - A lista de grupos passa a trazer só o resumo de cada grupo.
    - As seções de um grupo vêm de uma nova chamada quando o usuário expande o grupo. Hoje a UI mostra todas as seções sempre (`ComparacaoLocalPanel.vue:86`), então passa a ter grupos recolhidos.
    - As skills de frontend serão aplicadas.
- Validação: testes unitários e de integração (`TEST_DATABASE_URL` em `backend/.env`) e nova medição do escopo nacional depois de C1 e C2.

## Execução e validação
- Ordem: Parte A (cards 1→5), medição da Parte C, C1 → C2 → C4 e depois a Parte B. A implementação da Parte C só após a nova aprovação.
- Implementação feita por 1 subagente Sonnet. Fluxo no board por card: claim → start → Build → Integration & QA → commit → complete.
- `npm test` no backend e no frontend a cada card. Os testes de integração precisam de `TEST_DATABASE_URL`, que não está definida: ou você define, ou os cards 2, 3, 4 e a Parte B ficam validados só por testes unitários.
- `graphify update .` ao final e push no fim.
- O limite de 30 chamadas de ferramenta será ultrapassado pelo volume (7 cards e a medição).

## Correção — refresh das views na carga (2026-10-31)

- Causa: o refresh das views materializadas na carga rodava com `doomsday_app`; `REFRESH MATERIALIZED VIEW` exige o dono (`doomsday_owner`).
- Mudanças:
  1. `backend/src/env.js`: `DATABASE_MIGRATION_URL` obrigatória no `workerSchema`.
  2. `backend/src/scripts/carregar-pasta.js`: o `cliente` (lock e refresh) conecta com `DATABASE_MIGRATION_URL`; o `db` da importação segue com `DATABASE_URL`.
  3. `backend/.env.example`: seção do worker indica que `DATABASE_MIGRATION_URL` também é exigida.
  4. `docs/architecture.md`: refresh ao fim da carga roda com o papel dono.
- Validação: `npm test`, `npm run test:integration`.
- Passo final: rodar `npm run carga` para atualizar as views (autorizado pelo usuário, executado pelo orquestrador).

## Plano — Aba "Entre anos" (comparação entre eleições) (2026-10-31)

### Decisões do usuário
| Tema | Decisão |
|---|---|
| Seleção | O usuário seleciona dois ou mais anos. |
| Candidatos | Em cada ano: os dois mais votados no 1º turno e o vencedor da eleição. |
| Cargo/escopo | Só Presidente. Brasil, com filtro opcional de UF. |
| Eixo do crescimento | Ao longo da apuração, pelo horário de **encerramento** do BU em todos os anos. 2014 fica indisponível porque não tem horário. |
| Curvas comparadas | (a) votos por intervalo, sem acumular; (b) % acumulada do candidato nos votos válidos ao longo do tempo. |
| Intervalo | 5 min. Eixo: horário de encerramento em -03 no dia do pleito. |
| Semelhança | Correlação de Pearson entre as curvas de cada par de anos. |
| Probabilidade | Só a "chance de ser acaso": p-valor por permutação em blocos. Não haverá "chance de dados manipulados". |
| Padrões e suspeita | Só mostrar as métricas. Nada é marcado como suspeito e não há limites. |
| Aba | Nova aba "Entre anos". A aba "Comparações" atual (comparação local) continua como está. |

### Decisões da segunda rodada
| Tema | Decisão |
|---|---|
| Pareamento | Por posição. 1º turno: 1º colocado com 1º, 2º com 2º. 2º turno: vencedor com vencedor, derrotado com derrotado. |
| Intervalos | A correlação usa só os intervalos de 5 min que têm dados nos dois anos (interseção). |
| Permutação | Blocos de 6 intervalos (30 min) e 10.000 permutações. |
| Corte `as_of` | A aba ignora o corte e usa sempre a apuração completa. |
| 2014 | Aparece na seleção, mas desabilitado. |
| Vencedor | É exibido e define o pareamento do 2º turno. Nenhum cálculo extra. |
| BUs sem `dt_encerramento` | Ficam fora das curvas. A % acumulada usa só os BUs com encerramento. `dt_encerramento` tem hora completa em 2018, 2022 e 2026. |

### Implementação proposta
**Backend**
- `backend/src/modules/comparacao-anos/`:
  - `curvas.js`: SQL por eleição com `date_bin('5 minutes', bv.dt_encerramento)` no horário do dia em -03, votos nominais por candidato e válidos por intervalo. Filtros: Presidente, `ativo`, `cd_tipo_urna = 1` e UF opcional.
  - `estatistica.js`: funções puras para Pearson e para o p-valor por permutação em blocos, com RNG semeado para que o resultado seja reprodutível e possa ir para o cache.
  - Seleção dos candidatos: os 2 mais votados no 1º turno, a partir de `mv_votos_final`, e o vencedor do 2º turno.
- `backend/src/routes/comparacao-anos.js`: `GET /api/comparacao-anos?anos=2018,2022[&uf=XX]` via `cacheado`. Resposta:
  - candidatos por ano;
  - curvas (a) e (b) do 1º e do 2º turno;
  - matriz de pares de anos com `r` e `p_valor` para cada curva e turno;
  - avisos para ano sem horário (2014).
- Testes unitários de `estatistica.js`, com valores conhecidos de Pearson e uma permutação determinística com semente fixa.
- Teste de integração da rota com fixtures existentes.

**Frontend**
- `EntreAnosView.vue`, rota `/entre-anos` em `router.js`, link em `App.vue` e chave `app.abas.entreAnos` nos 3 locales.
- Seleção de 2 ou mais anos, gráficos das curvas (a) e (b) por turno e tabela da matriz `r`/p-valor.
- Skills em ordem: `ui-ux-pro-max` → `impeccable` → `frontend-design`. Nenhum texto explicativo de método na UI.

**Documentação**
- `docs/API.md`: nova rota.
- `docs/blueprint.md`: regras acima.
- `docs/architecture.md`: novo módulo.
- `docs/design-system/entre-anos.md`.

**Fluxo**
- Implementação pelo subagente Sonnet.
- Validação com `npm test` no backend e no frontend e com `npm run test:integration`.
- `graphify update .`, um commit por etapa (backend, frontend, docs) e push no fim.

### Ajustes dos gráficos (2026-10-31)
1. Os gráficos ficam em duas abas dentro da tela, "1º Turno" e "2º Turno"; só os do turno selecionado aparecem.
2. "Votos por intervalo" usa eixo Y logarítmico, com marcas em potências de 10 e rótulos sem corte; intervalos com 0 voto ficam como lacuna. "% acumulada" segue linear.
3. As curvas dos anos continuam sobrepostas, com gráficos de diferença abaixo, uma linha por par de anos ("A − B"), só nos intervalos presentes nos dois anos, em escala linear com linha de zero: sob votos por intervalo, a diferença em votos e a diferença em pontos percentuais do % do total do ano; sob % acumulada, a diferença em pontos percentuais.
4. O pareamento continua por posição (1º com 1º e 2º com 2º; vencedor com vencedor e derrotado com derrotado).
5. Cada gráfico (curvas sobrepostas e cada diferença) ocupa uma linha de largura total, empilhados verticalmente.
6. Uma cor por candidato (identificado por `nm_votavel`), constante em todos os gráficos, abas de turno e anos, atribuída de forma determinística pela ordem alfabética dos candidatos da resposta.
7. O mesmo candidato em dois anos no mesmo gráfico mantém a cor e ganha um traço fixo por ano (contínuo, tracejado, pontilhado…), igual em todos os gráficos; o ano aparece na legenda.
8. Os gráficos de diferença usam uma paleta disjunta da dos candidatos, uma cor por par de anos, constante em todos os gráficos de diferença.

## Cores e siglas de partidos 2014/2018 (2026-10-31)
- Causa 1: o leiaute de 2014 não tem `SG_PARTIDO` (só `NR_PARTIDO` e `NM_PARTIDO`, que traz a sigla), então `sg_partido` ficou nulo em 2014 e a cor ficou neutra.
- Causa 2: partidos históricos faltavam em `PALETA_PARTIDOS`.
- Decisão A: o parser de 2014 preenche `sg_partido` com `NM_PARTIDO` (mantendo `nm_partido`); a migração `0011_sg_partido_2014` faz um único UPDATE (`ano_eleicao = 2014 and sg_partido is null and nm_partido is not null`) e atualiza as views materializadas; `down` volta `sg_partido` a nulo em 2014.
- Decisão B: siglas históricas usam a cor existente do sucessor (PMDB→MDB, PR→PL, PRB→REPUBLICANOS, PPS→CIDADANIA, SD→SOLIDARIEDADE, PSDC→DC, PTN e PHS→PODE, PTDOB→AVANTE, PSL→UNIAO, PPL→PCDOB, PTB/PATRIOTA/PATRI/PEN/PRP→PRD); novo PRD em verde escuro `#14532D`.
- Passo final (executado pelo orquestrador): `npm run migrate`.
- Ajuste: o backfill por UPDATE foi substituído por correção na leitura, porque o UPDATE de ~9M linhas no HDD de produção levaria cerca de 30 h. A `0011` agora só recria `mv_votos_final`, `mv_totais_area` e `mv_secao_candidato_final` com `max(coalesce(sg_partido, nm_partido))`, e as consultas da API leem `coalesce(rv.sg_partido, rv.nm_partido)`. Os dados de 2014 já importados mantêm `sg_partido` nulo; a importação nova preenche pelo parser.

## Plano — i18n da aplicação inteira (2026-11-01)

### Decisões do usuário
| Tema | Decisão |
|---|---|
| Textos da API | O frontend traduz avisos e erros pelo `codigo` que a API envia. A `mensagem` da API só aparece quando o código é desconhecido. |
| Formatos | Números, percentuais e datas/horas seguem o idioma selecionado (pt-BR, es-ES, en-US). O fuso continua o mesmo de hoje. |

### Escopo
1. **Auditoria do frontend inteiro:** todo texto visível ao usuário passa a vir do i18n.
   - Inclui templates, `aria-label`, `title`, `placeholder`, props de texto (`titulo`, `descricao`) e textos montados em JS (por exemplo, legendas do mapa, "feições" e mensagens do `ApiError` padrão).
   - Ficam de fora os dados (nomes de candidatos, partidos, municípios e UFs).
2. **Paridade das chaves:** os três locales têm exatamente o mesmo conjunto de chaves.
   - Nenhuma chave usada no código fica faltando e nenhuma chave existe sem uso.
   - Pluralização via vue-i18n onde houver contagem.
3. **Textos da API:**
   - Inventário de todos os `codigo` de avisos e erros que o backend emite.
   - Uma chave i18n por código.
   - `AvisoBanner` e os blocos de erro traduzem pelo código.
   - O backend não muda.
4. **Formatação:** os formatadores de `lib/format.js` (e afins) passam a usar o locale ativo do vue-i18n. Gráficos, eixos e legendas também.
5. **`<html lang>`** acompanha o idioma selecionado.
6. **Teste automatizado de paridade:**
   - mesmas chaves nos 3 locales;
   - toda chave usada no código existe;
   - um teste de varredura que falha se surgir texto fixo nos templates.
7. **Qualidade das traduções:**
   - Revisão de es-ES e en-US com terminologia eleitoral consistente (por exemplo, BU, seção, turno, apuração).
   - Glossário em `docs/design-system/i18n.md`.

### Fluxo
- O Sonnet implementa com a skill `impeccable`.
- Validação com `npm test` no frontend e verificação visual nos 3 idiomas com o app rodando.
- Um commit por etapa e push no fim.

## Plano — cortes parciais pela view materializada (2026-11-01)

### Contexto
Com `as_of` ou `as_of_date`, as análises leem `boletim_versao` + `resultado_votavel`:
- estatísticas descritivas: cerca de 150 s em 2026;
- concentração, comparação local, duplicação e base de anomalias e Benford: carregam seção × votável.

O corte parcial usa os mesmos filtros de `mv_secao_candidato_final`: BU `ativo`, `cd_tipo_urna = 1`, cargo Presidente ou Governador e `qt_votos` não nulo. A única diferença é a condição de horário de recebimento.

Como há uma única versão ativa por seção e cargo, **o corte parcial é um subconjunto de seções inteiras da view**. As colunas calculadas por seção (`validos`, `assinatura`, `votaveis`) continuam corretas.

### Etapas
1. **Migration `0014`: view com os campos do corte, sem travar leituras.**
   - Cria `mv_secao_candidato_final_v3`, com a definição atual mais `precisao_dt_bu_recebido` e `dt_bu_recebido_data` (`dt_bu_recebido_ts` já existe).
   - Índices: os atuais e mais `(eleicao_id, cargo, dt_bu_recebido_ts)`.
   - No fim, na mesma migration: `drop` da antiga, `rename` da nova e dos índices, e grant para `doomsday_app`.
   - A leitura só bloqueia no instante da troca. A construção (de 20 a 40 min no disco mecânico) não bloqueia, porque roda sobre um objeto novo.
   - O `down` recria a definição da 0011.
2. **`aplicarCorteMv(qb, corte)` em `modules/apuracao/corte.js`:** a mesma regra de `aplicarFiltroCorte`, mas sobre as colunas da view.
   - **Intradiário:** `precisao = 'DATA_HORA'` e `dt_bu_recebido_ts <= instante`.
   - **Diário:** `DATA_HORA` com a data local (fuso de exibição) `<=` data, ou `DATA` com `dt_bu_recebido_data <= data`.
3. **Leitura pela view em todos os cortes**, removendo o ramo `corte.tipo === 'final'`:
   - `secoesCompactas` (duplicação, concentração, comparação local);
   - `baseSecaoCandidato` (anomalias e Benford);
   - estatísticas descritivas (`descritivas.js`).
   As consultas por tabela dessas análises saem.
4. **Fora do escopo:**
   - consistência, que precisa de campos por BU que a view não tem, e já leva 7 s;
   - resumo, mapa e linha do tempo, que leem `mv_votos_final`/`mv_totais_area` no corte final. Se o corte parcial deles também estiver lento, fica para uma segunda fase com medição antes.
5. **Documentação:**
   - `docs/architecture.md`: corte parcial lido da view;
   - README 14.5: a nova view e o índice;
   - `docs/API.md`: só se algum contrato mudar, e a expectativa é que nenhum mude.

### Verificação
- **Equivalência (integração):** para os cortes intradiário e diário nos fixtures de 2014, 2018 e 2026, a saída pela view deve ser igual à da consulta antiga por tabela. A consulta antiga fica só no teste, para comparação.
- **Suítes:** a suíte completa de integração e a unitária.
- **Banco real:** EXPLAIN ANALYZE de leitura de uma análise com `as_of` em 2026 1T, antes (cerca de 150 s) e depois.
- **Na tela:** Obscura na aba Estatística com corte do dia, depois de `npm run migrate`.

## Plano — métricas da sessão a partir do log.jez (2026-11-02)

Escopo: `c6da533b`, `636cf24e`, `061cd512`, mais a estabilização do `migrate:reset` em `tests/integration/schema.test.js`.

### Módulo
`backend/src/modules/totalizacao/metricas.js`, funções puras sobre a lista de eventos de `parsearLogJez`:

1. `parearEleitores(eventos)` — segmenta a sessão: cada `eleitor_habilitado` fecha o eleitor aberto pelo `identificador_digitado` anterior e é fechado pelo `voto_computado` seguinte. Devolve, por eleitor: `habilitadoEm`, `computadoEm`, `duracaoMs`, `tp_habilitacao`, `qt_falhas_biometria`, `qt_teclas_indevidas`, `correcao`.
2. `tempoDeVoto(eventos)` — sobre os eleitores pareados: quantidade, média, mediana, mais rápido e mais demorado em ms. Inclui eleitores com inatividade de 45 s e com teclas indevidas, como o card exige.
3. `biometriaPorFaixa(eventos)` — conta habilitados após 1, 2, 3 e 4 tentativas falhas e habilitados manualmente. A falha é o evento `Número de tentativas de reconhecimento do dedo` anterior à habilitação; não conta `Solicita digital`/`Capturada a digital`, que são passos normais.
4. `incidentesDaSessao(eventos)` — devolve instante, nível, tipo e texto original de tudo que não é fluxo normal, conforme a regra escolhida pelo usuário.

### Persistência
Nada de migration nova: `totalizacao_eleitor` e `totalizacao_incidente` já existem na `0015`. O pareamento alimenta as duas tabelas na carga (`91631db5`) e as métricas são calculadas na agregação (`eb57e395`).

### Testes
Fixtures reais da seção 0241 em `backend/tests/unit/totalizacao/metricas.test.js`: 192 eleitores pareados, 174 habilitações biométricas, 5 manuais, tempos positivos e mediana entre o mais rápido e o mais demorado; classes de biometria somando 174.

### Estabilização do schema.test.js
O teste `migrate:reset roda duas vezes seguidas` derruba todas as migrations e sobe de novo. Se a suíte for interrompida no meio, o banco de teste fica vazio e todos os arquivos seguintes falham em `limparBanco`. Correção: restaurar o schema em `finally` e mover o arquivo para o fim da ordem de execução, sem mudar o que ele verifica.

### Verificação
`npm test` e `npm run test:integration` no backend; nenhum contrato de API muda nesta etapa.

## Plano — agregação e API da totalização (2026-11-02)

### Agregação (`eb57e395`)
`backend/src/modules/totalizacao/agregacao.js`, uma consulta SQL por escopo, sem carregar seção a seção:

- **Escopos:** seção, município, zona, UF e nacional. O recorte entra por `ano_eleicao`, `nr_turno` e, quando houver, `lote_id`, `sg_uf`, `cd_municipio_tse`, `nr_zona`, `nr_secao`.
- **Tempo de voto:** `avg`, `percentile_cont(0.5)` para mediana, `min` e `max` de `duracao_ms` em `totalizacao_eleitor`, com `count`.
- **Biometria:** somas por faixa a partir de `qt_falhas_biometria` e `tp_habilitacao` (0, 1, 2, 3, 4+ falhas e manual).
- **Incidentes:** contagem em `totalizacao_incidente` agrupada pelo escopo.
- **Complementares:** seções carregadas, aptos, comparecimento, teclas indevidas e correções.
- **Índices:** a agregação usa os índices existentes `(totalizacao_secao_id, habilitado_em)` e `(totalizacao_secao_id, dt_incidente)`; o join com `totalizacao_secao` filtra pelo lote/recorte antes de agregar.

Critério de teste: a soma das seções de uma UF é igual ao agregado da UF, e a soma das UFs é igual ao nacional, para as três famílias de números.

### API (`cd95bcdf`)
- `GET /api/totalizacao/metricas` — tempo de voto, biometria, incidentes e complementares no escopo pedido.
- `GET /api/totalizacao/incidentes` — lista paginada por seção.
- `GET /api/totalizacao/divergencias` — lista por fonte e escopo, sem filtro que esconda divergência.
- Recorte igual ao das demais rotas (`ano`, `turno`, `uf`, `municipio`, `zona`, `secao`, `lote`), com validação em zod e contrato documentado em `docs/API.md`.

### Pendência de decisão
As conferências rodam na carga desde 2026-11-03. BU×RDV e BU×log sempre; BU×BWEB consulta a apuração pelo ano/turno do lote e pelos cargos 1 e 3, sem escolher `eleicao_id`.

## Plano — resiliência da importação da totalização (2026-11-03)

Origem: a primeira carga real do RR (260 MB, 1.519 seções) morreu inteira na primeira seção por um tipo de voto desconhecido no RDV. A fixture não cobria o caso. O lote só terminou depois da correção, e a carga levou 2 min 36 s. O plano ataca os modos de falha que essa execução expôs.

### Etapa 1 — erro por seção, sem derrubar o lote
- `carga.js`: `try/catch` em volta de `inserirSecao`; a transação daquela seção volta, as anteriores ficam.
- Migration `0017`: tabela `totalizacao_secao_erro` (`lote_id`, `prefixo`, `sg_uf`, `cd_municipio_tse`, `nr_zona`, `nr_secao`, `codigo`, `mensagem`, `registrado_em`), única por `(lote_id, prefixo)`.
- Evento `secao_falhou` por seção, com prefixo e código.
- Status do lote: `concluido` sem erros; `parcial` com erros; `falhou` só quando o arquivo inteiro não abre. `parcial` entra no check de status.
- CLI sai com código diferente de zero quando há seção com erro.

### Etapa 2 — retomar sem reprocessar
- Ao abrir um lote existente (`processando`, `parcial` ou `falhou`), carregar as chaves de seção já gravadas e pular esses prefixos.
- Reprocessar apenas as seções ausentes e as que estão em `totalizacao_secao_erro`.
- Não duplicar divergências nem métricas das seções já concluídas.

### Etapa 3 — dois arquivos para a mesma UF/ano/turno
Hoje a chave única inclui `lote_id`, então um zip novo para a mesma UF cria um segundo conjunto de seções e a agregação soma os dois. Regra proposta:
- novo lote concluído marca o anterior como `substituido` (`substituido_por`), sem apagar dados;
- leituras e agregação usam o lote mais recente por `(ano, turno, uf)`;
- `carga:status` mostra o lote vigente e os substituídos.

### Etapa 4 — integridade do arquivo
- Verificar CRC32 de cada entrada ZIP na extração (`zlib.crc32`); erro vira seção com erro. O `7z` já valida na extração.
- Seção sem `-bu.dat` passa a ser erro registrado, não ignorada em silêncio.
- Manter `-rdv.dat` e `-log.jez` opcionais, com contagem de seções sem cada um.

### Etapa 5 — operação
- `--falhar-rapido` opcional; o padrão passa a ser resiliente.
- `npm run carga:status` passa a listar seções com erro e lotes parciais.
- Sem mudança de memória nesta etapa: o ZIP é lido inteiro (260 MB no RR) e o `7z` extrai sob demanda.

### Etapa 6 — testes
- Integração com um ZIP de duas seções, uma corrompida: lote `parcial`, uma seção gravada, um erro registrado, a carga seguinte processa só a que falhou.
- ZIP com entrada corrompida: CRC detecta e registra.
- Dois lotes para a mesma UF: o antigo vira `substituido` e a agregação conta só o novo.

### Decisões que dependem do usuário
1. Nome do status parcial: `parcial` (proposto) ou manter `falhou` com contagem separada.
2. Substituição: automática pelo lote mais recente (proposto) ou só com `--substituir`.
3. Padrão do worker: resiliente (proposto) ou `--falhar-rapido` como padrão.
