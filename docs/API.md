# API de leitura

Todas as rotas são `GET` sob `/api`, sem autenticação, e respondem JSON. O corte é opcional e aceita `as_of` (ISO 8601 com offset, precisão de hora) **ou** `as_of_date` (`YYYY-MM-DD`, precisão de dia); sem eles, o corte é o final.

Parâmetros comuns: `election_id` (uuid, obrigatório), `cargo` (inteiro, obrigatório), `uf` (2 letras), `municipio` (código TSE).

## `GET /api/elections`

Lista as eleições e os cargos com BU importado. Só devolve cargos `Presidente` e `Governador`.

```json
{ "eleicoes": [{ "id": "…", "ano_eleicao": 2026, "nr_turno": 1, "ds_eleicao": "…", "cargos": [{ "cd_cargo_pergunta": 1, "ds_cargo_pergunta": "Presidente" }] }] }
```

## `GET /api/summary`

Votos por votável, métricas de seção, seções com BU, corte, metadados de lote e avisos.

```json
{
  "corte": { "tipo": "final", "as_of": null, "as_of_date": null, "fuso_exibicao": "America/Sao_Paulo" },
  "captured_at": "…", "source_updated_at": "…", "lotes": [],
  "avisos": [],
  "secoes_com_bu": 17528,
  "votos": [{ "nr_votavel": 13, "categoria": "nominal", "qt_votos": 2177225, "percentual": 48.83, "cor_hex": "#…" }],
  "metricas": { "qt_aptos": 5854479, "qt_comparecimento": 4661307, "qt_abstencoes": 0, "bus_considerados": 17528 }
}
```

## `GET /api/timeline`

Série acumulada do dia por intervalo (`granularity=1m|5m`, padrão `5m`). Com `por_candidato=true`, devolve também uma série acumulada por candidato nominal.

```json
{
  "granularity": "5m",
  "pontos": [{ "t": "2026-10-04T20:05:00.000Z", "votos_acumulados": 1232, "secoes_com_bu_acumuladas": 8 }],
  "series": [{ "nr_votavel": 13, "nm_votavel": "…", "pontos": [{ "t": "…", "votos_acumulados": 900 }] }]
}
```

O traçado usa o dia inteiro, independentemente do corte; o corte é desenhado como linha vertical.

## `GET /api/map`

Totais por área. `level=uf|municipio`; `candidatos` é uma lista de números separados por vírgula para incluir no detalhe da área. Cada área traz `geom_id` (código IBGE) quando a malha foi carregada.

```json
{ "level": "uf", "areas": [{ "sg_uf": "AM", "geom_id": "13", "total_votos": 0, "votos_validos": 0, "lider": { "nr_votavel": 13, "qt_votos": 0, "percentual": 0 }, "candidatos": [] }] }
```

## `GET /api/sections`

Seções eleitorais paginadas. `busca` procura por município, zona ou seção; `status` filtra pelo status calculado no corte; `page` e `page_size` paginam.

```json
{ "page": 1, "page_size": 25, "total": 17528, "items": [{ "id": "…", "sg_uf": "AC", "nm_municipio": "…", "nr_zona": 9, "nr_secao": 1, "status": "bu_recebido", "motivo": null }] }
```

## `GET /api/sections/:id`

Detalhe da seção: identificação, status, BU ativo (com `qt_aptos`, `qt_comparecimento` e `qt_elei_biom_sem_habilitacao`), resultados por votável, lote (arquivo e SHA-256) e contagem de versões anteriores.

## `GET /api/analysis`

Duas leituras no recorte e no corte atuais.

```json
{
  "biometria": {
    "secoes": 17528, "secoes_sem_campo": 0,
    "qt_aptos": 5854479, "qt_comparecimento": 4661307,
    "qt_habilitados_por_biometria": 4389964,
    "qt_biometria_nao_habilitada": 271343,
    "percentual_comparecimento": 79.62,
    "percentual_habilitada": 94.18,
    "percentual_nao_habilitada": 5.82
  },
  "benford": {
    "minimo_votos": 10,
    "candidatos": [{ "nr_votavel": 13, "nm_votavel": "…", "sg_partido": "PT", "total_votos": 0, "n": 17520, "secoes_abaixo_minimo": 8, "mad": 0.0881, "classificacao": "não conformidade", "digitos": [{ "digito": 1, "observado": 0, "observado_percentual": 0, "esperado_percentual": 30.103 }] }]
  }
}
```

`qt_habilitados_por_biometria` é `qt_comparecimento − qt_biometria_nao_habilitada`. O campo `QT_ELEI_BIOM_SEM_HABILITACAO` do BU conta eleitores **com** biometria que não foram habilitados por ela; não há biometria por candidato e a API não rateia.

Benford usa o primeiro dígito dos votos por seção com 10 votos ou mais, a distribuição esperada `log10(1 + 1/d)` e o MAD de Nigrini (0,006 / 0,012 / 0,015). É leitura descritiva, não prova de fraude.

## `GET /api/anomalies`

Benford por nível, duplicação de vetor de votos e outliers por seção, no corte e no recorte.

- `benford_niveis`: por candidato, `niveis.secao`, `niveis.zona` e `niveis.municipio`, cada um com `n`, `mad`, `classificacao` e `digitos`; mínimo de 10 votos por unidade.
- `duplicacao`: `grupos` com a mesma assinatura do vetor de votos, `mesma_zona`, `secoes_consecutivas` e `mesmo_municipio`.
- `outliers`: `features` (7), `isolamento` (100 árvores, amostra 256, limiar 0,6), `lof` (k 10, amostra até 2.000, limiar 2) e as 20 seções com maior score.

`GET /api/sections` aceita `municipio_nome` (nome parcial), `zona` e `secao` como filtros separados, além de `uf` e `municipio`.
