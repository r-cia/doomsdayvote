---
name: Doomsday Vote
description: Conferência de boletins de urna numa sala de operações de fósforo âmbar
colors:
  ground: "#0a0d0a"
  panel: "#10150f"
  panel-raised: "#161d14"
  seam: "#273522"
  seam-soft: "#1b2518"
  ink: "#d9e3cf"
  ink-dim: "#9aac8c"
  ink-faint: "#7e9275"
  phosphor-amber: "#ffb52e"
  amber-deep: "#b57f1c"
  lamp-green: "#74e08c"
  lamp-amber: "#ffc857"
  lamp-red: "#ff6b57"
  teletype-paper: "#dfe4d6"
  teletype-ink: "#1c231a"
  teletype-line: "#a9b39d"
typography:
  display:
    fontFamily: "Archivo Narrow, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.08em"
  data:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  figure:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.2
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "9px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
rounded:
  xs: "1px"
  sm: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.phosphor-amber}"
    textColor: "#14100a"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  field:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "30px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.xs}"
    padding: "1px 6px"
---

# Design System: Doomsday Vote

## Overview

**Creative North Star: "A Sala de Plotagem"**

A interface é uma sala de operações da Guerra Fria: um quadro de plotagem onde o dia dos boletins de urna é traçado, lido sob fósforo âmbar. O visitante não navega por um painel de cartões; ele acompanha um traçado, um placar que se reordena e um extrato de teletipo. A densidade é a de um quadro de status — rótulos miúdos em caixa alta, algarismos tabulares, fios de um pixel no lugar de sombras.

O mundo empresta só quatro coisas: tipo, paleta, densidade e um movimento-assinatura (o traçado do dia). Navegação, filtros e controles continuam os da web: selects nativos, um slider de corte, botões e tabelas. Nada de fantasia de terminal: sem prompt de comando, sem teclas de função, sem scanlines sobre o texto.

**Key Characteristics:**
- Fundo quase preto esverdeado e painéis separados por fios de 1px.
- Âmbar de fósforo como tinta estrutural; verde de lâmpada para recebido; vermelho para alerta.
- Cores de partido são os únicos saturados dos dados.
- Monoespaçada para dados, condensada de quadro para títulos.
- Um único gesto autoral: arrastar o corte e ver o placar reordenar enquanto as traças crescem.

## Colors

A paleta é uma sala escura com três tintas de estado e um papel claro reservado ao extrato.

### Primary
- **Fósforo Âmbar** (#ffb52e): estrutura, valores, foco, a linha do corte e o traço selecionado. É a tinta que carrega a leitura.
- **Âmbar Fundo** (#b57f1c): bordas de estado ativo, legendas e a barra de participação no painel por UF.

### Secondary
- **Lâmpada Verde** (#74e08c): BU recebido, delta positivo, conformidade próxima.
- **Lâmpada Vermelha** (#ff6b57): falha, alerta, não conformidade.
- **Lâmpada Âmbar** (#ffc857): aviso, precisão insuficiente, corte indisponível.

### Neutral
- **Fundo da Sala** (#0a0d0a): o campo da página.
- **Painel** (#10150f): superfícies de trabalho.
- **Painel Elevado** (#161d14): hover e a mesa do mapa.
- **Fio** (#273522): divisórias de 1px e bordas.
- **Tinta** (#d9e3cf): texto principal.
- **Tinta Média** (#9aac8c): texto secundário.
- **Tinta Fraca** (#7e9275): rótulos de 9px.
- **Papel de Teletipo** (#dfe4d6) e **Tinta de Teletipo** (#1c231a): só no extrato da seção.

**The Three Inks Rule.** A página tem no máximo três tintas de estado em uso simultâneo; cor de partido nunca vira estado.

**The Teletype Exception Rule.** O papel claro existe apenas no extrato da seção. Fora dele, a sala é escura.

## Typography

**Display Font:** Archivo Narrow (com Arial Narrow, sans-serif)
**Body Font:** Fragment Mono (com ui-monospace, monospace)
**Label Font:** Fragment Mono

**Character:** Uma condensada de quadro de status para nomear, e uma monoespaçada de teletipo para medir. Não há terceira voz.

### Hierarchy
- **Display** (600, 22px, 1.1, tracking 0.08em, caixa alta): título da página e cabeçalhos de painel.
- **Title** (600, 12px, tracking 0.14em, caixa alta): cabeçalho de painel.
- **Figure** (400, 16px, tabular): números de leitura — votos, comparecimento, percentual do candidato.
- **Body** (400, 12–13px, 1.5): nomes, tabelas e textos de apoio.
- **Label** (400, 9px, tracking 0.14em, caixa alta): rótulos de campo, colunas e legendas.

**The Tabular Rule.** Todo número é tabular. Nenhum valor alinha à esquerda.

## Layout

Grade de 12 colunas implícita com painéis que se tocam: a mesa de plotagem ocupa 1.5fr e o placar 1fr; as leituras dividem 0.8fr e 1.2fr; mapa 1.6fr e painel por UF 1fr. O espaçamento entre painéis é 1px — o fio — e o respiro interno é 8–14px. A faixa de classificação tem 46px e fica fixa. Em 1180px os pares viram coluna única; em 760px os filtros viram duas colunas e o turno ocupa a linha inteira. A primeira dobra cabe em 1440×900: faixa, filtros, série, mesa e leituras.

## Elevation & Depth

Sem sombras. A profundidade vem do fio de 1px e de um degrau de valor entre fundo, painel e painel elevado. O único brilho é o halo curto da lâmpada na faixa de classificação.

**The Seam Rule.** Nenhum painel projeta sombra; se dois planos precisam se separar, entra um fio.

## Shapes

Cantos de 2px (1px em chips e selos). Nada de pílulas, nada de cartão arredondado. A geometria recorrente é a barra fina: 3px de partido, 2px de participação, 1px de fio.

## Components

### Buttons
- **Shape:** retângulo de 2px, altura 32px (26px na variante compacta).
- **Primary:** âmbar sólido com texto quase preto, caixa alta de 10px, tracking 0.1em.
- **Hover / Focus:** âmbar mais claro no hover; anel de foco de 1px âmbar com offset de 2px.
- **Ghost:** fundo transparente, fio de 1px, texto médio; hover sobe um degrau de painel.

### Chips
- **Style:** fio de 1px, 8px em caixa alta, sem preenchimento.
- **State:** verde, âmbar e vermelho conforme a leitura de Benford.

### Cards / Containers
- **Corner Style:** 2px.
- **Background:** painel; o extrato usa papel.
- **Shadow Strategy:** nenhuma.
- **Border:** fio de 1px.
- **Internal Padding:** 8px no cabeçalho, 12–14px no corpo.

### Inputs / Fields
- **Style:** fundo do sala, fio de 1px, 30px de altura, 12px mono.
- **Focus:** fio âmbar e um segundo anel de 1px.
- **Disabled:** opacidade 0.4 no botão; campos não têm estado desabilitado.

### Navigation
- **Style:** links mono de 10px em caixa alta dentro da faixa; ativo com fio âmbar e fundo âmbar a 12%.

### Mesa de Plotagem
O componente-assinatura: canvas com o dia no eixo horizontal, votos acumulados no vertical, uma traça por candidato na cor do partido, o corte como linha tracejada arrastável e o trecho posterior ao corte em 22% de opacidade. Abaixo, o slider nativo é o controle de teclado.

### Extrato de Teletipo
A página de detalhe da seção troca o fundo para papel, a tinta para quase preto e as linhas para pontilhado. É o único lugar claro do sistema.

## Do's and Don'ts

### Do:
- **Do** usar o fio de 1px para separar planos.
- **Do** alinhar todo número à direita, em algarismos tabulares.
- **Do** reservar o âmbar para estrutura e leitura; estado usa verde, âmbar ou vermelho.
- **Do** manter o primeiro viewport com ranking, traçado, biometria e Benford.
- **Do** nomear a fonte do dado (corte, seção, lote) perto do número.

### Don't:
- **Don't** usar sombra, cartão arredondado ou gradiente.
- **Don't** transformar cor de partido em estado.
- **Don't** pôr rótulo de apoio acima de título.
- **Don't** inventar percentual de apuração, snapshot ou cobertura.
- **Don't** apresentar Benford como prova de fraude.
