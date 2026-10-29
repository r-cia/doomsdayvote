# Plano atual — carga de arquivos grandes sem estourar memória

## Causa

O arquivo do SP não está ordenado por seção: as linhas de um mesmo BU aparecem espalhadas. O importador mantém os BUs abertos em memória até a última linha de cada grupo, então o buffer cresce até o tamanho do arquivo (8 GB → heap de 20 GB estourado).

## Opção A — spill em disco por BU (recomendada agora)

1. **Primeira passada:** lê o arquivo em streaming e grava cada linha bruta em um de N arquivos temporários (N = 128), escolhido pelo hash da chave do BU. A chave sai dos campos crus, sem parsear o registro. Memória constante; disco ~8 GB.
2. **Segunda passada:** processa um arquivo por vez; como todas as linhas de um BU caem no mesmo arquivo, o agrupamento é feito em memória só com o tamanho de um bucket (~64 MB de texto, ~150 MB de heap), valida e persiste com a lógica atual.
3. `nr_linha_origem` viaja junto da linha no arquivo temporário.
4. Limpeza do diretório temporário no fim e em caso de erro.
5. O leitor ganha o texto bruto da linha e o parser expõe `parsear(campos, nrLinha)` para a segunda passada.

Custo: reparsear o arquivo (duas passadas) e ~8 GB de disco temporário. Nenhuma dependência nova, nenhuma mudança de schema, validação e versionamento intactos.

## Opção B — staging no Postgres + COPY (para 300 milhões)

`COPY` do CSV para uma tabela UNLOGGED, agrupamento por SQL e persistência por lote de BUs. Mais rápido e sem disco local, mas exige `pg-copy-streams`, tabela de staging e mover o agrupamento para SQL. Fica para a etapa de 300M.

## Testes

- Unitário: bucketização determinística (mesmo BU sempre no mesmo bucket) e parser por linha.
- Integração: importar o fixture normal e uma cópia com as linhas embaralhadas; os dois devem produzir os mesmos BUs e votos.
- Regressão: lote, idempotência, versão e `/api/summary` continuam passando.
