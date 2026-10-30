# Tabelas

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
