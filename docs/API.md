# API de leitura

Todas as rotas são `GET` sob `/api`, sem autenticação, e respondem JSON. O corte é opcional e aceita `as_of` (ISO 8601 com offset, precisão de hora) **ou** `as_of_date` (`YYYY-MM-DD`, precisão de dia); sem eles, o corte é o final.

Parâmetros comuns: `election_id` (uuid, obrigatório), `cargo` (inteiro, obrigatório), `uf` (2 letras), `municipio` (código TSE).

As leituras passam por cache Redis com chave pelo recorte exato. O cabeçalho `x-cache` indica `hit` (veio do Redis), `miss` (foi ao banco e gravou) ou `off` (Redis ausente ou indisponível). A conclusão de uma carga invalida o cache inteiro.

## Ordenação

Toda rota que alimenta uma tabela aceita `ordem` (coluna) e `direcao` (`asc` ou `desc`, padrão `asc` quando há `ordem`). A ordenação ocorre no servidor, sobre todo o conjunto, antes de limite, top-N ou paginação; valores nulos ficam por último nas duas direções e o desempate é estável. `ordem` fora da lista da rota ou `direcao` inválida retorna 400 `VALIDATION`. Sem `ordem`, a ordem é a padrão de cada rota. `ordem` e `direcao` entram na chave de cache. Rotas com mais de uma tabela usam um sufixo (`ordem_<sufixo>`, `direcao_<sufixo>`).

| Rota | Parâmetro | Colunas permitidas | Padrão sem `ordem` |
| :-- | :-- | :-- | :-- |
| `/api/sections` | `ordem` | `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `nr_local_votacao`, `status`, `bu_recebido` | `sg_uf`, `cd_municipio_tse`, `nr_zona`, `nr_secao` |
| `/api/summary` (`votos`) | `ordem` | `nm_votavel`, `sg_partido`, `qt_votos`, `percentual` | `qt_votos` desc |
| `/api/map` (`areas`) | `ordem` | `sg_uf`, `nm_municipio`, `total_votos`, `votos_validos`, `lider_percentual`, `lider_nome`, `candidato_votos`, `candidato_percentual` | ordem de cálculo das áreas |
| `/api/analysis` | `ordem` (`benford.candidatos`) | `nm_votavel`, `n`, `mad` | `total_votos` desc |
| `/api/analysis` | `ordem_biometria_uf` (`biometria_uf`) | `sg_uf`, `qt_habilitados_por_biometria`, `percentual_habilitada`, `qt_biometria_nao_habilitada`, `percentual_nao_habilitada` | `sg_uf` |
| `/api/anomalies` | `ordem` (`outliers.secoes`, top 20 depois de ordenar) | `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `score_if`, `score_lof`, `candidato` | `score_if` desc |
| `/api/anomalies` | `ordem_duplicacao` (`duplicacao.grupos`, top 50 depois de ordenar) | `secoes`, `sg_uf`, `nm_municipio`, `nr_local_votacao`, `votaveis`, `candidato` | quantidade de seções desc |
| `/api/anomalies` | `ordem_benford` (`benford_niveis.candidatos`) | `nm_votavel`, `secao_n`, `secao_mad`, `zona_n`, `zona_mad`, `municipio_n`, `municipio_mad` | `total_votos` desc |
| `/api/consistencia` | `ordem` (antes da paginação) | `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `regra`, `diferenca` | ordem de cálculo |
| `/api/estatisticas` | `ordem` (`candidatos` de cada bloco) | `nm_votavel`, `sg_partido`, `secoes`, `secoes_zero`, `media`, `mediana`, `desvio` | `media` desc |
| `/api/comparacao-local` | `ordem` (`secoes` dentro de cada grupo; a ordem dos grupos não muda) | `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `participacao`, `abstencao`, `participacao_pp`, `abstencao_pp` | ordem de cálculo |
| `/api/concentracao` | `ordem_share` (`top_share`), `ordem_margem` (`top_margem`); top-N escolhido depois de ordenar todas as seções | `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `share_lider`, `margem_absoluta`, `margem_pp`, `share_lider_percentil` | `share_lider` desc / `margem_absoluta` desc |
| `/api/encerramento/urnas` | `ordem` | `sg_uf`, `total`, `ate_1715`, `pct_1715`, `ate_1915`, `pct_1915`, `apos_1915`, `pct_apos_1915` | `sg_uf` |
| `/api/encerramento/municipios` | `ordem` (antes de `limit`) | `nm_municipio`, `total`, `apos_1715`, `pct_apos_1715`, `partido`, `votos`, `pct_votos` | `pct_apos_1715` desc |
| `/api/encerramento/secoes` | `ordem` (antes de `limit`) | `nr_zona`, `nr_secao`, `dt_encerramento`, `partido`, `votos`, `pct_votos` | após 17:15 primeiro, depois `dt_encerramento` desc |
| `/api/biometria/municipios` | `ordem` (antes de `limit`) | `nm_municipio`, `qt_comparecimento`, `qt_nao_habilitada`, `percentual_nao_habilitada` | `qt_nao_habilitada` desc |
| `/api/biometria/secoes` | `ordem` (antes de `limit`) | `nr_zona`, `nr_secao`, `qt_comparecimento`, `qt_nao_habilitada`, `percentual_nao_habilitada` | `percentual_nao_habilitada` desc |
| `/api/sections/:id` | `ordem` (`resultados`) | `cd_tipo_votavel`, `nr_votavel`, `nm_votavel`, `sg_partido`, `categoria`, `qt_votos`, `percentual` | `qt_votos` desc |
| `/api/sections/:id/versions` | `ordem_campos` (`comparacao.campos_alterados`), `ordem_votaveis` (`comparacao.votaveis_alterados`) | `campo`, `anterior`, `atual`, `diferenca` / `nr_votavel`, `nm_votavel`, `anterior`, `atual`, `diferenca` | ordem de cálculo |
| `/api/relatorio` | `ordem` (`referencias`; `alvo` não participa) | `referencia`, `bus`, `participacao_pct`, `diferenca_participacao`, `abstencao_pct`, `diferenca_abstencao`, `data_hora`, `somente_data`, `ausente`, `outra_precisao`, `sem_encerramento`, `antes_encerramento`, `antes_emissao`, `mediana_atraso_min`, `p90_atraso_min` | `ano_eleicao` desc, `nr_turno` desc |

`/api/anomalies` deixou de aceitar `ordenar_por` (`if`/`lof`): use `ordem=score_if` ou `ordem=score_lof` com `direcao=desc`. `/api/biometria/*` e `/api/encerramento/municipios` deixaram de aceitar `ordenar_por`; use `ordem` e `direcao`.

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

Totais por área. `level=uf|municipio`; `candidatos` é uma lista de números separados por vírgula para incluir no detalhe da área. Cada área traz `geom_id` (código IBGE) quando a malha foi carregada, `lider_nome` (nome do líder, de `somarVotos`) e, quando `candidatos` é informado, `candidato_votos` e `candidato_percentual` do primeiro número da lista (nulos caso contrário ou se a área não o tem).

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

Consistência aritmética por seção no BU ativo: `comparecimento_vs_votos`, `aptos_vs_comparecimento_abstencao`, `comparecimento_vs_aptos`, `biometria_vs_comparecimento`. Retorna apenas as regras divergentes (uma linha por regra), com `cobertura` (consideradas, avaliadas, sem divergência, com divergência, sem campo e divergências por regra), `indice_consistencia` de 0 a 100 arredondado a uma casa decimal e `limitacoes`. Aceita `regra`, `page` e `page_size`. Ausência de campo ou de resultados não é tratada como zero.

```json
{ "corte": { "tipo": "final" }, "cobertura": { "consideradas": 100, "com_divergencia": 2, "sem_campo_por_regra": { "comparecimento_vs_votos": 0 } }, "limitacoes": [], "page": 1, "page_size": 50, "total": 2, "itens": [{ "secao": { "id": "…", "sg_uf": "AC" }, "regra": "comparecimento_vs_votos", "diferenca": 3, "campos": ["qt_comparecimento", "qt_votos"], "valores": { "qt_comparecimento": 80, "soma_qt_votos": 83 }, "bu": { "id": "…", "versao": 1, "lote": { "id": "…", "nome": "…" }, "sha256": "…", "timestamps": {} } }] }
```

O índice conta cada BU no máximo uma vez: entra na base se pelo menos uma regra puder ser verificada e conta como consistente se nenhuma regra verificável divergir. A cobertura é exibida separadamente; o índice não é probabilidade nem conclusão sobre fraude.

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

## `GET /api/relatorio`

Usa os parâmetros comuns. `alvo` contém apenas o `election_id`, ano, turno, cargo e escopo selecionados, no corte atual. `participacao_pct` e `abstencao_pct` são nulos quando faltam campos para compor o total sem lacunas. `recebimento` informa cobertura por precisão, horários ausentes, recebimento anterior ao encerramento/emissão e mediana/P90 do atraso em minutos; o atraso só considera BUs com hora precisa e os dois horários disponíveis.

Em corte final, `referencias` lista cada outra eleição compatível com cargo, tipo de eleição e escopo como linha independente, sempre com seus dados finais ativos. Não agrupa anos, turnos ou `election_id`. Em corte parcial, `referencias` fica vazio e `comparacao_final_disponivel` é `false` para evitar comparação de bases temporais diferentes.

```json
{
  "alvo": {
    "election_id": "…", "ano_eleicao": 2026, "nr_turno": 1, "cd_eleicao": 6257,
    "bus": 100, "participacao_pct": 78.4, "abstencao_pct": 21.6,
    "cobertura": { "sem_aptos": 0, "sem_comparecimento": 0, "sem_abstencoes": 0 },
    "recebimento": {
      "data_hora": 100, "somente_data": 0, "ausente": 0, "outra_precisao": 0, "sem_encerramento": 0,
      "antes_encerramento": 0, "antes_emissao": 0,
      "mediana_atraso_min": 93.4, "p90_atraso_min": 165.2
    }
  },
  "comparacao_final_disponivel": true,
  "referencias": [{
    "election_id": "…", "ano_eleicao": 2022, "nr_turno": 1, "cd_eleicao": 544,
    "bus": 98, "participacao_pct": 80.1, "abstencao_pct": 19.9,
    "cobertura": {}, "recebimento": {}
  }]
}
```

Recebimento anterior ao encerramento/emissão é um sinal cronológico para revisão. A API não o converte em conclusão sobre fraude nem o inclui no índice aritmético.
