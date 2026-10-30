# Plano de evolução da auditoria de votos

## Objetivo

Melhorar a triagem de desvios observáveis nos Boletins de Urna (BUs), dando ao usuário evidências reproduzíveis e contexto para revisão. Os resultados serão descritos como sinais estatísticos ou inconsistências dos dados; não serão apresentados como conclusão de fraude.

## Princípios de produto

- Cada sinal deve mostrar o valor observado, a regra ou grupo de comparação, o tamanho da amostra e as limitações relevantes.
- Separar validações determinísticas de consistência dos indicadores estatísticos exploratórios.
- Não criar uma pontuação única de suspeição nem usar a palavra “fraude” para classificar uma seção.
- Permitir que cada sinal leve à seção, ao BU e, quando disponível, às versões e aos lotes de origem.
- Tratar ausência e baixa qualidade de dados como limitações explícitas, não como valores normais.

## Escopo proposto

### 1. Consistência aritmética por seção

- Reaproveitar e revisar as validações de importação existentes para disponibilizar divergências por seção e cargo.
- Verificar as relações possíveis entre comparecimento, votos por categoria, aptos e abstenções conforme o layout e as regras aplicáveis ao BU.
- Exibir regra aplicada, diferença numérica, campos envolvidos e origem do boletim.
- Não classificar uma divergência como anomalia quando os campos necessários estiverem ausentes ou não forem comparáveis.

### 2. Comparação entre seções semelhantes

- Definir grupos de comparação com base em local de votação e, quando não houver amostra suficiente, zona ou município.
- Considerar o tamanho do eleitorado da seção para evitar comparar diretamente seções de escalas muito diferentes.
- Comparar participação, abstenção e distribuição de votos por candidato; apresentar a seção, a faixa do grupo, o tamanho do grupo e a distância observada.
- Exigir um mínimo de observações e devolver “dados insuficientes” quando não houver grupo adequado.
- Não definir limiares de alerta antes de avaliar distribuições e falsos positivos em dados históricos.

### 3. Diferenças entre versões de BU

- Para cada seção com mais de uma versão, comparar os campos de identificação, totais e votos por votável entre a versão ativa e as anteriores.
- Mostrar valores anterior e atual, diferença, timestamps disponíveis, lote e hash do arquivo.
- Distinguir correções de importação ou atualização da fonte de diferenças cuja causa não está documentada; a ferramenta não presumirá a causa.

### 4. Indicadores de concentração e margem

- Calcular participação do candidato mais votado e margem para o segundo colocado por seção.
- Contextualizar cada medida contra seções comparáveis, incluindo o tamanho da seção e o número de votos válidos.
- Tratar resultados extremos como itens para revisão, sem inferir intenção ou causa.

### 5. Cobertura e limitações dos dados

- Para cada análise, informar quantas seções foram consideradas, excluídas ou ficaram sem campos necessários e por quê.
- Indicar limitações de precisão temporal, biometria e cobertura de BUs no recorte selecionado.
- Distinguir zero de campo ausente e evitar preencher ausência com zero em métricas de auditoria.

### 6. Revisão dos indicadores existentes

- **Duplicação:** manter a busca por vetores idênticos, acrescentando tamanho da seção, quantidade de votáveis comparados e contexto geográfico. Avaliar a frequência esperada de coincidências por escala antes de qualquer rótulo de alerta.
- **Isolation Forest e LOF:** manter inicialmente como ordenação exploratória. Revisar uso de features redundantes, limiares fixos, amostragem do LOF e explicabilidade. Exibir contribuição ou valores que ajudam a entender por que uma seção ficou no topo; se isso não for tecnicamente defensável, remover os rótulos de limiar e apresentar apenas ranking descritivo.
- **Benford:** retirar “conformidade” e “não conformidade” da apresentação principal. Antes de decidir pela remoção completa, validar se a distribuição de primeiro dígito é apropriada para votos por seção, com dependência entre níveis, múltiplas comparações e tamanho de amostra considerados. Se não houver justificativa e validação, remover o indicador da triagem; se houver, mantê-lo apenas como estatística exploratória, com amostra e limitações explícitas.
- **Biometria e estatísticas descritivas:** manter como contexto, sem apresentá-las como detecção de anomalia por si só. Deixar explícita a agregação e a ausência de vínculo entre biometria e voto individual.

## Etapas de implementação

1. **Inventário e especificação:** mapear regras dos layouts de BU por eleição/ano, os avisos já gerados na importação, a estrutura de versões e os campos ausentes. Registrar definições e limites de cada indicador.
2. **Camada de consistência:** expor divergências determinísticas existentes por seção, garantindo que cada resultado tenha regra, diferença, fonte e estado de dados suficientes.
3. **Histórico de versões:** disponibilizar comparação entre BUs da mesma seção e rastreabilidade por lote e hash.
4. **Comparações locais:** implementar grupos comparáveis e métricas robustas de participação, abstenção e distribuição, com mínimos amostrais e estado explícito de insuficiência.
5. **Concentração e ordenação exploratória:** acrescentar margem/concentração contextualizadas e revisar duplicação, Isolation Forest e LOF para reduzir redundância e melhorar explicabilidade.
6. **Decisão sobre Benford:** conduzir validação metodológica separada; remover do destaque principal enquanto não houver justificativa documentada.
7. **Apresentação e documentação:** atualizar contratos da API e a interface para usar linguagem de desvio/revisão, mostrar contexto e limitações e manter os indicadores descritivos separados dos erros de consistência.

## Critérios de conclusão

- Nenhum endpoint, rótulo ou mensagem conclui que houve fraude.
- Cada sinal exibido tem motivo legível, valor observado, base de comparação ou regra, tamanho da amostra e acesso à evidência de origem.
- Ausência de dados e amostra insuficiente são estados próprios e não são convertidos silenciosamente em zero ou normalidade.
- As validações aritméticas seguem o layout e as regras aplicáveis a cada eleição e cargo.
- As comparações entre seções explicitam como o grupo foi formado e não aplicam limiar sem avaliação documentada.
- Duplicação e métodos de outlier são apresentados como triagem exploratória, com limitações e sem score agregado de suspeição.
- A decisão de manter ou remover Benford é documentada com justificativa metodológica antes de influenciar a triagem.
- Contratos e documentação da API refletem os campos, regras e limitações efetivamente implementados.

## Dependências e decisões pendentes para a implementação

- Confirmar quais relações aritméticas são válidas para cada versão do layout e cargo; não presumir que campos ausentes equivalem a zero.
- Definir tamanho mínimo de grupo e política de fallback geográfico após examinar a cobertura real dos dados.
- Decidir se sinais e comparações serão apenas calculados sob demanda ou se precisarão de persistência/histórico.
- Obter avaliação metodológica de Benford antes de mantê-lo como indicador de triagem.
- Definir a superfície de produto para os resultados: seção de auditoria existente, nova rota ou ambas.

## Fora de escopo

- Declarar fraude, atribuir intenção ou inferir comportamento individual de eleitores.
- Usar biometria para inferir como uma pessoa votou.
- Criar um classificador opaco ou uma pontuação única de suspeição.
- Alterar dados eleitorais de origem ou substituir a totalização oficial.
