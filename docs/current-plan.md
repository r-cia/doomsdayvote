# Plano atual — análises de anomalia

## 1. Benford multi-nível

- Por candidato nominal, primeiro dígito, em três níveis: **seção** (≥10 votos), **zona** (soma da zona ≥10) e **município** (soma do município ≥10).
- Cada nível devolve n, MAD e classificação de Nigrini; a UF fica de fora (27 números não sustentam Benford).
- Reusa `calcularBenford` (cálculo puro já testado).

## 2. Duplicação e proximidade

- Assinatura por seção: vetor canônico de todos os votáveis do BU (tipo, número, votos), com SHA-256.
- Grupos com a mesma assinatura em ≥2 seções.
- Cada grupo marca `mesma_zona`, `secoes_consecutivas` (mesma zona, |Δseção| ≤ 1) e `mesmo_municipio`.
- Seções sem BU ficam fora.

## 3. Isolation Forest e Local Outlier Factor

- Unidade: seção. Sete features: comparecimento/aptos, abstenção/aptos, biometria não habilitada/comparecimento, hora de recebimento (minutos desde o primeiro BU), tamanho da seção (aptos, log), share do líder e concentração (HHI dos votos por candidato).
- Isolation Forest: 100 árvores, subamostra 256, semente fixa; score 0–1; limiar 0,6.
- LOF: k = 10, distância euclidiana em features padronizadas por mediana/IQR; cálculo em amostra determinística de até 2.000 seções (acima disso, `lof_limitado: true`).
- Implementação em JS puro, sem dependência nova. Scores são descritivos: a interface fala em **anomalia**, nunca em fraude.

## 4. API e interface

- `GET /api/anomalies` no corte e no recorte atuais, devolvendo `benford_niveis`, `duplicacao` e `outliers`.
- Nova rota **Auditoria** no frontend (nav), com os três painéis: matriz candidato × nível de Benford, lista de grupos duplicados com as seções e os sinalizadores de proximidade, e ranking das seções mais anômalas com os dois scores.
- O painel continua sendo o primeiro viewport; a auditoria fica a um clique.

## 5. Testes e documentação

- Unidade: Benford por nível, assinatura de duplicação, Isolation Forest e LOF (determinismo, score no intervalo, outlier sintético detectado).
- Integração: `/api/anomalies` com o fixture, incluindo um par de seções com vetor idêntico.
- Frontend: os três painéis e a navegação.
- Docs: `docs/API.md`, `blueprint.md` e `architecture.md`; cards no board.

---

# Estratégia de otimização — `resultado_votavel` (≈300M registros)

## Diagnóstico (fatos verificados no código)

- `bruto jsonb NOT NULL` guarda a linha origem integral (31/42/45 campos string conforme o leiaute `BWEB_2014_31`/`BWEB_2018_42`/`BWEB_45`), serializada em `persistir-bus.js` (`bruto: JSON.stringify(registro.bruto)`).
- A coluna é apenas escrita: nenhuma rota, script ou módulo de análise lê `resultado_votavel.bruto`; a única referência é o teste de integração que valida o tipo da coluna.
- A procedência já existe sem a coluna: todo arquivo importado é copiado verbatim para `storage/originais/<sha256>` (`armazenarOriginal`, `COPYFILE_EXCL`) e registrado em `lote_importacao.caminho_armazenado` + `sha256`; qualquer `bruto` é reconstrutível exato via `lote_id` + `nr_linha_origem`.
- ~90% dos campos brutos são de nível BU e se repetem nas 4–7 linhas de votáveis do mesmo boletim.
- O índice `resultado_votavel_boletim_idx` (`boletim_versao_id`) é redundante: a unique `resultado_votavel_chave_unica` já indexa `boletim_versao_id` como coluna líder.
- `lote_id` (uuid, 16 B + FK) repete `boletim_versao.lote_id`: ambos recebem o mesmo `loteId` na mesma transação de `persistir-bus.js`.

## Estimativa atual (a validar na Fase 0)

| componente | por linha | em 300M |
|---|---|---|
| `bruto` jsonb | ~1,2–2 KB | ~350–600 GB |
| colunas tipadas + textos | ~150–200 B | ~45–60 GB |
| índice redundante | — | ~10–15 GB |
| **total projetado** | | **~400–680 GB** |

## Camada 1 — destino do `bruto` (decisão principal)

| opção | descrição | espaço final (bruto) |
|---|---|---|
| **A — remover a coluna** (recomendada) | reconstrução sob demanda a partir do arquivo arquivado (sha256) + `nr_linha_origem`; nenhum leitor atual é afetado; exige verificação de integridade (sha256) dos originais como passo do pipeline | 0 |
| B — `bytea` comprimido na mesma tabela | zstd/lz4 aplicacional do JSON canônico; continua não consultável (como hoje) | ~30–60 GB |
| C — tabela-fria 1:1 `resultado_votavel_bruto` | PK/FK + `bytea` comprimido; tabela quente estreita (scan/vacuum/reindex baratos); bruto isolado para offload futuro (combina com B) | ~30–60 GB |
| D — bruto por boletim, não por linha | elimina a duplicação intra-BU; campos de votável já estão nas colunas tipadas | ~60–120 GB |

Quick win independente da decisão (PG ≥ 14): `ALTER TABLE resultado_votavel ALTER COLUMN bruto SET COMPRESSION lz4` — afeta só linhas novas; ganho modesto (~1,5–2,5×; jsonb comprime pior que texto).

Impacto em código da opção A: `persistir-bus.js` (remove o campo do insert) e `tests/integration/schema.test.js` (assertiva de tipo e insert).

## Camada 2 — colunas tipadas

1. Drop do índice redundante `resultado_votavel_boletim_idx` (ganho puro, imediato).
2. Drop de `lote_id` após anti-join de verificação contra `boletim_versao.lote_id`.
3. (Opcional) dimensão `votavel` (`nm_votavel`, `nr/sg/nm_partido`) com FK inteira: remove ~25–45 GB de texto duplicado; toca as queries de leitura (join).

## Camada 3 — design físico para 300M

- **Particionar ANTES da carga total** (converter depois = reescrita completa):
  - HASH(`boletim_versao_id`) ×16–32 — mantém a unique natural (inclui a chave de particionamento); PK vira (`boletim_versao_id`, `id`); divide vacuum/reindex; pruning nos joins por boletim. **Recomendado.**
  - RANGE(`id`) — permitiria desanexar eleições antigas, mas a unique natural teria de incluir `id` → perde o dedup garantido pelo banco. Não recomendado.
- Sem particionamento: usar `pg_repack` (nunca `VACUUM FULL`) nas reescritas.
- `fillfactor` 100 (carga append-only); autovacuum orientado a insert por tabela (`autovacuum_vacuum_insert_scale_factor` baixo).
- `DROP COLUMN` é metadata-only; o espaço só retorna com `VACUUM FULL`/`pg_repack` — ou troca por tabela nova + swap.

## Camada 4 — futuro (opcional)

Colunar (Citus columnar / Hydra) ou compressão Timescale se scans analíticos virarem gargalo — desnecessário se as camadas 1–3 caírem.

## Fases (online, uma migração por fase)

0. **Medição**: `pg_column_size(bruto)` em amostra por leiaute; `pg_total_relation_size`; versão do PG (suporte a lz4).
1. **0002**: drop do índice redundante (+ `lote_id` pós-verificação).
2. **0003**: destino do `bruto` (A/B/C/D) + backfill em lotes por faixa de `id`, se aplicável.
3. (Opcional) dimensão `votavel`.
4. (Se aprovado) particionamento — antes da carga dos 300M.

**Estado final esperado (A + Camada 2): heap ~25–35 GB + índices ~20–25 GB, contra ~400–680 GB projetados.**

## Decisões pendentes (usuário)

1. `bruto`: A, B, C ou D?
2. Particionar por HASH(`boletim_versao_id`) ou manter tabela única?
3. Camada 2: só índice + `lote_id`, ou também dimensão `votavel`?
