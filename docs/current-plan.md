# Plano atual — resultado_votavel para 300 milhões de linhas

## 1. Diagnóstico

`resultado_votavel` guarda `bruto jsonb not null` com os 45 campos do BU em texto. Isso duplica o que já está em `boletim_versao`/`secao_eleitoral`, engorda a linha, vai para TOAST e não é indexável por consulta. Para 300 milhões de linhas, o `bruto` é o maior custo isolado da tabela.

A tabela também não tem `ano_eleicao`/`nr_turno`, então toda consulta por eleição precisa do join com `boletim_versao` e `secao_eleitoral`.

## 2. Migração `0002_resultado_votavel_colunas.js`

1. Adicionar colunas anuláveis: `ano_eleicao smallint`, `nr_turno smallint`, `sg_uf varchar(2)`, `cd_municipio_tse integer`, `nr_zona integer`, `nr_secao integer`, `cd_cargo_pergunta integer`.
2. Preencher em lotes (100 mil linhas por `UPDATE ... WHERE ano_eleicao IS NULL`), com os valores de `secao_eleitoral`/`boletim_versao` — são os mesmos valores que estão no `bruto`, sem reparsear JSON.
3. `NOT NULL` via `CHECK ... NOT VALID` + `VALIDATE` (evita lock longo em tabela grande).
4. Remover `bruto`.
5. Índices:
   - `(ano_eleicao, nr_turno)`;
   - `(ano_eleicao, nr_turno, sg_uf, cd_cargo_pergunta)` para mapa/resumo;
   - o índice único `(boletim_versao_id, cd_tipo_votavel, nr_votavel)` já cobre o join por boletim.
6. Em produção, `CREATE INDEX CONCURRENTLY` fora da transação e `VACUUM FULL`/`pg_repack` depois do drop para devolver o espaço do `bruto`.

## 3. Importador

`persistir-bus.js` passa a preencher as sete colunas a partir de `valores` e deixa de gravar `bruto`. O arquivo original e `nr_linha_origem` continuam sendo a proveniência.

## 4. Outras soluções de performance (para avaliar depois)

1. **Particionar por `(ano_eleicao, nr_turno)`** — poda por eleição; a chave única passa a incluir ano/turno.
2. **Remover `lote_id` da linha** — 16 bytes × 300M (~5 GB); o lote vem de `boletim_versao`.
3. **Dimensão de votável** (`ano, turno, cargo, nr_votavel, nm, partido`) — tira `nm_votavel`, `nm_partido`, `sg_partido`, `ds_tipo_votavel` da tabela grande (~15–20 GB).
4. **Índice de cobertura** `(ano_eleicao, nr_turno, cd_cargo_pergunta, sg_uf, nr_votavel) INCLUDE (qt_votos, categoria)` para varredura only-index no mapa e no resumo.
5. **Carga por `COPY` em tabela UNLOGGED** e `INSERT ... SELECT` depois; `synchronous_commit=off`, `maintenance_work_mem` e `max_wal_size` altos durante a carga.
6. **Pré-agregados** por eleição/cargo/UF/município/candidato para o painel; a auditoria continua na tabela de seção.
7. **Autovacuum agressivo** e `fillfactor 100` (tabela só de inserção).
8. **Remover a PK `id`** se nada a referencia — 8 bytes + índice.
9. **`CLUSTER`/ordenação física** por `(ano_eleicao, nr_turno, sg_uf)` depois da carga, para leitura sequencial.

## 5. Testes e documentação

- Migração: schema com as colunas e índices, `bruto` ausente.
- Importação: linhas com ano/turno/UF/município/zona/seção/cargo preenchidos e sem `bruto`.
- API: resumo/mapa/anomalias continuam passando.
- Docs: `docs/architecture.md`, `docs/blueprint.md` e `docs/API.md`; card no board.
