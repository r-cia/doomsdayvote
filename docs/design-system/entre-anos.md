# Entre anos

Rota `/entre-anos` (`frontend/src/views/EntreAnosView.vue`), link `app.abas.entreAnos`. Só rótulos e valores: nenhuma tela traz texto explicativo de método, limitação ou aviso.

## Seleção de anos

Botões `button button--ghost button--compacto` em grupo (`role="group"`, rótulo `entreAnos.anos`), um por ano com Presidente, com `aria-pressed`. Selecionado usa o fundo âmbar (`.entre-anos__anos .button.ativo`). Ano sem `dt_pleito` (2014) fica visível e `disabled`. A consulta só roda com dois ou mais anos. A UF vem do filtro global (`store.uf`); o corte é ignorado.

## Gráficos

`CurvasAnos.vue`: SVG responsivo (`viewBox` 640x220), uma curva por ano, com cor e traçado distintos (a cor nunca é o único diferenciador), grade e eixos na paleta (`--ink-faint`, `rgba(255, 181, 46, 0.09)`), números em `--mono`. Eixo X: hora de encerramento em -03 (minutos desde 00:00 do dia do pleito); eixo Y: votos (`votosIntervalo`) ou % (`pctAcumulada`). Legenda abaixo, um item por série (`ano · candidato (partido)`). `role="img"` com `aria-label` contendo o título e o último valor de cada série. Pontos nulos não entram no traçado.

Por turno (`entreAnos.turno`): para cada posição (1º e 2º colocado; no 2º turno, vencedor e derrotado), dois gráficos lado a lado (grade `auto-fit`, mínimo 320px): votos por intervalo e % acumulada.

## Tabela de correlação

Dentro de `TabelaScroll` (`atualizando` = `isFetching`). Colunas: anos do par, turno, candidato (posição), `r` e `p` de cada curva. `r` com 3 casas e `p` com 4 (`formatarDecimal`); nulo vira `—`. Sem ordenação (cabeçalho simples): a lista é o produto cartesiano de pares, na ordem da API.

## Estados

Carregando e erro usam `StateBlock` (erro com `comum.tentarNovamente`). Com menos de dois anos selecionados, nada é consultado nem exibido além da seleção.
