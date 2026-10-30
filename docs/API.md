# API de leitura

Todas as rotas são `GET` sob `/api`, sem autenticação, e respondem JSON. O corte é opcional e aceita `as_of` (ISO 8601 com offset, precisão de hora) **ou** `as_of_date` (`YYYY-MM-DD`, precisão de dia); sem eles, o corte é o final.

Parâmetros comuns: `election_id` (uuid, obrigatório), `cargo` (inteiro, obrigatório), `uf` (2 letras), `municipio` (código TSE).

As leituras passam por cache Redis com chave pelo recorte exato. O cabeçalho `x-cache` indica `hit` (veio do Redis), `miss` (foi ao banco e gravou) ou `off` (Redis ausente ou indisponível). A conclusão de uma carga invalida o cache inteiro.

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
    "candidatos": [{ "nr_votavel": 13, "nm_votavel": "…", "sg_partido": "PT", "total_votos": 0, "n": 17520, "secoes_abaixo_minimo": 8, "mad": 0.0881, "digitos": [{ "digito": 1, "observado": 0, "observado_percentual": 0, "esperado_percentual": 30.103 }] }],
    "status_metodologico": "em_validacao",
    "observacao": "Leitura exploratória, sem rótulo de conformidade; metodologia em validação."
  }
}
```

`qt_habilitados_por_biometria` é `qt_comparecimento − qt_biometria_nao_habilitada`. O campo `QT_ELEI_BIOM_SEM_HABILITACAO` do BU conta eleitores **com** biometria que não foram habilitados por ela; não há biometria por candidato e a API não rateia.

Benford usa o primeiro dígito dos votos por seção com 10 votos ou mais, a distribuição esperada `log10(1 + 1/d)` e o MAD de Nigrini (0,006 / 0,012 / 0,015). É leitura descritiva, não prova de fraude.

`/api/analysis` também retorna `cobertura` (seções consideradas, BUs sem campos) e `limitacoes`.

## `GET /api/anomalies`

Benford por nível, duplicação de vetor de votos e outliers por seção, no corte e no recorte.

- `benford_niveis`: por candidato, `niveis.secao`, `niveis.zona` e `niveis.municipio`, cada um com `n`, `mad` e `digitos`; mínimo de 10 votos por unidade; `status_metodologico: em_validacao` e `observacao`.
- `duplicacao`: `grupos` com a mesma assinatura do vetor de votos, `mesma_zona`, `mesmo_municipio`, `mesmo_local`, `secoes_consecutivas`; cada seção inclui `nr_local_votacao`, `qt_aptos` e `qt_comparecimento`; `total_secoes_escopo` e `observacao` sobre frequência esperada por escala. Sem rótulo de alerta.
- `outliers`: `features` (6), `parametros` (`isolamento`: 100 árvores, amostra 256; `lof`: k 10, amostra até 2.000) e as 20 seções com maior score. Sem rótulos de limiar.

`GET /api/sections` aceita `municipio_nome` (nome parcial), `zona` e `secao` como filtros separados, além de `uf` e `municipio`.

`/api/anomalies` também retorna `cobertura` (seções consideradas, grupos de duplicação, outliers limitados) e `limitacoes`.

## `GET /api/consistencia`

Consistência aritmética por seção no BU ativo: `comparecimento_vs_votos`, `aptos_vs_comparecimento_abstencao`, `comparecimento_vs_aptos`, `biometria_vs_comparecimento`. Retorna apenas as regras divergentes (uma linha por regra), com `cobertura` (consideradas, com divergência, sem campo por regra) e `limitacoes`. Aceita `regra`, `page` e `page_size`. Ausência de campo não é tratada como zero e não gera divergência.

```json
{ "corte": { "tipo": "final" }, "cobertura": { "consideradas": 100, "com_divergencia": 2, "sem_campo_por_regra": { "comparecimento_vs_votos": 0 } }, "limitacoes": [], "page": 1, "page_size": 50, "total": 2, "itens": [{ "secao": { "id": "…", "sg_uf": "AC" }, "regra": "comparecimento_vs_votos", "diferenca": 3, "campos": ["qt_comparecimento", "qt_votos"], "valores": { "qt_comparecimento": 80, "soma_qt_votos": 83 }, "bu": { "id": "…", "versao": 1, "lote": { "id": "…", "nome": "…" }, "sha256": "…", "timestamps": {} } }] }
```

`GET /api/sections/:id` inclui `consistencia`: array com todas as regras e seus status (`ok`, `divergente`, `dados_insuficientes`) para o BU ativo.

## GET /api/estatisticas

Parâmetros: `election_id`, `cargo`, `as_of` opcional, `uf` opcional, `municipio` opcional, `escopo` (`turno` por padrão ou `ano`).

Quando `escopo=ano` e o ano tem dois turnos, devolve dois blocos lado a lado, sem somá-los.

Cada bloco traz `comparecimento` (média, mediana e desvio padrão populacional dos `qt_comparecimento` por seção) e `candidatos` (para cada candidato nominal, média, mediana e desvio padrão populacional dos votos por seção). `secoes` é o número de seções do recorte; `secoes_com_voto` é o número de seções em que o candidato teve algum voto. Cache Redis TTL 300 s, cabeçalho `x-cache: hit|miss|off`.

`/api/estatisticas` também retorna `cobertura` (seções consideradas) e `limitacoes`.

## `GET /api/sections/:id/versions`

Histórico de versões do BU da seção. Retorna todas as versões com metadados, totais e votos por votável, além da comparação entre a versão ativa e a anterior imediata (ou a versão indicada em `comparar_com`).

```json
{
  "corte": { "tipo": "final" },
  "secao": { "id": "…", "sg_uf": "AC", "nr_zona": 9, "nr_secao": 1 },
  "versoes": [
    {
      "versao": 1,
      "ativo": true,
      "substitui_versao_id": null,
      "dt_geracao": "…",
      "dt_abertura": "…",
      "dt_encerramento": "…",
      "dt_emissao_bu": "…",
      "dt_bu_recebido_ts": "…",
      "dt_bu_recebido_data": null,
      "precisao": "DATA_HORA",
      "qt_aptos": 100,
      "qt_comparecimento": 80,
      "qt_abstencoes": 20,
      "qt_elei_biom_sem_habilitacao": 10,
      "cd_tipo_urna": 1,
      "ds_tipo_urna": "…",
      "lote": { "id": "…", "nome_arquivo": "…", "sha256": "…" },
      "conteudo_sha256": "…",
      "imported_at": "…",
      "resultados": [{ "nr_votavel": 13, "nm_votavel": "…", "qt_votos": 50 }]
    }
  ],
  "comparacao": {
    "anterior": 1,
    "atual": 2,
    "campos_alterados": [{ "campo": "qt_comparecimento", "anterior": 80, "atual": 81, "diferenca": 1 }],
    "votaveis_alterados": [{ "nr_votavel": 13, "nm_votavel": "…", "anterior": 50, "atual": 51, "diferenca": 1 }],
    "causa": null,
    "observacao": "A ferramenta não presume a causa da diferença."
  }
}
```

Ausência de campo não é tratada como zero. A ferramenta não presume a causa da diferença entre versões.

## `GET /api/comparacao-local`

Comparações locais entre seções semelhantes. Grupos formados por local de votação, com fallback para zona e município quando a amostra for insuficiente; controle de escala por aptos (±50% da mediana do grupo); mínimo de 5 seções por grupo. Sem limiares de alerta. Métricas relativas: participação, abstenção e share por candidato, com distância em pontos percentuais e percentil. Grupos com menos de 5 seções recebem estado `dados_insuficientes`.

```json
{
  "corte": { "tipo": "final" },
  "cobertura": { "consideradas": 100, "com_grupo": 95, "sem_grupo": 5, "grupos": 10, "grupos_insuficientes": 2 },
  "limitacoes": [],
  "page": 1,
  "page_size": 50,
  "total": 10,
  "grupos": [
    {
      "nivel": "local",
      "tamanho": 8,
      "estado": "ok",
      "dados_insuficientes": false,
      "metricas_grupo": { "participacao": { "mediana": 0.8 }, "abstencao": { "mediana": 0.2 }, "candidatos": [] },
      "secoes": [
        {
          "secao": { "id": "…", "sg_uf": "AC", "nr_zona": 9, "nr_secao": 1 },
          "metricas": { "participacao": 0.82, "abstencao": 0.18, "candidatos": [] },
          "distancia_pp": { "participacao": 2.0, "abstencao": -2.0 },
          "percentil": { "participacao": 75.0 }
        }
      ]
    }
  ]
}
```

## `GET /api/concentracao`

Concentração do candidato mais votado e margem para o segundo colocado por seção, contextualizadas por grupo comparável (reuso da comparação local) ou faixa de aptos. Sem limiares de alerta. Retorna top N (padrão 20) por participação e por margem, com contexto (percentil e z-score) e cobertura.

```json
{
  "corte": { "tipo": "final" },
  "cobertura": { "consideradas": 100, "com_contexto": 95, "sem_contexto": 5, "grupos": 10, "grupos_insuficientes": 2, "faixas_aptos": 4 },
  "limitacoes": [],
  "page": 1,
  "page_size": 50,
  "total": 20,
  "top_share": [
    {
      "secao": { "id": "…", "sg_uf": "AC", "nr_zona": 9, "nr_secao": 1 },
      "share_lider": 0.72,
      "margem_segundo": 120,
      "margem_pp": 14.5,
      "contexto": { "origem": "grupo_comparavel", "estado": "ok", "share_lider_percentil": 90.0, "share_lider_z": 1.4 }
    }
  ],
  "top_margem": []
}
```

Ausência de campo não é tratada como zero. A ferramenta não define limiares de alerta; os resultados são descritivos.
