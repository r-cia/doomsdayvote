# Benford

Gráfico do painel Benford da aba Estatística (`BenfordPanel.vue`, componente `BenfordFaixa.vue`). Só rótulos e legenda: nenhum texto de método na tela.

## Gráfico

- SVG responsivo: largura do contêiner (`ResizeObserver`), margem esquerda pelo maior rótulo do eixo Y (`margemEsquerda` em `lib/entre-anos.js`), grade e números na paleta (`--ink-faint`, `rgba(255, 181, 46, 0.09)`, `--mono`).
- Eixo X: dígitos 1 a 9. Eixo Y: percentual, de 0 ao maior entre observado, esperado e limite superior da faixa.
- Por dígito: barra do percentual observado (`--amber`), curva do percentual esperado (linha `#7ec8ff`) e faixa de 95% do Monte Carlo (retângulo `#7ec8ff` com opacidade baixa, de `p025` a `p975`). Sem `faixa_digitos`, a faixa e o item da legenda não aparecem.
- Legenda abaixo: Observado, Esperado, Faixa de 95% (Monte Carlo) (`benford.observado`, `benford.esperado`, `benford.faixa`).
- Acessibilidade: `role="img"` com `aria-label` (`benford.aria`) e, por dígito, observado, esperado e faixa (`benford.digito`, `benford.faixaDe`); cada barra e faixa tem `<title>` com os mesmos valores.

## Candidato e nível

- Candidato: o selecionado na tabela ao lado, ou o primeiro.
- Nível: seletor Seção / Zona / Município (`.segmented`, botões com `aria-pressed`, grupo rotulado por `benford.nivel`), no topo da coluna do gráfico (`.benford__visual`). Seção usa os dados de `/api/analysis`; zona e município usam `benford_niveis` de `/api/anomalies`, já carregado na mesma tela (sem nova requisição).
- Estados: zona ou município enquanto as anomalias carregam mostram `comum.carregando`; sem dados do nível, `comum.semDados`. Erro das consultas aparece no bloco de erro da seção de análise.

## Tabela

Ao lado do gráfico: candidato, `n`, MAD e `p` (`monte_carlo.p_valor`), com MAD e `p` em 4 casas pelo formatador do idioma. `n` e MAD ordenam no servidor; a coluna `p` não ordena. Clicar no candidato o seleciona no gráfico.
