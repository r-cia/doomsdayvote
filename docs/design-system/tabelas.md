# Tabelas

## Recarga

Tabela com linhas já exibidas e consulta em andamento (`isFetching`) fica dentro de `.tabela-scroll` com a classe `.atualizando`: as linhas escurecem, um indicador de carregamento aparece ao centro e `aria-busy="true"` é definido, com `<span class="sr-only" role="status">` (`comum.carregando`). Sem linhas, vale o `StateBlock` carregando.

## Larguras

Colunas de dados têm largura fixa: a tabela usa a classe compartilhada `.tabela-fixa` (`table-layout: fixed`) e declara um `<colgroup>` com `<col style="width: …">` no próprio componente. Cada colgroup em porcentagem soma 100 (`tests/larguras.test.js`); tabelas com número variável de colunas usam `rem`. Sem `colgroup`, a coluna se ajusta ao conteúdo e a tabela muda de largura entre telas e durante a troca de filtro.

Célula com texto que pode cortar recebe `title` com o valor completo, e o CSS de `.tabela-fixa th`/`td` trunca com reticências (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`). Botão compacto dentro de `.tabela-fixa td` fica `inline-block` com o mesmo truncamento, porque flex não aplica `text-overflow`.

Colunas condicionais (`v-if`) exigem um `<colgroup>` por combinação de colunas. Ordenação (`ordenavel`/`aria-sort`) continua valendo.

## Alinhamento

Número e texto alinham **sempre à esquerda**, e o número fica abaixo do cabeçalho da sua coluna. Coluna numérica usa a classe `num` (`text-align: left` e algarismos tabulares) no cabeçalho e na célula: `ThOrdenavel` com `numero` aplica `num` ao `th`, e a célula numérica leva `class="num"`. Não existe outra classe para número (`tabela__numero` foi removida por não ter regra de CSS). Nenhuma regra de CSS alinha texto ou número à direita; `text-align` só aceita `left`, com exceção dos estados vazios centralizados (`.tracado__vazio`, `.mapa-ausente`, `.vazio`, `.estado`) e do rótulo do botão compacto em `.tabela-fixa`.

`ComparacaoLocalGrupo.vue`: UF 6 · Município 26 · Zona 8 · Seção 8 · Participação 11,5 · Abstenção 11,5 · Δ participação 11,5 · Δ abstenção 11,5 · Ação 6.

## Boletim de Urna

O Boletim de Urna (`SecaoView`) abre sempre como modal; nunca como página e nunca por link. Em tabela, o acionador é um botão `button button--ghost button--compacto` em uma coluna de ação com cabeçalho `sr-only`. O componente pai guarda o id da seção (`secaoModalId`) e renderiza `<SecaoView :id-prop … @close>`.

Texto do botão: `comum.detalhe` no Mapa, Biometria, Encerramento e Comparações; `comum.abrirSecao` em Concentração e Consistência. O modal fecha pelo botão ✕, pelo clique no fundo ou pelo botão do estado de erro (`secao.fechar`).

## Grupos recolhíveis (Comparação local)

Cada grupo começa recolhido: `article.grupo` › `header.grupo__cabecalho` › `h3` › `button.grupo__alternar` com `aria-expanded`, o indicador `▸`/`▾` (`aria-hidden`), o nível, a identificação (UF, município, zona, local) e o número de seções. Grupo com `dados_insuficientes` mostra o chip `status status--warning`.

Ao expandir, a tabela de seções do grupo é buscada em `/api/comparacao-local/secoes` (hook `useComparacaoLocalSecoes`) e exibida dentro de `.tabela-scroll`, com `StateBlock` para carregando e erro. A ordenação das colunas é a mesma do painel e vale para todos os grupos abertos. Os grupos são paginados (`Paginacao`).

Rodapé do painel: `dl.painel-resumo` com a cobertura (seções consideradas, com grupo, sem grupo, grupos insuficientes), números formatados por `lib/format.js`.

## Valor nulo

Valor nulo ou ausente em célula ou painel é exibido como travessão (`—`), pelos formatadores de `frontend/src/lib/format.js` (`formatarNumero`, `formatarDecimal`, `formatarPercentual`). Zero é exibido como `0`.

## Cabeçalho ordenável

Toda tabela ordena clicando no cabeçalho da coluna, e a ordenação é feita no servidor (`ordem`/`direcao`, ver `docs/API.md`, seção "Ordenação"); o cliente nunca reordena as linhas (`tests/sem-ordenacao-no-cliente.test.js`).

Estado inicial: nenhuma coluna ativa, sem seta, linhas na ordem padrão da rota. O primeiro clique em uma coluna ordena `asc`; clicar de novo na mesma coluna alterna `asc`/`desc`; trocar de coluna reinicia em `asc`.

Código: `ThOrdenavel.vue` (`th` com `aria-sort` `ascending`, `descending` ou `none`, botão e seta ` ↑`/` ↓`) e `useOrdenacao()` em `frontend/src/composables/ordenacao.js`, que devolve `{ ordenacao, alternar }`.
