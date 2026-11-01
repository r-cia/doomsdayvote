# Tabelas

## Recarga

Toda tabela fica dentro de `TabelaScroll` (`frontend/src/components/TabelaScroll.vue`). Com linhas já exibidas e consulta em andamento (`isFetching`, ou o ref de carregamento nas views que chamam a API direto), `atualizando` escurece as linhas, centraliza o spinner de `StateBlock` carregando sobre a tabela e define `aria-busy="true"`, com `role="status"` oculto (`comum.carregando`). Sem linhas, vale o `StateBlock` carregando. O overlay some ao chegar a resposta ou o erro.

## Grupos recolhíveis (Comparação local)

Cada grupo começa recolhido: o cabeçalho (`.grupo__cabecalho`) contém um botão `.grupo__alternar` com `aria-expanded`, o indicador `▸`/`▾` (`aria-hidden`), o nível e o tamanho do grupo. Ao expandir, a tabela de seções do grupo é buscada em `/api/comparacao-local/secoes` (hook `useComparacaoLocalSecoes`) e exibida dentro de `TabelaScroll`, com `StateBlock` para carregando e erro. A ordenação das colunas é a mesma do painel e vale para todos os grupos abertos. Componente: `ComparacaoLocalGrupo.vue`.

## Estados: carregando, erro, sem dados, dados

Todo bloco ligado a uma consulta (tabela, painel, gráfico, mapa) resolve o estado nesta ordem: carregando → erro → sem dados → dados.

- Carregando: `StateBlock` carregando, só quando ainda não há dados (com dados já exibidos vale o overlay de "Recarga").
- Erro: `StateBlock` `estado="erro"` com `comum.erro`, a mensagem do `ApiError` como descrição e a ação `comum.tentarNovamente` que refaz a consulta (painel filho emite `retry`). O erro vem antes do vazio e dos dados: uma falha nunca cai em "Sem dados" e, numa recarga que falha, substitui o conteúdo antigo em vez de mantê-lo.
- Sem dados: `comum.semDados` (ou a variante do bloco) só quando a requisição teve sucesso e não trouxe nada.
- Dados: o conteúdo.

Quando mais de uma consulta alimenta o bloco, qualquer falha mostra o erro. Chamadas diretas à API (sem `useQuery`) guardam a mensagem de erro em um ref e não a trocam por lista vazia. Falha ao carregar a malha do mapa também é erro, não "Sem dados".

## Blocos de resumo

Contagens e totais de cobertura usam o estilo compartilhado `.painel-resumo` / `.painel-resumo__item` (`dt` rótulo, `dd` valor em âmbar, números formatados por `lib/format.js`), como em Consistência, Concentração, Comparação local e `CoberturaBlock`. Nunca lista, `dl` ou `ul` com o estilo padrão do navegador, e nunca JSON na tela: objeto aninhado vira subitens rotulados (`.cobertura-block__sub`), com rótulo de i18n e, para chave desconhecida, o nome bruto.

Guarda permanente: `tests/estilo-classes.test.js` falha se um `ul`, `ol`, `dl`, `li`, `div`, `section` ou similar usar uma classe sem regra em `styles.css` (ou `<style>` de componente), se uma lista não tiver classe nem seletor de descendente no CSS, ou se um template tiver `JSON.stringify`. Raízes de bloco BEM que só estilizam os filhos ficam na lista `PERMITIDAS` do teste.

## Valor nulo

Valor nulo ou ausente em célula ou painel é exibido como travessão (`—`) em todas as telas. Use os formatadores de `frontend/src/lib/format.js` (`formatarNumero`, `formatarDecimal`, `formatarPercentual`, etc.), que já devolvem `—` para nulo, indefinido, vazio ou não numérico; painéis não definem helper próprio com outra regra. Zero é exibido como `0`.

## Cabeçalho ordenável

Toda tabela ordena clicando no cabeçalho da coluna. A ordenação é feita no servidor (`ordem`/`direcao`, ver `docs/API.md`, seção "Ordenação"); o cliente nunca reordena as linhas.

Estado inicial: nenhuma coluna ativa, sem seta, linhas na ordem padrão da rota. O primeiro clique em uma coluna ordena `asc`; clicar de novo na mesma coluna alterna `asc`/`desc`; trocar de coluna reinicia em `asc`.

Marcação:

```html
<th scope="col" class="ordenavel" :aria-sort="ariaSort('x')">
  <button type="button" @click="alternar('x')">Rótulo{{ seta('x') }}</button>
</th>
```

- `aria-sort`: `ascending`, `descending` ou `none`.
- Seta: ` ↑` (asc), ` ↓` (desc), vazio quando inativa.
- Alinhamento numérico preservado com `num` / `tabela__numero` no `th`.
- O botão herda fonte, cor e alinhamento do cabeçalho; foco visível.

Código: `useOrdenacao(sufixo?)` em `frontend/src/composables/ordenacao.js` devolve `coluna`, `direcao`, `alternar`, `ariaSort`, `seta` e `params` (`{ ordem, direcao }`, vazio sem coluna; com sufixo `ordem_<sufixo>`/`direcao_<sufixo>`). `params` entra na `queryKey` e nos parâmetros da requisição.

Tabelas sem ordenação (cabeçalho simples): Duplicação (Zonas, Números, Aptos, Sinalizadores), Concentração (Posição), Estatística (tabela de comparecimento), colunas de ação/detalhe.

Quando mais de uma tabela compartilha a mesma consulta, cada uma usa sua própria instância de consulta (chave própria) para que a ordenação de uma não reordene a outra; o mapa não é afetado pela ordenação da tabela. Relatório usa uma única ordenação para as duas tabelas.
