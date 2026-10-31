# Entre anos

Rota `/entre-anos` (`frontend/src/views/EntreAnosView.vue`), link `app.abas.entreAnos`. Só rótulos e valores: nenhuma tela traz texto explicativo de método, limitação ou aviso.

## Seleção de anos

Botões `button button--ghost button--compacto` em grupo (`role="group"`, rótulo `entreAnos.anos`), um por ano com Presidente, com `aria-pressed`. Selecionado usa o fundo âmbar (`.entre-anos__anos .button.ativo`). Ano sem `dt_pleito` (2014) fica visível e `disabled`. A consulta só roda com dois ou mais anos. A UF vem do filtro global (`store.uf`); o corte é ignorado.

## Gráficos

`CurvasAnos.vue`: SVG responsivo (`viewBox` 640x220), uma curva por ano, com cor e traçado distintos (a cor nunca é o único diferenciador), grade e eixos na paleta (`--ink-faint`, `rgba(255, 181, 46, 0.09)`), números em `--mono`. Eixo X: hora de encerramento em -03 (minutos desde 00:00 do dia do pleito); eixo Y: votos (`votosIntervalo`) ou % (`pctAcumulada`). Legenda abaixo, um item por série (`ano · candidato (partido)`). `role="img"` com `aria-label` contendo o título e o último valor de cada série. Pontos nulos não entram no traçado.

Abas de turno: "1º Turno" e "2º Turno" (`entreAnos.turno`), em `role="tablist"` com `role="tab"` (`aria-selected`, `aria-controls`, `tabindex` móvel) e `role="tabpanel"`; setas esquerda/direita, Home e End trocam de aba. Só os gráficos do turno selecionado são exibidos (a primeira aba é a inicial).

Em cada turno, para cada posição (1º e 2º colocado; no 2º turno, vencedor e derrotado), duas colunas (grade `auto-fit`, mínimo 320px):
- Votos por intervalo: escala logarítmica, com marcas nas potências de 10 que cobrem os dados. Intervalos com 0 voto não existem em escala log e ficam como lacuna na linha (nunca 0 ou 1). Abaixo: diferença em votos (A − B) e diferença em pontos percentuais do % do total do ano (votos do intervalo ÷ total de votos do candidato na curva do ano × 100).
- % acumulada: escala linear. Abaixo: diferença em pontos percentuais (pct_acumulada A − B).

Diferenças: calculadas no frontend (`lib/entre-anos.js`) a partir de `pontos`, uma linha por par de anos (os mesmos pares da tabela de correlação), rotulada "A − B" na legenda, só nos intervalos presentes nos dois anos. Escala linear com linha de zero visível (`.curvas__zero`). O pareamento segue a posição.

A margem esquerda do SVG é calculada pelo maior rótulo do eixo Y, para que nenhum rótulo seja cortado.

## Tabela de correlação

Dentro de `TabelaScroll` (`atualizando` = `isFetching`). Colunas: anos do par, turno, candidato (posição), `r` e `p` de cada curva. `r` com 3 casas e `p` com 4 (`formatarDecimal`); nulo vira `—`. Sem ordenação (cabeçalho simples): a lista é o produto cartesiano de pares, na ordem da API.

## Estados

Carregando e erro usam `StateBlock` (erro com `comum.tentarNovamente`). Com menos de dois anos selecionados, nada é consultado nem exibido além da seleção.
