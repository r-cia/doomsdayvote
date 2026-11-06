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

O traçado respeita o corte: a curva termina no instante ou na data do corte. Sem pontos, a resposta traz o aviso `CORTE_INDISPONIVEL`.

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
    "candidatos": [{ "nr_votavel": 13, "nm_votavel": "…", "sg_partido": "PT", "total_votos": 0, "n": 17520, "secoes_abaixo_minimo": 8, "mad": 0.0881, "monte_carlo": { "simulacoes": 10000, "p_valor": 0.0001, "faixa_digitos": [{ "digito": 1, "p025": 0.29, "p975": 0.31 }] }, "digitos": [{ "digito": 1, "observado": 0, "observado_percentual": 0, "esperado_percentual": 30.103 }] }]
  }
}
```

`qt_habilitados_por_biometria` é `qt_comparecimento − qt_biometria_nao_habilitada`. O campo `QT_ELEI_BIOM_SEM_HABILITACAO` do BU conta eleitores **com** biometria que não foram habilitados por ela; não há biometria por candidato e a API não rateia.

Benford usa o primeiro dígito dos votos por seção com 10 votos ou mais, a distribuição esperada `log10(1 + 1/d)` e o desvio absoluto médio (MAD) de Nigrini. O p-valor exploratório (`monte_carlo.p_valor`) vem de 10.000 simulações determinísticas condicionadas ao total de contagens, e `monte_carlo.faixa_digitos` traz a faixa de 95% da proporção por dígito. A resposta não traz classificação de conformidade. É leitura descritiva, não prova de fraude.

## `GET /api/anomalies`

Benford por nível, duplicação de vetor de votos e outliers por seção, no corte e no recorte.

- `benford_niveis`: por candidato, `niveis.secao`, `niveis.zona` e `niveis.municipio`, cada um com `n`, `mad`, `monte_carlo` e `digitos`; mínimo de 10 votos por seção, zona e município (os valores abaixo do mínimo saem do cálculo e as seções excluídas são contadas em `secoes_abaixo_minimo`).
- `duplicacao`: `grupos` com a mesma assinatura do vetor de votos, `mesma_zona`, `secoes_consecutivas` e `mesmo_municipio`.
- `outliers`: `features` (6: participação, biometria, hora, tamanho, participação do líder e concentração), `isolamento` (100 árvores, amostra 256, limiar 0,6), `lof` (k 10, amostra até 5.000, limiar 2) e as 20 seções com maior score.

`GET /api/sections` aceita `municipio_nome` (nome parcial), `zona` e `secao` como filtros separados, além de `uf` e `municipio`.

## GET /api/estatisticas

Parâmetros: `election_id`, `cargo`, `as_of` opcional, `uf` opcional, `municipio` opcional, `escopo` (`turno` por padrão ou `ano`).

Quando `escopo=ano` e o ano tem dois turnos, devolve dois blocos lado a lado, sem somá-los.

Cada bloco traz `comparecimento` (média, mediana e desvio padrão populacional dos `qt_comparecimento` por seção) e `candidatos` (para cada candidato nominal, média, mediana e desvio padrão populacional dos votos por seção). `secoes` é o número de seções do recorte; `secoes_com_voto` é o número de seções em que o candidato teve algum voto. Cache Redis TTL 300 s, cabeçalho `x-cache: hit|miss|off`.

## Ordenação, paginação e erros

- Ordenação no servidor pelos parâmetros `ordem` (coluna aceita pela rota) e `direcao` (`asc` ou `desc`). Rotas com mais de uma tabela usam sufixos (`ordem_share`, `ordem_margem`, `ordem_duplicacao`, `ordem_benford`, `ordem_campos`, `ordem_votaveis`, `ordem_biometria_uf`). Valores nulos vão para o fim. Nas listas com recorte dos N primeiros (participação do líder, margem e outliers), o recorte segue a métrica padrão da lista e a ordenação pedida reordena apenas os itens já recortados.
- Paginação por `page` e `page_size`. O padrão e o máximo vêm de `SECTIONS_PAGE_SIZE_DEFAULT` (50) e `SECTIONS_PAGE_SIZE_MAX` (200). Rotas com `limit` aceitam de 1 a 100, com padrão 20.
- Erros: `{ "error": { "code", "message", "details"? } }`. Parâmetro inválido responde `400 VALIDATION`, recurso inexistente `404 NOT_FOUND` e falha inesperada `500 INTERNAL`.

## `GET /api/sections/:id/versions`

Versões do Boletim de Urna da seção para o cargo. Parâmetros: `election_id`, `cargo`, `comparar_com` (número da versão; sem ele, compara a atual com a anterior), `ordem_campos` e `ordem_votaveis`. Cache de 300 s.

Resposta: `secao`, `versoes` e `comparacao` (nula sem versão anterior) com `anterior`, `atual`, `campos_alterados` (`campo`, `anterior`, `atual`, `diferenca`) e `votaveis_alterados` (`nr_votavel`, `nm_votavel`, `anterior`, `atual`, `diferenca`). Seção inexistente responde `404`.

## `GET /api/biometria/municipios` e `GET /api/biometria/secoes`

`uf` obrigatória (e `municipio` em `/secoes`), `limit`, `ordem` e `direcao`. Devolvem `municipios` ou `secoes` com comparecimento, quantidade e percentual de biometria não habilitada. Ordem padrão: `qt_nao_habilitada` decrescente em municípios e `percentual_nao_habilitada` decrescente em seções.

## `GET /api/encerramento/urnas`, `/municipios` e `/secoes`

- `/urnas`: por unidade da federação, total de Boletins e quantidade e percentual até 17:15, até 19:15 e após 19:15. As faixas usam o dia do pleito no fuso -03 para todas as unidades e anos.
- `/municipios` (`uf` obrigatória): total, quantidade e percentual após 17:15, partido vencedor (soma de votos nominais e de legenda por sigla), votos e percentual do partido. Ordem padrão: percentual após 17:15 decrescente.
- `/secoes` (`uf` e `municipio` obrigatórios): zona, seção, horário de encerramento, se foi após 17:15, partido vencedor, votos e percentual. Ordem padrão: após 17:15 primeiro e encerramento mais tardio.
- O horário de encerramento da seção é o primeiro disponível entre encerramento, emissão e recebimento.

## `GET /api/consistencia`

Divergências aritméticas por Boletim de Urna. Parâmetros: recorte comum, `regra` (`comparecimento_vs_votos`, `aptos_vs_comparecimento_abstencao`, `comparecimento_vs_aptos`, `biometria_vs_comparecimento`), `page`, `page_size` e ordenação por `sg_uf`, `nm_municipio`, `nr_zona`, `nr_secao`, `regra`, `diferenca`. Resposta: `cobertura`, `page`, `page_size`, `total` e `itens`. Campo ausente deixa a regra como `dados_insuficientes`.

## `GET /api/concentracao`

Participação do líder e margem por seção. Parâmetros: recorte comum, `limit`, `page`, `page_size`, `ordem_share`/`direcao_share` e `ordem_margem`/`direcao_margem`. Resposta: `cobertura`, `total`, `top_share` e `top_margem`. O contexto de cada seção (percentil e desvio-padrão) vem do grupo comparável (mínimo de 5 seções) ou, na falta dele, de uma das 4 faixas de eleitores aptos.

## `GET /api/comparacao-local` e `GET /api/comparacao-local/secoes`

- `/comparacao-local`: grupos por local de votação, zona e município, sem as seções de cada grupo. Parâmetros: recorte comum, `page`, `page_size` e ordenação. Resposta: `cobertura`, `total` e `grupos`. Grupo com menos de 5 seções fica com estado `dados_insuficientes`.
- `/comparacao-local/secoes`: seções de um grupo. Parâmetros: recorte comum, `chave` (formato `local|zona|municipio:UF|código[|zona]`) e ordenação. Grupo inexistente responde `404`.

## `GET /api/relatorio`

Relatório de consistência de uma eleição. Parâmetros: recorte comum e ordenação. Resposta: `alvo`, `comparacao_final_disponivel` e `referencias`. Com corte parcial não há referências. Cada linha traz Boletins, aptos, comparecimento, abstenções, percentuais de participação e abstenção, cobertura e `recebimento` (com data e hora, só data, ausente, outra precisão, sem encerramento, antes do encerramento, antes da emissão, mediana e percentil 90 do atraso em minutos). Totais ficam nulos quando algum Boletim não tem o campo.

## `GET /api/comparacao-anos`

Parâmetros: `anos` (lista separada por vírgula, ao menos dois) e `uf` (opcional). Só Presidente; ignora o corte. Resposta: `anos` (candidatos e pontos por turno, em intervalos de 5 minutos pelo encerramento em -03), `pares` (correlação de Pearson `r` e `p_valor` por permutação em blocos de 6 intervalos, para `votos_intervalo` e `pct_acumulada`) e `avisos` (`SEM_HORARIO` para ano sem horário de encerramento).

## `GET /api/totalizacao/metricas`, `/incidentes` e `/divergencias`

Recorte comum às três rotas: `ano` e `turno` (1 ou 2) obrigatórios; `uf`, `municipio`, `zona`, `secao` e `lote` opcionais. Só lotes `concluido` ou `parcial`; sem `lote`, vale o lote vigente de cada unidade da federação, ano e turno.

- `/metricas` (cache 86.400 s): `tempo` (`quantidade`, `mediaMs`, `medianaMs`, `maisRapidoMs`, `maisDemoradoMs`), `biometria` (`falhou1`, `falhou2`, `falhou3`, `falhou4`, `manual`), `incidentes` (`total`) e `complementares` (`secoes`, `aptos`, `comparecimento`, `teclasIndevidas`, `correcoes`).
- `/incidentes` (cache 60 s): `itens` (`instante`, `nivel`, `tipo`, `texto_original`, localização), `total`, `pagina`, `tamanho`; do mais recente ao mais antigo.
- `/divergencias` (cache 60 s): parâmetro `fonte` opcional (`rdv`, `log`, `bweb`); `itens`, `total`, `pagina`, `tamanho`. Sem `fonte`, todas as fontes são devolvidas.
