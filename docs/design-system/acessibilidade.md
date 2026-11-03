# Acessibilidade

## Princípios

- Cor nunca é a única informação: toda cor do mapa, da linha do tempo e das tabelas tem rótulo textual, sigla, valor ou nome correspondente.
- A tabela alternativa (`MapTable.vue`) repete os dados do mapa para leitura linear e navegação por teclado.
- Legendas são textuais em todos os modos, incluindo a legenda de faixas do modo percentual.

## Foco e teclado

- Elementos interativos usam `:focus-visible` com contorno visível.
- O mapa é um contêiner focável (`tabindex="0"`) com instruções ocultas e navegação por setas, Home, End, Enter e Espaço.
- Tabelas de mapa e de seções navegam por setas entre as ações de linha.
- O slider da linha do tempo usa o comportamento nativo de teclado e anuncia o horário por `aria-valuetext`.
- Filtros, botões de modo, cartões de UF e paginação são botões ou campos nativos com rótulo.

## Rótulos e regiões

- Controles segmentados usam `role="group"` com `aria-label` e `aria-pressed`.
- Regiões com mensagens informativas usam `role="status"`; erros usam `role="alert"`.
- Avisos da linha do tempo sem pontos e localidades sem malha também usam `role="status"`.
- Tabelas têm `caption` (visível ou oculta) e cabeçalhos com `scope`.
- O tooltip visual é `aria-hidden`; a versão por teclado é anunciada em região viva.

## Contraste

- Textos e valores usam os tokens de tinta do tema; cores de partido são apenas preenchimento e sempre vêm acompanhadas de sigla ou nome.
- A cor de texto sobre selos de partido é escolhida por luminância (`corTextoContraste`).
