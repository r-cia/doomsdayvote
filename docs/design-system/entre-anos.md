# Entre anos

Rota `/entre-anos` (`frontend/src/views/EntreAnosView.vue`), link `app.abas.entreAnos`. Só rótulos e valores: nenhuma tela traz texto explicativo de método, limitação ou aviso.

## Seleção de anos

Botões `button button--ghost button--compacto` em grupo (`role="group"`, rótulo `entreAnos.anos`), um por ano com Presidente, com `aria-pressed`. Selecionado usa o fundo âmbar (`.entre-anos__anos .button.ativo`). Ano sem `dt_pleito` (2014) fica visível e `disabled`. A consulta só roda com dois ou mais anos. A UF vem do filtro global (`store.uf`); o corte é ignorado.

## Gráficos

`CurvasAnos.vue`: SVG responsivo (`viewBox` 640x220), uma curva por ano, com cor e traçado distintos (a cor nunca é o único diferenciador), grade e eixos na paleta (`--ink-faint`, `rgba(255, 181, 46, 0.09)`), números em `--mono`. Eixo X: hora de encerramento em -03 (minutos desde 00:00 do dia do pleito); eixo Y: votos (`votosIntervalo`) ou % (`pctAcumulada`). Legenda abaixo, um item por série (`ano · candidato (partido)`). `role="img"` com `aria-label` contendo o título e o último valor de cada série. Pontos nulos não entram no traçado.

Abas de turno: "1º Turno" e "2º Turno" (`entreAnos.turno`), em `role="tablist"` com `role="tab"` (`aria-selected`, `aria-controls`, `tabindex` móvel) e `role="tabpanel"`; setas esquerda/direita, Home e End trocam de aba. Só os gráficos do turno selecionado são exibidos (a primeira aba é a inicial).

Em cada turno, para cada posição (1º e 2º colocado; no 2º turno, vencedor e derrotado), um gráfico por linha, em largura total, empilhados (o SVG ajusta a largura ao contêiner), nesta ordem:
- Votos por intervalo: escala logarítmica, com marcas nas potências de 10 que cobrem os dados. Intervalos com 0 voto não existem em escala log e ficam como lacuna na linha (nunca 0 ou 1). Abaixo: diferença em votos (A − B) e diferença em pontos percentuais do % do total do ano (votos do intervalo ÷ total de votos do candidato na curva do ano × 100).
- % acumulada: escala linear. Abaixo: diferença em pontos percentuais (pct_acumulada A − B).

Diferenças: calculadas no frontend (`lib/entre-anos.js`) a partir de `pontos`, uma linha por par de anos (os mesmos pares da tabela de correlação), rotulada "A − B" na legenda, só nos intervalos presentes nos dois anos. Escala linear com linha de zero visível (`.curvas__zero`). O pareamento segue a posição.

Cores e traços (`lib/entre-anos.js`):
- Uma cor por candidato, identificado por `nm_votavel`, igual em todos os gráficos, abas de turno e anos. A cor sai da ordem alfabética dos nomes de todos os candidatos da resposta atual, sobre `PALETA_CANDIDATOS` (`#ffb52e`, `#7ec8ff`, `#74e08c`, `#ff6b57`, `#c79bff`, `#e6e6a0`), então a mesma seleção sempre gera as mesmas cores.
- Mesmo candidato em anos diferentes no mesmo gráfico: mesma cor, traço fixo por ano (`TRACOS_ANOS`: contínuo, `8 4`, `2 3`, `10 3 2 3`, `4 4`, `1 3`), na ordem crescente dos anos selecionados e igual em todos os gráficos. O ano aparece na legenda (`ano · candidato (partido)`) com a amostra da cor e do traço.
- Gráficos de diferença: paleta própria, disjunta da dos candidatos (`PALETA_DIFERENCAS`: `#ff7ac6`, `#2ed3c4`, `#f2efe4`, `#c4e04a`, `#d98c5f`, `#8f9bff`), uma cor por par de anos (pares em ordem crescente), igual em todos os gráficos de diferença, traço contínuo.

Eixo X fixo: todos os gráficos (curvas sobrepostas e diferenças, nas duas abas de turno) usam o domínio `DOMINIO_X` de `lib/entre-anos.js`, 14:00 até 03:00 do dia seguinte (`minuto` de 840 a 1620, minutos desde 00:00 do dia do pleito em -03), qualquer que seja a faixa dos dados. É só exibição: a API, as correlações e os p-valores não mudam. Pontos fora do domínio não são desenhados (recorte, sem reescalar) e não entram na escala do eixo Y. Os rótulos continuam HH:MM, de hora em hora (de duas em duas horas em largura menor que 520px, contadas a partir de 03:00); depois da meia-noite são as horas do dia seguinte (00:00, 01:00, 02:00, 03:00).

A margem esquerda do SVG é calculada pelo maior rótulo do eixo Y, para que nenhum rótulo seja cortado.

## Tabela de correlação

Dentro de `TabelaScroll` (`atualizando` = `isFetching`). Colunas: anos do par, turno, candidato (posição), `r` e `p` de cada curva. `r` com 3 casas e `p` com 4 (`formatarDecimal`); nulo vira `—`. Sem ordenação (cabeçalho simples): a lista é o produto cartesiano de pares, na ordem da API.

## Estados

Carregando e erro usam `StateBlock` (erro com `comum.tentarNovamente`). Com menos de dois anos selecionados, nada é consultado nem exibido além da seleção.
