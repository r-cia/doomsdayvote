# Plano — Correção dos Technical Debts do code review

## Contexto
O usuário pediu para implementar todos os achados do code review que não dependem de decisão técnica ou de negócio, com um commit por card e push no final.

## Fora do escopo (dependem de decisão)
| Card | Motivo |
|---|---|
| `7287` Ordenação antes do top-N | O comportamento atual segue decisão do usuário registrada em `docs/API.md:11` e `:26` (ordenar todo o conjunto antes do top-N). A parte de `diferenca_participacao`/`diferenca_abstencao` depende de definir o que é "diferença". Abrir Question. |
| `2870` Status SQL x JS | Unificar exige escolher onde a regra vive (SQL ou JS) e se `horario_impossivel` deve ser alimentado ou removido. |
| `a6e3` Timeline ignora corte | Question aberta. |
| `2c76` Horários 17:15/19:15 | Question aberta. |

## Cards parciais
Nestes cards só a parte sem decisão é implementada. O restante sai do card atual e vira um card novo no board, para que o card original possa ser concluído sem trabalho pendente:
- `e51e` Helpers duplicados: implementar só o backend. Unificar `numero()` no frontend muda o que aparece para valor nulo (0 ou "—"), então isso vira um card novo com Question.
- `04e4` routes/index.js: extrair os blocos repetidos dentro do próprio arquivo. Mover as consultas para `modules/` é decisão de arquitetura e vira um card novo.
- `23b5` Performance: trocar os spreads de `Math.min/max` por loop e as buscas lineares em loop por `Map`. Paginação no banco e flags de heap/stack viram um card novo.

## Execução (ordem, um commit por card)
Fluxo no board para cada card: claim → start → move Build → move Integration & QA → commit → complete.

1. `0a16` Dead code backend: remover os exports sem uso (ou torná-los internos quando usados no próprio arquivo, ajustando os testes que importam apenas eles), `escopo` sem uso, imports duplicados, `precisao` duplicado, `outliers_limitado` duplicado, `loteMap.get` 3x, fallback `secoes_abaixo_minimo` e `!Number.isNaN` redundante.
2. `37d1` concentracao.js: remover aliases, default export, `agruparPorAptos`, `calcularConcentracao`, `mediana`, `grupoPorSecao`, grafias alternativas em `normalizarSecao` e opções alternativas. Na resposta, ficam os nomes usados pelo frontend (`top_share`, `top_margem`, `margem_absoluta`, `margem_pp`, `contexto.estado`). Saem `margem_segundo`, `margem_segundo_pp`, `estado` da raiz, `top_por_*`, `top_*_desc`, `top`, `top_n`, `total_share`, `total_margem`, `secoes` e `grupos` (o frontend não usa `secoes` nem `grupos`). A rota fica só com `limit` e `page`. O fallback de `ConcentracaoPanel.vue:22` sai. Atualizar `docs/API.md` (o exemplo usa `margem_segundo`).
3. `e51e` (parcial) Extrair `mediana`, `media`, `desvioPadrao`, `percentilRank` e `toNumberOrNull` para um módulo compartilhado em `backend/src/modules/analise/` e reutilizá-lo em `concentracao.js`, `comparacao-local.js` e `outliers.js`.
4. `23b5` (parcial) Trocar os spreads em `concentracao.js:236`, `comparacao-local.js:114-115` e `estatisticas.js:273` por loop/reduce. Trocar `normalizadas.find` dentro de map (`concentracao.js:310-312`) e o `find` por candidato (`routes/index.js:762`) por `Map`.
5. `04e4` (parcial) Em `routes/index.js`: helper para `pageSize`, helper para metadados/avisos, constante para a expressão de encerramento, uma função de partido vencedor (encerramento municípios e seções), uma constante/helper para o filtro de cargo (também em `corte.js`) e ponto e vírgula no bloco `:580-627`.
6. `b6c4` `/api/sections`: quando a página vem vazia, calcular o total com uma consulta de contagem, com ou sem `status`.
7. `e04b` Cache: no `obter`, não consultar o Redis quando `cliente.status !== 'ready'` (vai direto para o modo off). Proteger `invalidar()` com try/catch e log de aviso.
8. `33fc` Frontend: um helper para o `enabled` base e para os parâmetros base de `queries.js`, uma constante nomeada para o cargo 3, `toValue` no lugar do desembrulho manual e o handler de `MapaView.vue:145` movido para uma função. É só lógica, sem mudança visual, então as skills de frontend não se aplicam.

## Validação
- `npm test` no backend e no frontend a cada card. `npm run test:integration` no backend quando o banco de testes estiver disponível.
- `graphify update .` após as edições.
- Docs: `docs/API.md` (concentração) e `docs/architecture.md` (novo módulo de estatística).
- Push no final.

## Delegação e limites
- Implementação feita por 1 subagente Sonnet, card a card, com commit por card.
- O limite de 30 chamadas de ferramenta será ultrapassado: são 8 cards, cada um com operações no board, testes e commit.
