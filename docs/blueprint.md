# Blueprint — regras de domínio

## Análise e cobertura

- Toda análise informa `cobertura` (seções consideradas/excluídas e motivos).
- Zero não é tratado como ausência: campo ausente vira `null` e é contado em `bus_sem_*`.
- Resultados são descritivos; não há rótulo de fraude, conformidade ou não conformidade.
- Benford é leitura exploratória em validação.
- Consistência aritmética só sinaliza divergências quando os campos necessários existem.
- Na consistência, cada BU conta no máximo uma vez; é avaliável quando ao menos uma regra é verificável. Ausências são mostradas na cobertura.
- Benford, duplicação, outliers, concentração e comparações comportamentais são informativos e não pontuam sem calibração validada. A literatura documenta limites de Benford em contagens eleitorais: [Mebane, 2006](https://authors.library.caltech.edu/records/5jbtk-8wn05).
- O relatório avalia um `election_id` por vez. Cada referência histórica é exibida por eleição, ano e turno, no mesmo cargo e escopo; referências não são somadas. Comparações históricas ficam indisponíveis quando o alvo usa corte parcial.
- Atraso entre `DT_ENCERRAMENTO` e `DT_BU_RECEBIDO` só é calculado quando ambos têm hora precisa. Precisão apenas de data e ausência são contabilizadas separadamente. Recebimento anterior ao encerramento/emissão é um achado cronológico para revisão.
- As faixas de encerramento 17:15 e 19:15 usam -03 (horário de Brasília) para todas as UFs e anos.
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

## Entre anos

- Aba "Entre anos" (`/api/comparacao-anos`): só Presidente, Brasil com filtro opcional de UF. A aba "Comparações" (comparação local) permanece inalterada.
- O usuário seleciona dois ou mais anos. 2014 aparece na seleção, mas desabilitada, porque não tem horário de encerramento.
- Em cada ano e turno: os dois candidatos mais votados. O vencedor da eleição é exibido e define o pareamento do 2º turno.
- Pareamento por posição: 1º turno, 1º colocado com 1º e 2º com 2º; 2º turno, vencedor com vencedor e derrotado com derrotado.
- Eixo: horário de encerramento do BU (`dt_encerramento`) em -03 fixo, em intervalos de 5 minutos, no dia do pleito. BUs sem `dt_encerramento` ficam fora das curvas, inclusive da % acumulada.
- Curvas comparadas: (a) votos por intervalo, sem acumular; (b) % acumulada do candidato nos votos válidos ao longo do tempo.
- Semelhança: correlação de Pearson entre as curvas de cada par de anos, usando só os intervalos de 5 minutos com dados nos dois anos.
- Probabilidade: apenas a chance de ser acaso, por p-valor de permutação em blocos de 6 intervalos (30 min), 10.000 permutações e semente fixa. Não há "chance de dados manipulados".
- A aba só mostra as métricas: nada é marcado como suspeito e não há limites.
- A aba ignora o corte (`as_of`) e usa sempre a apuração completa.

## Limitações conhecidas

- Biometria é agregada por seção, sem vínculo individual.
- Ausência de campo não é tratada como zero.
- Ferramenta não conclui fraude; sinaliza desvios para revisão.
- Comparações descritivas de BUs não substituem auditoria independente de cédulas e não comprovam a intenção de voto.
