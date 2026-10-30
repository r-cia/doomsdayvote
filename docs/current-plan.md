# Plano atual

## Proposta: aba Relatório

### Objetivo

Adicionar a aba “Relatório” após “Encerramento”, reunindo evidências disponíveis para avaliar consistência dos dados da votação selecionada. O resultado deve mostrar achados rastreáveis e uma nota de 0,0% a 100,0%, com método, cobertura e limitações explícitos. A nota será um índice descritivo, não probabilidade de fraude nem prova de legitimidade.

### Escopo proposto

1. Analisar uma eleição por vez, identificada por ano e turno; não combinar anos ou turnos no universo avaliado nem na nota. Inventariar tabelas, campos, cargas, versões de boletim, metadados e análises existentes, registrando fonte, período, escopo eleitoral/geográfico, corte e cobertura de cada dado utilizado.
2. Reaproveitar os módulos existentes de consistência aritmética, duplicação, valores atípicos, Benford, estatísticas descritivas, comparação local, concentração, biometria, participação e encerramento; identificar lacunas sem duplicar cálculos já disponíveis.
3. Separar verificações determinísticas (totais, categorias, chaves, duplicidades e integridade referencial) de sinais estatísticos exploratórios. Analisar também `DT_BU_RECEBIDO` (“Recebimento” do TSE): cobertura e precisão temporal, atraso em relação ao encerramento e recebimentos anteriores ao encerramento. Exibir divergências, consistências esperadas, tamanho da base, denominador, limiar, resultado e limitações por achado.
4. Calcular a nota como `BUs avaliados sem divergência / BUs avaliados × 100`, arredondada a uma casa decimal. Cada BU elegível conta uma vez, sem pesos por regra; campos ausentes não pontuam e aparecem na cobertura. Atraso de recebimento e sinais exploratórios ficam fora da nota. Não contar evidências correlacionadas duas vezes.
5. Quando evidência insuficiente impedir avaliação, mostrar “inconclusivo” e cobertura; não converter ausência de dados em nota neutra ou ruim sem regra aprovada.
6. Implementar endpoint de relatório usando os filtros compartilhados de eleição, ano, turno, cargo, corte e geografia, com consultas agregadas no Postgres, cache compatível com invalidação pós-carga e respostas paginadas quando necessário.
7. Permitir comparar explicitamente com outros anos e turnos para contextualizar mudanças comportamentais. Exibir cada período de referência separado e identificado; seus dados não entram nos denominadores, achados ou nota do recorte avaliado.
8. Criar view e rota após `/encerramento`, traduzir rótulos em pt-BR, en-US e es-ES, e documentar contrato e regras em `docs/API.md`, `docs/blueprint.md` e `docs/architecture.md`.

### Evidências da auditoria somente leitura

- O banco `doomsdayvote` contém registros das eleições de 2014, 2018, 2022 e 2026: 12 combinações de ano, turno e cargo, com cerca de 3,2 milhões de BUs ativos. Cada relatório e linha histórica deve manter seu `election_id` separado.
- Os BUs ativos de Presidente/Governador e urna apurada têm `qt_aptos`, `qt_comparecimento` e `qt_abstencoes` preenchidos. Não foram encontrados valores negativos, comparecimento acima de aptos nem divergência em `aptos = comparecimento + abstencoes`. `dt_encerramento` está ausente em 28.554 BUs de 2014, 2 de 2018, 180 de 2022 e 59 de 2026; em 2014 o conjunto não fornece esse horário.
- Os 112 lotes estão concluídos e registram 20.051.413 linhas importadas, 2 erros e 2.528 alertas: 244 campos `DT_ENCERRAMENTO` ausentes e 2.284 ocorrências de horários considerados impossíveis. Os dois erros são `CHAVE_INCOMPLETA`.
- `DT_BU_RECEBIDO` tem precisão apenas de data em 2014, está ausente em 2018 e tem data/hora em 2022 e 2026. Entre BUs com os dois horários exatos, 2.046 têm recebimento anterior ao encerramento; a mediana do atraso por eleição/cargo varia aproximadamente de 87 a 207 minutos. Esses registros exigem contextualização por fonte e precisão, não entram na nota aritmética.
- `mv_votos_final` e `mv_secao_candidato_final` atendem apenas urnas do tipo 1 e cargos presidente/governador; não cobrem sozinhas todas as categorias e cargos do banco. Uma consulta exploratória que agrupava resultados brutos de todas as eleições excedeu 30 segundos; o relatório deve agregar no banco, limitar cada análise ao recorte solicitado e medir o custo antes de habilitar análises completas.
- Essas contagens não são uma validação integral: o teste de divergência de aptos só se aplica a linhas com os três campos preenchidos, e sinais de horário/importação precisam ser avaliados segundo precisão e regra de cada fonte. Em 2014, o encerramento está ausente em todos os BUs observados, então não há atraso calculável; em 2018, o recebimento está ausente.

### Critérios de aceitação

- Cada afirmação do relatório aponta para método reproduzível, fonte, cobertura, limiar e limitações.
- Dados ausentes, qualidade/cobertura insuficientes e sinais exploratórios são distinguidos de inconsistências aritméticas confirmadas.
- A nota é determinística para o mesmo recorte e versão de dados, justificável pelos achados e limitada a 0,0%–100,0%.
- O universo da nota contém somente um ano e turno; períodos de referência são apresentados separadamente e nunca agregados ao resultado avaliado.
- Cada BU conta uma vez, sem pesos por regra. Sinais estatísticos e de atraso aparecem separados da nota aritmética, que não é descrita como probabilidade ou conclusão sobre fraude.
- A navegação, filtros e traduções mantêm o comportamento das demais abas.

### Decisões aprovadas

- A nota é índice descritivo da consistência aritmética observada, não probabilidade.
- O recorte avaliado usa um `election_id` por vez; comparações são linhas históricas separadas por eleição/ano/turno e não entram na nota.
- Recebimento do TSE é analisado com a precisão disponível; atrasos e ordem cronológica não pontuam sem limiar validado.

### Validação proposta

- Testes unitários para invariantes aritméticas, limites da nota, dados ausentes, correlação/duplicidade de evidências e reprodutibilidade.
- Testes de integração da agregação e do endpoint com bancos falsos; revisão de consultas e cobertura em dados reais somente leitura.
- Comparar casos sintéticos conhecidos e recortes históricos, registrar limites e análise de sensibilidade antes de aprovar a escala.

## Objetivo

Corrigir os estados de carregamento dos gráficos e painéis, fazer os textos e formatos localizados acompanharem o idioma selecionado e preservar a agregação correta de percentuais no mapa por UF.

## Alterações

1. Diferenciar o carregamento inicial da ausência real de dados no gráfico temporal e nos painéis analíticos.
2. Centralizar o estado de carregamento na área de conteúdo dos painéis, ocultar contagens sem dados enquanto carrega e evitar indicadores duplicados no mapa.
3. Animar o spinner compartilhado, respeitando a preferência do sistema por movimento reduzido.
4. Adicionar traduções para estados e rótulos dos painéis analíticos em português, inglês e espanhol.
5. Fazer formatadores compartilhados e os formatadores do gráfico e da análise usarem o idioma ativo.
6. Reagregar os totais da view materializada por UF e candidato antes de selecionar o líder e calcular percentuais.
7. Substituir os metadados brutos sob Benford por um resumo localizado da base, ausências e amostras abaixo do mínimo.

## Validação

- Conferir consistência das chaves dos três catálogos e revisar o diff.
- A suíte e o build não foram executados.

## Plano de otimização de banco e cache

### Evidências

- `/api/sections?status=...` consulta todas as seções correspondentes, classifica e filtra em JavaScript, e só então pagina. Isso aumenta transferência, memória e tempo conforme cresce a base.
- As rotas chamam `metadadosCorte` e `avisosCorte` com o objeto de query inteiro como chave de cache. Parâmetros de paginação e filtros que não alteram esses resultados fragmentam o Redis.
- `criarCache().obter` executa a função sem deduplicação local quando Redis falha; várias requisições simultâneas podem repetir consultas caras no banco.
- O pool usa `max: 40` e `work_mem=256MB` fixos. Mesmo com uma instância Postgres de 32 GB, o consumo depende das consultas simultâneas e de quantas operações de sort/hash cada consulta usa; não há configuração por ambiente.
- Os dados são consultados sem alterações operacionais, tornando pré-agregações e cache de longa duração mais adequados. O carregador ainda existe e atualiza as materialized views e a versão do cache após uma carga.
- O orçamento máximo pretendido para Postgres é 24 GB numa máquina de 32 GB; os 8 GB restantes ficam reservados ao sistema e aos demais serviços.

### Etapas propostas

1. Traduzir os estados de `classificarStatusSecao` em filtros SQL equivalentes, preservando regras de corte, motivo e fuso horário; filtrar e paginar no Postgres antes de transferir as linhas.
2. Criar uma chave de cache canônica para metadados e avisos, limitada a eleição, cargo, escopo geográfico e corte, compartilhada por todas as rotas.
3. Manter deduplicação de consultas em voo também no caminho de falha do Redis, evitando rajadas duplicadas contra o banco.
4. Avaliar materialized views para as agregações caras ainda executadas sobre tabelas brutas, aproveitando que os dados não mudam durante a consulta. Atualizá-las após a carga oficial.
5. Rever TTLs das respostas de dados estáveis. Manter invalidação por versão após carga e limitar cache de consultas altamente variáveis para não crescer sem controle.
6. Ajustar pool, `work_mem`, `maintenance_work_mem` e parâmetros do servidor para caber no orçamento de 24 GB do Postgres, reservando 8 GB para o sistema e os demais serviços. Distinguir parâmetros de planejamento de memória realmente alocada e não tratar `work_mem` como limite global.
7. Revisar consultas e índices existentes contra os planos de execução disponíveis; propor novos índices apenas quando sustentados pelos filtros e joins observados.

### Limites

- Não executar migrações nem alterar dados reais. Migrações, se justificadas, ficam no fluxo oficial do projeto.
- Não elevar indefinidamente o TTL para páginas e buscas de alta cardinalidade; cache sem expiração pode consumir memória Redis mesmo com dados imutáveis.
- Um teto rígido de 24 GB precisa de limite no serviço ou contêiner do Postgres; parâmetros internos e pool reduzem o risco de pico, mas não impõem sozinhos um limite global de RSS.
- Preservar as alterações locais preexistentes em `backend/src/migrations/0007_mv_totais_area.js` e em `graphify-out/`.

### Implementação

- O filtro de status e a paginação agora são aplicados no Postgres; o total usa contagem SQL também quando a página solicitada está vazia.
- Chaves de metadados/avisos ignoram paginação e filtros irrelevantes; TTL de 24 horas é invalidado por versão após carga.
- Falhas do Redis deduplicam consultas simultâneas localmente.
- `mv_secao_candidato_final` atende à base seção-candidato no corte final e é atualizada após a carga.
- Pool padrão reduzido de 40 para 20; `DB_POOL_MAX` (máximo 32) e `DB_WORK_MEM_MB` (máximo 64) são configuráveis. `maintenance_work_mem` deixa de ser elevado por conexão.
- A migração `0008_mv_secao_candidato_final.js` foi criada, mas não aplicada.
- `graphify update .` executado. Testes/build não executados; o teto global do Postgres depende de instalar o drop-in no host.
- O host expõe `postgresql@16-main.service`; `MemoryMax` e `MemoryHigh` estão sem limite, com cerca de 15,7 GiB no cgroup durante a inspeção. O drop-in de 24 GB está em `ops/systemd/`, mas não foi instalado.
- API e carga podem usar heap Node de até 16 GiB por processo. Não reduzi esses limites sem medir o pico das análises e importações, pois isso pode causar OOM; os processos iniciados manualmente também não têm um limite agregado configurado.

## Plano aprovado: aba Comparações

- Criar rota e aba “Comparações” entre “Estatística” e “Biometria”.
- Mover `ComparacaoLocalPanel` e sua consulta de `AnaliseView` para a nova view.
- Traduzir o nome da aba em pt-BR, en-US e es-ES.
- Atualizar a documentação de arquitetura.
- Aumentar para 224 px a altura do gráfico Benford na aba Estatística.
