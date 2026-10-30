# Plano — Correções de UX + Code review completo

## Contexto
O usuário relatou três problemas de UX: a ordenação mistura combobox e clique no cabeçalho, as colunas mudam de largura conforme os nomes de municípios e o clique no mapa não funciona com o cargo Governador. Pediu também o primeiro code review completo do código.

Decisões do usuário:
- **Ordenação:** todas as tabelas ordenam por clique na coluna e **sempre no servidor**, sobre todos os dados (não só sobre as linhas exibidas).
- **Larguras:** eu proponho os % de cada tabela (abaixo) e o usuário aprova.
- **Code review:** cada achado vira Technical Debt no board Jiraya; só será corrigido o que o usuário aprovar.

Regras do AGENTS.md que serão seguidas na execução:
- Copiar este plano para `docs/current-plan.md`.
- Implementação delegada a 1 subagente Sonnet.
- Executar `graphify update .` após editar o código.
- Atualizar `docs/API.md`, `docs/architecture.md` e `docs/design-system/*.md`.
- Fazer commit ao fim de cada tarefa.
- Antes de mexer no frontend, aplicar as skills `ui-ux-pro-max` → `impeccable` → `frontend-design`.

---

## Tarefa 1 — Mapa com Governador (bug)
**Causa raiz** (`frontend/src/components/MapPanel.vue:498`, `aoClicar`):
- O clique só é tratado quando `areaDaFeicao()` encontra dados da área.
- Com Governador sem UF, todas as queries ficam desabilitadas (`queries.js`, `!(cargo===3 && !uf)`). Por isso `areas = []` e o clique é ignorado.
- Com uma UF já escolhida, a query `/api/map` devolve apenas aquela UF. As outras UFs não têm `area`, então o clique nelas também é ignorado.

**Correção:** em `aoClicar`, no nível `uf`, usar `area?.sg_uf ?? ufDaFeicao(feature.properties)` (o helper já existe no arquivo). O resto do fluxo não muda: `selecionarNoMapa` em `MapaView.vue` já troca a UF e o nível. O cursor de `pointer` no hover deve seguir a mesma regra.
**Teste:** caso em `frontend/tests/components.test.js` — clicar numa feição sem área no nível UF emite `select` com a UF da feição.

## Tarefa 2 — Ordenação padronizada no servidor
**Backend** (`backend/src/routes/index.js`):
- Criar um helper único para os parâmetros `ordem` (lista branca de colunas por endpoint, validada pelo zod) e `direcao` (`asc|desc`).
- O helper aplica `orderBy` com `nulls last` e um desempate estável (id/chave).
- Nos endpoints que calculam em JS (anomalies, concentracao, comparacao-local, estatisticas, analysis/benford), a ordenação acontece **antes** do corte de top-N/limit.
- `/api/sections` deixa de ter a ordem fixa (linhas 1228–1231). Também incluir `ordem`/`direcao` na chave de cache.
- O parâmetro atual `ordenacao=if|lof` de `/api/anomalies` passa a ser `ordem=score_if|score_lof`, mais as outras colunas.

**Endpoints × tabelas:**

| Endpoint | Tabelas |
|---|---|
| `/api/sections` | SectionsTable |
| `/api/map` | MapTable, UfPanel (UF), VotosPorEstadoPanel |
| `/api/summary` | UfPanel (candidatos) |
| `/api/anomalies` | OutliersPanel, DuplicacaoPanel |
| `/api/consistencia` | ConsistenciaPanel |
| `/api/comparacao-local` | ComparacaoLocalPanel |
| `/api/concentracao` | ConcentracaoPanel (2 tabelas, com ordenação independente) |
| `/api/estatisticas` | EstatisticaPanel (2 tabelas) |
| `/api/analysis` | BenfordPanel, BenfordNiveisPanel |
| `/api/encerramento/*` | EncerramentoView (3 tabelas) |
| `/api/biometria/*` | BiometriaView (2), BiometriaUfPanel |
| `/api/sections/:id` e `/versions` | SecaoView, VersoesBuPanel (2) |
| `/api/relatorio` | RelatorioView (2) |

**Frontend:**
- Novo composable `useOrdenacao()` em `frontend/src/composables/` com estado `{coluna, direcao}`, `alternar`, `ariaSort`. Ele substitui as 5 cópias de `alternar`/`seta`/`sort` (MapTable, VotosPorEstadoPanel, UfPanel, EncerramentoView, BiometriaUfPanel).
- O estado de ordenação entra na `queryKey`/params das queries em `queries.js` e nas chamadas diretas da API nas views.
- Cabeçalho ordenável: `<th :aria-sort>` com um `<button>` dentro, para funcionar pelo teclado. Mantém a seta ↑/↓ e a classe `.ordenavel`.
- Remover o `<select>` "Ordenar por" do `OutliersPanel.vue` e a prop/emit `ordenacao` em `AnaliseSection.vue` e `AnaliseView.vue`.
- O estado inicial de cada tabela fica igual à ordem atual do servidor, sem coluna nova marcada.

**Testes:**
- Integração: o helper/endpoints aceitam colunas da lista branca, rejeitam (400) colunas fora dela, e a ordem vale antes do limit.
- Componente: clicar no cabeçalho alterna a direção e muda os params.

## Tarefa 3 — Larguras fixas das colunas
- Regra global em `styles.css`: `table { table-layout: fixed; width: 100% }`.
- Colunas de texto com `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` e `title` com o texto completo.
- Cada tabela recebe um `<colgroup>` com os % abaixo, **para aprovação**:

| Tabela | Proporções (%) |
|---|---|
| SectionsTable | UF 6 · Município 26 · Zona 8 · Seção 8 · Local 8 · Status 16 · BU recebido 20 · Ação 8 |
| MapTable (sem candidato) | Rótulo 28 · Votos 14 · Válidos 14 · Líder 26 · % líder 10 · Ação 8 |
| MapTable (com candidato) | Rótulo 22 · Votos 10 · Válidos 10 · Líder 20 · % líder 9 · Votos cand. 11 · % cand. 10 · Ação 8 |
| OutliersPanel | UF 6 · Município 30 · Zona 9 · Seção 9 · IF 11 · LOF 11 · Candidato 24 |
| ConsistenciaPanel | UF 6 · Município 28 · Zona 9 · Seção 9 · Regra 28 · Diferença 12 · Ação 8 |
| ComparacaoLocalPanel | UF 6 · Município 26 · Zona 8 · Seção 8 · Part. 12 · Abst. 12 · ΔPart. 14 · ΔAbst. 14 |
| ConcentracaoPanel (ambas) | Pos. 7 · UF 6 · Município 27 · Zona 9 · Seção 9 · 3 métricas 14 cada |
| DuplicacaoPanel | Seções 7 · UF 5 · Município 18 · Local 8 · Zonas 8 · Números 10 · Votáveis 8 · Aptos 8 · Sinalizadores 14 · Candidato 14 |
| BenfordPanel | Candidato 60 · n 20 · MAD 20 |
| BenfordNiveisPanel | Candidato 28 · 6 numéricas 12 cada |
| EstatisticaPanel (1) | Variável 36 · 4 numéricas 16 cada |
| EstatisticaPanel (2) | Candidato 28 · Partido 12 · 5 numéricas 12 cada |
| UfPanel candidatos | Candidato 44 · Partido 20 · Votos 18 · % válidos 18 |
| UfPanel UF (2 tabelas) | UF 14 · Votos 24 · Líder 36 · % líder 16 · Ações 10 |
| VotosPorEstadoPanel | 29 colunas: larguras fixas em rem — Candidato 16rem · cada UF 6rem · Total 8rem (com scroll horizontal) |
| EncerramentoView UF | UF 9 · 7 numéricas 13 cada |
| EncerramentoView municípios | Município 28 · Total 12 · Após 17:15 12 · % 10 · Partido 14 · Votos 12 · % Votos 12 |
| EncerramentoView seções | Zona 10 · Seção 10 · Encerramento 20 · Partido 18 · Votos 14 · % Votos 14 · Detalhe 14 |
| BiometriaUfPanel | 5 colunas, 20 cada |
| BiometriaView municípios | Município 60 · Não habilitada 20 · % 20 |
| BiometriaView seções | Zona 18 · Seção 18 · Não habilitada 24 · % 20 · Detalhe 20 |
| SecaoView | Tipo 12 · Número 10 · Votável 30 · Partido 14 · Categoria 12 · Votos 11 · % válidos 11 |
| VersoesBuPanel (1) | Campo 34 · Anterior 22 · Atual 22 · Diferença 22 |
| VersoesBuPanel (2) | Número 12 · Votável 34 · Anterior 18 · Atual 18 · Diferença 18 |
| RelatorioView (1) | Referência 25 · 5 numéricas 15 cada |
| RelatorioView (2) | Referência 19 · 9 numéricas 9 cada |

- Documentar a regra em `docs/design-system/` (no arquivo de tabelas/módulo correspondente).

## Tarefa 4 — Code review completo (somente leitura → board)
- **Escopo:** `backend/src/**`, `frontend/src/**` e os testes (verificar se há cobertura falsa).
- **Categorias:** dead code, code smells, indícios de bugs, código duplicado, anti-patterns.
- **Já observado** (entra no review):
  - O predicado `!(Number(store.cargo) === 3 && !store.uf)` está repetido 13× em `queries.js`, e o número 3 é mágico.
  - Há 5 implementações duplicadas de ordenação no cliente.
  - `/api/concentracao` aceita 4 aliases para o mesmo limite (`limit/limite/top/top_n`).
  - `routes/index.js` tem 1575 linhas com SQL inline (god file).
  - O handler `@update:level` está inline em `MapaView.vue`.
  - `OutliersPanel.vue` tem uma função `score` com linhas em branco sobrando.
- **Método:**
  - Ler módulo por módulo.
  - Rodar `npm run lint` (se existir) e as suítes `npm test` do backend e do frontend.
  - Usar `graphify` para achar símbolos não referenciados.
- **Saída:** cada achado vira uma Technical Debt no board via skill `plan-to-board`/`jiraya-board`, com arquivo:linha, categoria, severidade, evidência e correção sugerida. **Nada é corrigido** sem aprovação item a item.
- Os itens que se sobrepõem às Tarefas 2 e 3 (duplicação da ordenação) são resolvidos por elas e marcados assim no card.

## Tarefa 5 — Backtrace de features não rastreadas + documentação
- **Levantamento:**
  - Ler os cards existentes do board (skill `jiraya-board`) e o `git log` completo (mensagens e diffs, incluindo `changes.md`).
  - Montar a lista de features entregues que não têm card correspondente.
- **Cards:** criar uma Task por feature, já com status **Done**, contendo:
  - título e descrição;
  - commits de referência (hash);
  - arquivos principais.
- Não serão inventados critérios nem regras: os cards descrevem só o que o código e os commits mostram. Se não der para identificar uma feature com segurança, ela vira Question no board.
- **Documentação** (no final, depois das Tarefas 1–4), sincronizada com o código atual, incluindo as mudanças deste plano:
  - `docs/API.md`, `docs/architecture.md`, `docs/blueprint.md` e `docs/design-system/*.md`;
  - documentos no board (Workflow tool);
  - `README.md`.
- Onde a documentação diverge do código, o código é a referência. Se a divergência for de regra de negócio, ela vira Question no board e não é corrigida por inferência.

## Ordem de execução
1. Copiar o plano para `docs/current-plan.md` e registrar as Tarefas 1–5 no board.
2. Tarefa 1 → commit.
3. Tarefa 2 (backend → frontend → docs/API.md) → commit.
4. Tarefa 3 → commit.
5. Tarefa 4 → cards no board.
6. Tarefa 5: cards de backtrace → atualizar a documentação → commit.
7. `graphify update .` → push ao final.

## Verificação
- `cd backend && npm test` (unit + integration com o banco de teste do projeto) e `cd frontend && npm test`, além do `npm run build` no frontend.
- Checagem manual com `npm run dev`:
  - Governador sem UF: clicar num estado seleciona o estado.
  - Com uma UF selecionada (nível UF): clicar noutro estado troca a seleção.
  - Clicar em cada cabeçalho reordena e a nova ordem vem do servidor (ver a request na aba Network).
  - As larguras não mudam ao trocar de UF/município.
- Limite de chamadas de ferramenta: a execução completa passa de 30 (são 4 tarefas e cerca de 25 arquivos). Cada tarefa será tratada como uma task separada, dentro do limite.
