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

# Plano — Performance de banco e lógica de requisições

## Contexto confirmado no código

- O backend usa Fastify, Kysely/Postgres e Redis. As rotas de leitura são agrupadas em `backend/src/routes/index.js`.
- O Redis já armazena respostas completas por parâmetros, agrupa chamadas concorrentes iguais em memória e invalida chaves por versão após carga. Essa camada não reduz o custo de um cache miss.
- A migração `0004_indexes_performance.js` já cria índices parciais para boletins ativos e índices para resultados/localidade.
- A migração `0005_materialized_views.js` já cria e popula `mv_votos_final` e `mv_metricas_final`. O plano de implementação deve primeiro verificar quais rotas realmente leem essas views e se os dados são atualizados após importação.
- O pool Postgres está configurado com até 40 conexões e `work_mem=256MB` por processo/conexão. O custo sob concorrência precisa ser medido antes de aumentar limites ou parâmetros.
- A arquitetura separa painel, mapa e análise, mas o número de requisições simultâneas por tela, o tempo por consulta, os tamanhos de resposta e as taxas de cache hit ainda precisam de uma linha de base reproduzível.

As causas exatas da lentidão não estão comprovadas apenas pela leitura estática. Leituras completas, agregações caras, CPU em JavaScript, serialização, pool saturado e cache miss são hipóteses a discriminar com métricas e planos de execução.

## Objetivo e limites

Reduzir latência e custo de banco nos fluxos mais usados sem alterar resultados, cortes temporais, cobertura ou contratos da API. Priorizar pelo impacto medido em p95/p99 e pelo volume de chamadas. Nenhuma alteração de parâmetros globais, amostragem estatística ou redução de precisão entra sem evidência e validação de equivalência.

## Fase 0 — Linha de base e observabilidade

1. Registrar por rota: requisições por segundo, p50/p95/p99, erros, cache hit/miss/off, bytes de resposta e duração total.
2. Instrumentar duração de cada consulta e de etapas relevantes de lógica/serialização; registrar contagens de linhas lidas e retornadas quando viável, sem incluir dados pessoais ou payloads completos nos logs.
3. Coletar no Postgres `pg_stat_statements` (se disponível), `EXPLAIN (ANALYZE, BUFFERS)` para consultas candidatas em ambiente representativo, estatísticas de locks, conexões e uso de CPU/memória. Não executar análises com escrita de dados.
4. Reproduzir carga realista, incluindo abertura simultânea de Painel, Mapa e Análise e filtros comuns. Separar primeira carga, cache frio, cache quente e concorrência.
5. Produzir uma tabela de endpoints ordenada por contribuição ao tempo total: frequência × latência × bytes e, em separado, consumo de banco/CPU.

**Saída:** linha de base versionada e lista curta dos gargalos confirmados, antes de escolher índices, views ou cache adicional.

## Fase 1 — Reduzir trabalho por requisição

1. Usar a linha de base para revisar quais consultas repetem agregações comuns entre `/api/summary`, `/api/map`, `/api/analysis`, `/api/anomalies` e `/api/estatisticas`.
2. Comparar planos e cardinalidades com os índices existentes. Criar índices apenas para filtros/junções que demonstrem ganho nos planos e nas medições; considerar custo de escrita, espaço e manutenção.
3. Auditar `mv_votos_final` e `mv_metricas_final`: consumidores atuais, compatibilidade com filtros e cobertura, custo de refresh e frescor após carga. Corrigir o caminho de uso/atualização apenas se essa auditoria mostrar lacunas.
4. Para leituras finais frequentes, avaliar agregados pré-computados adicionais apenas quando a consulta e a chave de agregação forem estáveis. Cortes `as_of` e `as_of_date` devem manter semântica exata; não aproximar por bucket sem decisão explícita de produto.
5. Examinar `/api/anomalies` e rotinas que materializam dados no Node. Medir linhas/bytes transferidos e tempo de CPU; projetar colunas necessárias e empurrar agregações para SQL quando houver equivalência demonstrável.
6. Rever seleções amplas (`selectAll`) e consultas N+1 nos caminhos quentes, selecionando colunas e usando junções/lotes quando o plano comprovar benefício.

## Fase 2 — Concorrência, cache e payload

1. Medir quantas queries simultâneas cada tela dispara e se há consultas redundantes entre componentes. Ajustar habilitação sob demanda, deduplicação e stale time no cliente sem perder atualização necessária do corte.
2. Medir pressão do pool, fila e duração de espera. Ajustar `max` do pool e limites de concorrência conforme capacidade do Postgres e número de processos da aplicação; `work_mem` é por operação/conexão e não deve ser elevado isoladamente.
3. Aproveitar o cache de respostas já existente. Medir taxa de hit por rota, misses simultâneos, tamanho serializado e custo de JSON; só acrescentar cache de subconsulta se evitar trabalho repetido que o cache completo não cobre.
4. Rever chaves, TTL e invalidação por versão. Confirmar que importações atualizam os dados pré-computados antes de expor o novo estado e invalidam o cache de forma consistente.
5. Reduzir payload ou paginar somente se clientes e contrato permitirem; medir custo de transferência e serialização antes de alterar respostas.

## Fase 3 — Teste controlado e adoção

1. Para cada mudança, comparar mesma carga e parâmetros com a linha de base: latências p50/p95/p99, throughput, CPU, memória, I/O, conexões e bytes de resposta.
2. Confirmar equivalência de totais, filtros por UF/município, cargos, corte final e temporal, cobertura e ordenação com testes de integração e fixtures representativas.
3. Aplicar uma mudança por vez, com migração reversível quando houver esquema/índice/view, e observar regressões de carga e importação.
4. Definir metas numéricas de aceite após a linha de base. Não fixar agora limites absolutos como `<2s` ou `<200ms` sem SLA e ambiente de referência.

## Fase 4 — Configuração de infraestrutura

Somente após identificar CPU, RAM, I/O e contenção como limites: revisar parâmetros de Postgres (memória, custo de I/O, autovacuum), Redis (memória e política de eviction) e dimensionamento de pool/instâncias. Validar em homologação e registrar configuração e limites operacionais. Não aplicar ajustes de sistema operacional ou valores específicos de máquina com base apenas na capacidade nominal de RAM.

## Fora de escopo nesta etapa

- Alterar contratos ou semântica dos endpoints.
- Aproximar corte temporal ou reduzir a amostra/precisão dos indicadores sem avaliação metodológica e decisão explícita.
- Alterar parâmetros de produção, executar migrações ou modificar dados reais antes de revisar os resultados e aprovar a implementação.

## Próxima decisão

Executar primeiro a Fase 0 em ambiente representativo e revisar a tabela de gargalos. A ordem e o conteúdo das fases seguintes dependem dessa evidência; as views existentes e o plano de cache devem ser auditados antes de propor novos objetos ou camadas.
