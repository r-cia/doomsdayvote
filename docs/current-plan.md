# Plano atual — carga de arquivos grandes

## Causa do OOM

O arquivo do SP não está ordenado por seção: as linhas de um mesmo BU aparecem espalhadas. O importador antigo mantinha todos os BUs abertos em memória até a última linha de cada grupo, então o buffer crescia até o tamanho do arquivo (8 GB → heap de 20 GB estourado).

## Solução aplicada — staging UNLOGGED + COPY

1. O arquivo é lido em streaming e cada linha normalizada é enviada por `COPY bweb_staging (...) FROM STDIN` (pg-copy-streams) com `lote_id`, `chave` do BU, `nr_linha` e `valores` jsonb. Sem transação aberta durante o COPY; a staging é apagada em caso de falha.
2. As chaves distintas do lote são lidas e as BUs são processadas em blocos de 200, buscando as linhas por `(lote_id, chave)`.
3. Cada bloco passa pela validação e pela persistência atuais — versionamento, hash, alertas e idempotência intactos.
4. A staging é apagada ao fim da transação de persistência.

Memória fica limitada à linha em trânsito, ao bloco de 200 BUs e à lista de chaves do arquivo (~200 mil chaves de ~40 bytes no SP). Não depende do tamanho nem da ordem do arquivo.

Custo: a staging ocupa disco temporário no Postgres (jsonb normalizado, estimado em 12–20 GB para o SP de 8 GB) e é descartada ao fim. Sem dependência de disco local, sem segunda passada no arquivo.

## Validação

- `tests/integration/importacao-fora-de-ordem.test.js`: o fixture com as linhas intercaladas produz os mesmos totais de boletins e resultados da importação normal.
- `lote`, `schema`, `resultado-colunas` e `api` continuam passando.

## Pendências

- Rodar a carga real do SP e medir tempo e pico de memória.
- Se a carga de 300 milhões exigir mais velocidade, o próximo passo é enviar o CSV direto para a staging sem normalizar em Node (COPY do arquivo cru para colunas de texto) e normalizar em SQL.
