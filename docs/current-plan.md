# Plano atual — Boletim de Urna modal, Grupos comparáveis e Benford

Aprovado pelo usuário em 06/11/2026 (revisado após reanálise).

## Decisões

- BU é sempre modal e sempre aberto por botão (`button button--ghost button--compacto`), em Comparações, Concentração e Consistência.
- Rota `/secoes/:id` e o ramo não modal do `SecaoView` saem por falta de uso, junto com o estado "sem filtros" e as chaves `secao.voltar`, `secao.voltarPainel`, `secao.semFiltros`, `secao.semFiltrosDesc`, `secao.irPainel`.
- Botão do estado de erro do `SecaoView` usa `secao.fechar`.
- Layout de Grupos comparáveis e do Benford segue a branch `junk`, adaptado à arquitetura da dev (`ThOrdenavel`, `useOrdenacao`, chaves i18n da dev, `.tabela-scroll` + `.atualizando`, paginação, `painel__etiqueta`). Só CSS copiado da `junk`.
- Grupos comparáveis ganha coluna de ação; larguras: UF 6 · Município 26 · Zona 8 · Seção 8 · Participação 11,5 · Abstenção 11,5 · Δ participação 11,5 · Δ abstenção 11,5 · Ação 6 = 100.
- Os documentos do Jiraya (`architecture.md`, `blueprint.md`) passam a descrever a dev.

## Errata

O plano inicial afirmava que `margemEsquerda` já existia em `frontend/src/lib/entre-anos.js` da dev. Não existia: foi copiada da `junk`, com o teste correspondente.

## Cards concluídos

1. BU sempre modal (DD-173).
2. Layout de Grupos comparáveis (DD-174).
3. Layout do Benford (DD-175).
5. Corner cases: botão compacto na coluna fixa e teste do `SecaoView` (DD-178).
4. Documentação: `architecture.md`, `blueprint.md` e `API.md` no Jiraya; `docs/design-system/benford.md` e `tabelas.md` no repositório e no Jiraya; `README.md`.

## Verificação

`cd frontend && npx vitest run` (118 testes) e `npm run build`; blocos de CSS copiados conferidos por `diff` contra a `junk`; conferência visual pelo usuário com `npm run dev`.
