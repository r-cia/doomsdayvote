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
