# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Público geral:** consulta anônima dos resultados por eleição, turno, cargo, UF, município e seção, depois da eleição.
- **Auditor/operador:** carrega os BUs manualmente e usa o painel para procurar anomalias e conferir a origem dos números.

## Product Purpose

Permitir que qualquer pessoa consulte, com clareza e rastreabilidade, os resultados dos BUs já recebidos, reconstrua o caminho dos votos ao longo do dia e qualifique o número com a composição de biometria do recorte e o teste de Benford por candidato. Sucesso significa entender o que foi contado, até quando, de qual arquivo/lote veio cada número e o quanto ele se afasta do esperado.

## Positioning

Reconstrução do dia a partir do horário oficial de recebimento dos BUs (`DT_BU_RECEBIDO`), com carga manual e offline. Não é tempo real nem totalização oficial.

## Operating Context

- Pós-eleição, offline; o operador coloca os BUs em uma pasta e roda o worker.
- Somente Presidente e Governador; `CD_TIPO_URNA = 1`; base do percentual em votos válidos.
- A escolha começa pelo cargo, depois o ano da eleição e por último o turno.
- Interface em português; desktop; sem login, upload ou área administrativa.

## Capabilities and Constraints

- Ingestão manual 2014/2018/2022/2026; lote/SHA; versão ativa única.
- Corte por horário ou dia conforme a precisão da fonte; sem inventar horário.
- Votos, seções com BU (contagem absoluta), status, linha do tempo por candidato, mapa, tabela e detalhe da seção.
- Composição de biometria do recorte: comparecimento, habilitados por biometria (`comparecimento − QT_ELEI_BIOM_SEM_HABILITACAO`) e com biometria não habilitada. O BU informa por seção; não existe biometria por candidato e nenhum rateio é feito.
- Benford por candidato: primeiro dígito dos votos por seção com 10 votos ou mais, MAD de Nigrini e classificação descritiva.
- Sem snapshots, sem percentual de apuração, sem tempo real e sem cobertura por SHA.
- Sem exportação e sem validação cruzada com totalização oficial.

## Brand Commitments

- Nome: Doomsday Vote.
- Logo: `docs/doomsday.png` (cabeçalho e favicon).
- Idioma: pt-BR.
- Transparência: visualização independente, não oficial do TSE.
- Direção visual pinada pelo usuário: sala de operações da Guerra Fria, monitor de fósforo âmbar; o mundo entra só como tipo, paleta, densidade e um movimento-assinatura.

## Evidence on Hand

- BUs reais em `data/`; fixtures em `backend/tests/fixtures/bweb/`.
- Malha IBGE e correspondência TSE↔IBGE em `frontend/public/geo/` e `backend/data/geo/`.
- Logo em `docs/doomsday.png`.
- Não há depoimentos, clientes, benchmarks ou totalização oficial validada.

## Product Principles

1. Rastreabilidade antes de opinião: todo número leva ao lote e à linha.
2. Não afirmar mais precisão do que a fonte oferece.
3. Offline e manual por decisão.
4. Uma leitura pública clara; o detalhe fica a um clique.
5. Somente Presidente e Governador.
6. Benford descreve aderência; não é prova de fraude.

## Accessibility & Inclusion

- Interface em português; navegação por teclado, contraste, legenda textual e tabela alternativa (básico).
