# Plano atual — Boletim de Urna modal, Grupos comparáveis e Benford

Aprovado pelo usuário em 06/11/2026. Cards no board: BU sempre modal (23ab9ff1), Grupos comparáveis (6c55e3d5), Benford (7d8e9c25), Documentação (954ec771).

## Decisões

- BU é sempre modal e sempre aberto por botão (`button button--ghost button--compacto`), em Comparações, Concentração e Consistência.
- Rota `/secoes/:id` e o ramo não modal do `SecaoView` saem por falta de uso, junto com o estado "sem filtros" e as chaves `secao.voltar`, `secao.voltarPainel`, `secao.semFiltros`, `secao.semFiltrosDesc`, `secao.irPainel`.
- Botão do estado de erro do `SecaoView` usa `secao.fechar`.
- Layout de Grupos comparáveis e do Benford segue a branch `junk`, adaptado à arquitetura da dev (`ThOrdenavel`, `useOrdenacao`, chaves i18n da dev, `.tabela-scroll` + `.atualizando`, paginação, `painel__etiqueta`). Só CSS copiado da `junk`.
- Grupos comparáveis ganha coluna de ação; larguras: UF 6 · Município 26 · Zona 8 · Seção 8 · Participação 11,5 · Abstenção 11,5 · Δ participação 11,5 · Δ abstenção 11,5 · Ação 6 = 100.

## Ordem

1. BU sempre modal.
2. Layout de Grupos comparáveis.
3. Layout do Benford.
4. Documentação (architecture, blueprint, design-system/benford e tabelas, README).

## Verificação

`cd frontend && npm test && npm run build` por card; commit por card; push ao final; conferência visual pelo usuário com `npm run dev`.
