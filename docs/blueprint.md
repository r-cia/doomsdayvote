# Blueprint — regras de domínio

## Análise e cobertura

- Toda análise informa `cobertura` (seções consideradas/excluídas e motivos) e `limitacoes`.
- Zero não é tratado como ausência: campo ausente vira `null` e é contado em `bus_sem_*`.
- Resultados são descritivos; não há rótulo de fraude, conformidade ou não conformidade.
- Benford é leitura exploratória em validação.
- Consistência aritmética só sinaliza divergências quando os campos necessários existem.
- Comparação local exige mínimo de 5 seções por grupo.
- Concentração e margem são contextualizadas por grupo comparável ou faixa de aptos.

## Endpoints de análise

- `/api/analysis`: biometria agregada e Benford por candidato.
- `/api/anomalies`: Benford por nível, duplicação e outliers.
- `/api/estatisticas`: descritivas por seção.
- `/api/consistencia`: divergências aritméticas paginadas.
- `/api/comparacao-local`: grupos comparáveis.
- `/api/concentracao`: top por participação e margem.

## Limitações conhecidas

- Biometria é agregada por seção, sem vínculo individual.
- Ausência de campo não é tratada como zero.
- Ferramenta não conclui fraude; sinaliza desvios para revisão.