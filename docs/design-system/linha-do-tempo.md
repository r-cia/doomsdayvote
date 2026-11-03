# Linha do tempo

## Estrutura

- `PlotDia.vue` usa Chart.js por meio de `vue-chartjs` (`Line`), com escalas de categoria e linear.
- As séries vêm de `/api/timeline` (`series`, por candidato) e os pontos agregados de `pontos` (`votos_acumulados` e `secoes_com_bu_acumuladas`).
- A leitura do corte fica no cabeçalho do painel e abaixo do slider.

## Alternância votos/seções

- O grupo de botões alterna entre votos acumulados por candidato e seções com BU acumuladas.
- No modo votos, cada candidato é uma linha com a cor do partido; o candidato selecionado fica mais espesso. Sem séries por candidato, uma linha única mostra os votos acumulados.
- No modo seções, uma linha única mostra o total acumulado de seções com BU.
- O estado ativo é indicado por `aria-pressed` e pela classe visual, não apenas pela cor.

## Slider

- O slider percorre os pontos da linha do tempo e emite `update:corte` com o horário de São Paulo.
- `aria-valuetext` anuncia o horário do corte selecionado.
- A leitura mostra horário, seções com BU e votos no ponto atual.

## Avisos e vazio

- Quando não há pontos, o painel mostra “Linha do tempo indisponível” e, se houver `avisos`, a lista de mensagens em uma região `role="status"`.
- Erros usam `role="alert"` com ação de nova tentativa; carregamento usa o estado compartilhado.

## Acessibilidade

- O gráfico tem `role="img"` e rótulo textual com intervalo, corte, votos e seções.
- O slider tem rótulo oculto e leitura por teclado nativa.
- Cores das séries são acompanhadas pelo nome do candidato na legenda e no tooltip do gráfico.
