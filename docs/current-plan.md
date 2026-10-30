# Plano atual

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
