# Tabelas

## Recarga

Toda tabela fica dentro de `TabelaScroll` (`frontend/src/components/TabelaScroll.vue`). Com linhas já exibidas e consulta em andamento (`isFetching`, ou o ref de carregamento nas views que chamam a API direto), `atualizando` escurece as linhas, centraliza o spinner de `StateBlock` carregando sobre a tabela e define `aria-busy="true"`, com `role="status"` oculto (`comum.carregando`). Sem linhas, vale o `StateBlock` carregando. O overlay some ao chegar a resposta ou o erro.

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
