# Blueprint — regras de domínio

## Análise e cobertura

- Toda análise informa `cobertura` (seções consideradas/excluídas e motivos).
- Zero não é tratado como ausência: campo ausente vira `null` e é contado em `bus_sem_*`.
- Resultados são descritivos; não há rótulo de fraude, conformidade ou não conformidade.
- Benford é leitura exploratória em validação.
- Consistência aritmética só sinaliza divergências quando os campos necessários existem.
- O índice do Relatório é `BUs avaliados sem divergência / BUs avaliados × 100`, arredondado a uma casa decimal. Cada BU entra no máximo uma vez; é avaliável quando ao menos uma regra é verificável. Ausências não reduzem o índice e são mostradas na cobertura.
- O índice descreve consistência aritmética observada, não probabilidade de fraude ou legitimidade. Benford, duplicação, outliers, concentração e comparações comportamentais são informativos e não pontuam sem calibração validada. A literatura documenta limites de Benford em contagens eleitorais: [Mebane, 2006](https://authors.library.caltech.edu/records/5jbtk-8wn05).
- O relatório avalia um `election_id` por vez. Cada referência histórica é exibida por eleição, ano e turno, no mesmo cargo e escopo; referências não são somadas nem entram no índice. Comparações históricas ficam indisponíveis quando o alvo usa corte parcial.
- Atraso entre `DT_ENCERRAMENTO` e `DT_BU_RECEBIDO` só é calculado quando ambos têm hora precisa. Precisão apenas de data e ausência são contabilizadas separadamente. Recebimento anterior ao encerramento/emissão é um achado cronológico para revisão, fora do índice.
- Comparação local exige mínimo de 5 seções por grupo.
- Concentração e margem são contextualizadas por grupo comparável ou faixa de aptos.

## Endpoints de análise

- `/api/analysis`: biometria agregada e Benford por candidato.
- `/api/anomalies`: Benford por nível, duplicação e outliers.
- `/api/estatisticas`: descritivas por seção.
- `/api/consistencia`: divergências aritméticas paginadas.
- `/api/comparacao-local`: grupos comparáveis.
- `/api/concentracao`: top por participação e margem.
- `/api/relatorio`: métricas do recorte selecionado e referências históricas separadas, além de cobertura e precisão dos horários de recebimento.

## Limitações conhecidas

- Biometria é agregada por seção, sem vínculo individual.
- Ausência de campo não é tratada como zero.
- Ferramenta não conclui fraude; sinaliza desvios para revisão.
- Comparações descritivas de BUs não substituem auditoria independente de cédulas e não comprovam a intenção de voto.
