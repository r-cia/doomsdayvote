# Plano atual — abas, barra de comando fixa e menos densidade

## Problema

Painel, Mapa e Análise são âncoras de uma única página: tudo carrega junto e a leitura fica densa. A barra de comando (cargo, ano, turno, candidato, corte, UF) rola para fora da tela, então o recorte some de vista.

## Desenho

1. **Abas de verdade.** Três rotas: `/painel`, `/mapa` e `/analise`. A navegação passa a usar `RouterLink` com `router-link-active`, sem hash. `/auditoria` continua redirecionando para `/painel`.
2. **Barra de comando fixa.** `FilterBar` sai do `PainelView` e vai para o shell (`App.vue`), logo abaixo da faixa. Fica `position: sticky; top: 46px` (altura da faixa), com fundo opaco, fio inferior e sombra suave — visível em qualquer rolagem, em todas as abas e no extrato da seção.
3. **Conteúdo por aba.**
   - **Painel:** KPIs, plot do dia, placar do ranking e biometria do recorte.
   - **Mapa:** mapa, painel da UF e tabela de seções.
   - **Análise:** Benford, Benford por nível, duplicação e proximidade, isolamento e LOF.
4. **Carga sob demanda.** Cada aba cria só as consultas que usa: o Mapa não busca Benford nem outliers; a Análise não busca timeline; o Painel não busca mapa nem seções. O estado do recorte continua no store, então trocar de aba preserva filtros e não refaz o que já está em cache.
5. **Anomalias sem IntersectionObserver.** Na aba Análise a seção já é o conteúdo: a consulta dispara na abertura da aba.

## Arquivos

- `src/App.vue` — faixa com abas + `FilterBar` no shell; estados de carregamento/erro das eleições saem do `PainelView` para o shell.
- `src/views/PainelView.vue` — só KPIs, plot, placar e biometria.
- `src/views/MapaView.vue` — novo, mapa + UF + seções.
- `src/views/AnaliseView.vue` — novo, as quatro leituras de análise.
- `src/router.js` — rotas `/mapa` e `/analise`; `scrollBehavior` para o topo.
- `src/styles.css` — `.comando` fixo com sombra, ajuste de `scroll-margin` e do padding da sala.
- `tests/components.test.js` — segue cobrindo `FilterBar` e `MapPanel`; sem teste novo de view.

## Fora de escopo

- Reordenar os campos da barra de comando.
- Mudar o conteúdo dos painéis.
- Alterar a API.

## Estado

Implementado: três rotas (`/painel`, `/mapa`, `/analise`), `FilterBar` no shell dentro de `.topo` fixo, conteúdo separado por aba e cada aba criando só as consultas que usa. Em 760px a barra de comando rola na horizontal e continua fixa.

Validação: build ok e 33 testes de componente passando. Sem servidor no ar, a conferência visual fica com você.

---

# Plano — Performance de banco e cache Redis

## Diagnóstico atual

- Endpoints pesados (`/api/analysis`, `/api/anomalies`, `/api/estatisticas`, `/api/map`) agregam sobre `boletim_versao` × `resultado_votavel` (499k seções, ~1.16M boletins). Latência vem de scan completo + hash join + serialização de payload grande.
- Índices existentes ajudam em filtros seletivos (UF, município, seção) mas **não** em agregados totais (planner escolhe Seq Scan).
- `metadadosCorte` e `avisosCorte` fazem scan completo a cada request (já paralelizados, mas não cacheados).
- `baseSecaoCandidato` carrega **todas** as linhas em memória para anomalies (features, IF, LOF) — gargalo de CPU e RAM.
- Redis: cache de resposta inteira (TTL 60–600s) com invalidação por versão; orfãs expiram pelo TTL. Sem cache de sub-consultas (`metadadosCorte`).

## Objetivo

Reduzir latência dos endpoints pesados em ≥ 5×, sem alterar contratos de API.

## Fases

### Fase 1 — Materialized views (maior ganho)
1. Criar MV `mv_resumo_turno (eleicao_id, cargo, corte_bucket, ...)` com agregados de `somarVotos`/`somarMetricasSecao`.
2. Criar MV `mv_totais_area (eleicao_id, cargo, nivel, sg_uf/cd_municipio, candidato, qt_votos)` para `/api/map`.
3. Refresh via `carregar-pasta.js` (REFRESH MATERIALIZED VIEW CONCURRENTLY) após carga.
4. Rotas leem da MV quando `corte = final`; para corte temporal, fallback para query filtrada (ou bucket por hora).

### Fase 2 — Cache de sub-consultas
1. Cachear `metadadosCorte` e `avisosCorte` no Redis por `(eleicao, cargo, corte, escopo)` (TTL 300s).
2. Cachear resultado de `baseSecaoCandidato` quando o recorte não mudou (hash dos params).
3. Usar `cache.obter` existente; chave `dv:v{versao}:meta:{hash}`.

### Fase 3 — Redução de volume em memória
1. Mover cálculo de features/IF/LOF para SQL (agregação por seção no DB), retornando apenas as 2000 seções amostradas.
2. Usar `TABLESAMPLE` ou `ORDER BY random()` limitado para amostra LOF.
3. Evitar `selectAll()` em `buscarEleicao` (campos mínimos).

### Fase 4 — Tuning de infraestrutura (32 GB)
1. Postgres: `shared_buffers=8GB`, `effective_cache_size=24GB`, `work_mem=256MB`, `maintenance_work_mem=2GB`, `random_page_cost=1.1`.
2. Redis: `maxmemory 8gb`, `maxmemory-policy allkeys-lru`, desativar RDB se cache puro.
3. OS: `vm.swappiness=10`, `transparent_hugepage=never`.

## Arquivos afetados

- `src/migrations/0005_materialized_views.js` (novo)
- `src/modules/apuracao/totais.js`, `estatisticas.js`, `corte.js`
- `src/routes/index.js` (leitura de MV + cache de sub-consultas)
- `src/scripts/carregar-pasta.js` (refresh de MV)
- `src/db/index.js` (já ajustado)

## Fora de escopo

- Mudança de contratos de API.
- Paginação de anomalias (mantém top 20).

## Critérios de aceite

- `/api/analysis` e `/api/anomalies` < 2s em carga fria, < 200ms em cache hit.
- Sem regressão nos testes de integração.
- MVs atualizadas automaticamente após `carregar-pasta.js`.
