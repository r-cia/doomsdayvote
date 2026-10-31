# Plano — Decisões da rodada de perguntas + arquitetura e performance

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
