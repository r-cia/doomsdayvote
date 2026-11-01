# Benford

Gráfico do painel Benford da aba Estatística (`BenfordPanel.vue`, componente `BenfordFaixa.vue`). Só rótulos e legenda: nenhum texto de método na tela.

## Gráfico

- SVG responsivo, no estilo de `CurvasAnos.vue`: largura do contêiner (`ResizeObserver`), margem esquerda pelo maior rótulo do eixo Y (`margemEsquerda`), grade e números na paleta (`--ink-faint`, `rgba(255, 181, 46, 0.09)`, `--mono`).
- Eixo X: dígitos 1 a 9. Eixo Y: percentual, de 0 ao maior entre observado, esperado e limite superior da faixa.
- Por dígito: barra do percentual observado (`--amber`), curva do percentual esperado (linha `#7ec8ff`) e faixa de 95% do Monte Carlo (retângulo `#7ec8ff` com opacidade baixa, de `p025` a `p975`). Sem `faixa_digitos`, a faixa e o item da legenda não aparecem.
- Legenda abaixo: Observado, Esperado, Faixa de 95% (Monte Carlo).
- Acessibilidade: `role="img"` com `aria-label` do título e, por dígito, observado, esperado e faixa; cada barra e faixa tem `<title>` com os mesmos valores.

## Candidato e nível

- Candidato: o selecionado na tabela ao lado, ou o primeiro.
- Nível: seletor Seção / Zona / Município (`.segmented`, botões com `aria-pressed`, grupo rotulado por `estatistica.nivelGrafico`). Seção usa os dados de `/api/analysis`; zona e município usam `benford_niveis` de `/api/anomalies`, já carregado na mesma tela (sem nova requisição).
- Estados: zona ou município enquanto as anomalias carregam mostram `StateBlock` carregando; sem dados do nível, "Sem dados." (`comum.semDados`). Erro das anomalias aparece no bloco de erro da seção de análise.
