# Blueprint — regras de domínio

## Análise e cobertura

- Toda análise informa `cobertura` (seções consideradas/excluídas e motivos).
- Zero não é tratado como ausência: campo ausente vira `null` e é contado em `bus_sem_*`.
- Resultados são descritivos; não há rótulo de fraude, conformidade ou não conformidade.
- Benford é leitura exploratória em validação.
- Benford inclui p-valor exploratório por Monte Carlo: 10.000 amostras multinomiais sob a distribuição de Benford, condicionadas a `n`, comparadas pelo MAD observado. Não há ajuste por múltiplas comparações nem interpretação como evidência de fraude. As mesmas amostras dão, por dígito, a faixa de 95% (quantis de 2,5% e 97,5% da proporção simulada), exibida no gráfico de Benford junto do observado e do esperado, com seletor de nível (seção, zona, município); a faixa é marginal por dígito e não é um teste.
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

## Siglas e cores de partidos

- O leiaute de 2014 não tem `SG_PARTIDO`; `NM_PARTIDO` já traz a sigla (ex.: "PT", "PC do B"). A importação de 2014 preenche `sg_partido` com `NM_PARTIDO` e mantém `nm_partido`. Na leitura, a sigla é `coalesce(sg_partido, nm_partido)`: as consultas da API e a migração `0011_sg_partido_2014` (que recria `mv_votos_final`, `mv_totais_area` e `mv_secao_candidato_final`) usam essa regra; os dados de 2014 já importados mantêm `sg_partido` nulo.
- 2014 ZZ: o arquivo do exterior só traz `NR_PARTIDO`; a sigla é derivada do `nr_partido` nas outras UFs da mesma eleição (ano e turno), pela migração `0012_sg_partido_2014_exterior`. Número de partido sem sigla única fica nulo.
- A cor do partido vem da sigla normalizada (sem acentos, maiúsculas, só letras e números; "PC do B" vira PCDOB). Sigla histórica usa a cor do sucessor: PMDB → MDB; PR → PL; PRB → REPUBLICANOS; PPS → CIDADANIA; SD → SOLIDARIEDADE; PSDC → DC; PTN e PHS → PODE; PT do B → AVANTE; PSL → UNIAO; PPL → PCDOB; PTB, PATRIOTA, PATRI, PEN e PRP → PRD.
- PRD tem cor própria, verde escuro `#14532D`.
- Modo "Percentual" do mapa: as mesmas 10 faixas (0–10% … 90–100%), com gradiente da cor do partido. Faixa baixa = próxima do fundo escuro; faixa mais alta = a cor do partido (`corPartido`); a mais baixa se mantém distinta de "sem dados". Com candidato selecionado, usa o partido dele; sem candidato ("Participação do líder"), cada área usa o partido do seu líder. Partido sem cor na paleta usa o gradiente sobre a cor neutra. A legenda mostra, com candidato, as 10 faixas no gradiente do partido; sem candidato, uma linha de gradiente por partido líder presente no mapa (rotulada pela sigla, na ordem do número de áreas), com os rótulos das faixas exibidos uma vez.

## Totalização (BU, RDV e log)

- Escopo: a totalização é a leitura do pacote de conferência por UF, ano e turno, separada das análises por eleição. Tem tabelas e rotas próprias (`/api/totalizacao/*` e aba "Totalização"), não usa `election_id`, não alimenta as views de apuração e não substitui a totalização oficial. Até esta entrega o blueprint descrevia apenas a apuração e as análises por eleição; a totalização entra como fonte própria, sem mudar as regras das análises já documentadas.
- Fontes de cada seção: `-bu.dat` (obrigatório), `-rdv.dat` (recontagem) e `-log.jez` (log da urna, zip interno com `logd.dat`).
- O nome do arquivo define UF, ano e turno (`bu_imgbu_logjez_rdv_vscmr_<ano>_<turno>t_<UF>.zip` ou `.7z`, com turno `1t` ou `2t`); nome fora do padrão é erro, sem inferência.
- A carga é idempotente por SHA-256 do arquivo: lote `concluido` com o mesmo hash é ignorado e nada é regravado. Lote com o mesmo hash em `processando`, `parcial`, `falhou` ou `substituido` é reaproveitado: as seções já gravadas (pelo `prefixo`) são puladas e só as ausentes e as registradas em `totalizacao_secao_erro` são reprocessadas, sem duplicar votos, divergências, eleitores ou incidentes.
- Processa `-bu.dat` (obrigatório em cada seção), `-rdv.dat` e `-log.jez`; `-vota.vsc`, `-imgbu.dat`, `.pdf` e qualquer outra entrada são ignoradas e apenas contadas no resumo.
- A integridade do zip é conferida pelo CRC32 de cada entrada na extração; divergência de CRC vira erro da seção, com código `CRC_DIVERGENTE`. O `.7z` já é validado pelo próprio 7z.
- Cada seção é a unidade transacional: localidade, seção, votos do BU e do RDV, eleitores e incidentes do log e as divergências das três conferências entram juntos ou não entram; falha em qualquer gravação desfaz a seção inteira.
- Falha de uma seção não aborta o arquivo: o evento `secao_falhou` traz `secao`/`prefixo`, `erro_codigo` e `erro_mensagem`, a seção é registrada em `totalizacao_secao_erro` e a carga segue. Lote sem erro termina `concluido`; com qualquer erro, `parcial`. Só falhas que impedem a leitura do arquivo (não abre, não lista ou não tem seções) continuam abortando a carga. Com `--falhar-rapido`, a primeira seção com erro derruba o arquivo, o lote fica `falhou` e o evento `lote_falhou` traz a `secao` e o erro, como antes.
- Um novo lote `concluido` ou `parcial` substitui automaticamente os lotes anteriores da mesma UF, ano e turno: os anteriores recebem `status = 'substituido'` e `substituido_por` apontando para o novo, sem apagar nenhum dado. A leitura e a agregação usam só o lote vigente de cada UF.
- O nome do município vem de `backend/data/geo/municipios-tse-ibge.csv`; sem correspondência, a localidade usa `MUNICÍPIO <código>`.
- Seção sem `-rdv.dat` ou sem `-log.jez` é carregada com o que existe; o retorno da carga registra as contagens em `secoes_sem_rdv` e `secoes_sem_log`. Seção sem `-bu.dat` não é ignorada: vira erro `SEM_BU` em `totalizacao_secao_erro` e deixa o lote `parcial`.
- A dupla conferência compara as fontes `rdv`, `log` e `bweb` com tolerância zero: qualquer diferença vira uma linha em `totalizacao_divergencia`, identificada por lote, fonte, campo e localização, com `valor_esperado` e `valor_encontrado` em texto.
- A carga executa as três conferências por seção, depois de gravar votos e métricas e dentro da mesma transação: BU × RDV quando o `-rdv.dat` existe (usando `votosDoBu` como lado do BU), BU × log quando o `-log.jez` existe e BU × BWEB sempre, identificando a eleição pelo ano e turno do nome do arquivo.
- A conferência BU × BWEB não escolhe um `eleicao_id`: filtra `secao_eleitoral` por `ano_eleicao`, `nr_turno`, UF, município, zona e seção, com `boletim_versao.ativo`, e compara os votos por cargo. A totalização trata somente os cargos 1 (Presidente) e 3 (Governador); cargos 5, 6 e 7 do BWEB são ignorados e não geram divergência.
- `conferirBuBweb` consulta e grava as divergências de uma seção quando recebe `lote_id`, `ano_eleicao`, `nr_turno` e os votos do BU; `conferirBuRdv` e `conferirBuLog` devolvem as linhas e a carga as grava com `registrarDivergencias`.
- Ausência de UF ou de seção no BWEB também é divergência de fonte `bweb`: `campo` é `uf` ou `secao`, `valor_esperado` é `presente` e `valor_encontrado` é `ausente`; os campos de localização que a origem não traz ficam nulos e nenhum voto é comparado.
- A recarga da mesma lista não duplica divergências: o índice único do lote ignora nulos e a inserção descarta conflitos, contando apenas as linhas efetivamente gravadas. Divergências de um lote reaproveitado não são apagadas junto com as seções.
- Domínio do tipo de voto do RDV: o `-rdv.dat` grava o tipo em um ENUMERATED próprio e `rdv.js` converte para o domínio do BU (`cd_tipo_votavel`): `1→4`, `2→1`, `3→2`, `4→3`, `6→3` e `7→3`. O BU numera apenas os tipos 1 e 4; os tipos 2 e 3 são agregados sem número, e por isso os códigos 4, 6 e 7 do RDV caem todos no tipo 3. O mapeamento foi comprovado no pacote RR de 2026/1 (1.519 seções e 1.992.567 votos do RDV): em cada cargo de cada seção, a soma por tipo do RDV convertida bate exatamente com a soma por tipo do BU, inclusive nos números do tipo nominal. Código fora desse domínio não é inferido: vira `BerError` `INVALIDO` com a mensagem `tipo de voto desconhecido: <código>`.
- Conferência BU × RDV (`conferencia-rdv.js`): os votos são agregados por cargo, tipo e votável; o número só identifica o votável nominal (`cd_tipo_votavel = 1`), nos demais tipos o número não entra na chave. Votável presente em só uma fonte vale zero na outra. Cada diferença gera uma divergência com fonte `rdv`, campo `votos`, o cargo e o votável, esperado igual à quantidade do BU e encontrado igual à do RDV, em texto.
- Conferência BU × log (`conferencia-log.js`): compara, com tolerância zero, comparecimento do BU × quantidade de `VOTO_COMPUTADO`, `habilitacao2` × quantidade de `HABILITACAO_BIOMETRICA`, abertura do BU × instante do primeiro `URNA_PRONTA` e encerramento do BU × instante do `ENCERRAMENTO`. As divergências usam fonte `log`; instantes do BU são normalizados para `AAAA-MM-DDTHH:MM:SS` e evento ausente no log vira `ausente`.
- A correspondência entre `habilitacao2` e as habilitações biométricas é provisória até o leiaute oficial do BU definir o significado dos três inteiros; os outros dois não são comparados com esse evento.
- Conferência BU × BWEB (`conferencia-bweb.js`): consulta a apuração da seção em `resultado_votavel` → `boletim_versao` → `secao_eleitoral`, apenas com boletim ativo, ano/turno do arquivo, localização completa e cargos 1 e 3, e compara com os votos do BU pela mesma chave da conferência BU × RDV: o número identifica o votável só no tipo nominal; nos demais tipos a chave é cargo e tipo. Votável presente em só uma fonte vale zero na outra. Cada diferença vira fonte `bweb`, campo `votos`, localização completa, esperado igual ao BU e encontrado igual ao BWEB, sem arredondamento.
- UF sem nenhum boletim ativo no ano/turno vira campo `uf`, e seção sem linha de votos do BWEB vira campo `secao`; a UF é avaliada antes da seção.
- Tempo de voto: cada eleitor é uma janela de eventos que começa depois do `VOTO_COMPUTADO` anterior e termina no próximo `VOTO_COMPUTADO` (a primeira janela começa no início do log); entra no tempo quem tem `ELEITOR_HABILITADO` e `VOTO_COMPUTADO` na mesma janela, e a duração é do primeiro ao segundo. Eleitor sem o par não entra.
- Biometria do eleitor, na carga: a janela do eleitor é biométrica se tiver `HABILITACAO_BIOMETRICA`, manual se tiver `HABILITACAO_MANUAL` (a biométrica tem precedência) e identificador nos demais casos; as falhas são as mensagens de tentativa de reconhecimento do dedo na janela. Tipo, falhas, teclas indevidas e correção são gravados por eleitor.
- Incidentes: só entram no log da seção as linhas com nível diferente de `INFO`; `nivel`, instante e texto original são preservados como vieram. O tipo vem da classificação da mensagem e linha fora dos padrões conhecidos vira `desconhecido`, sem ser descartada.
- A agregação de métricas por recorte soma as seções e fecha por escopo: o agregado do município é a soma das seções, o da UF é a soma dos municípios e o nacional é a soma das UFs, nas três famílias (tempo/biometria, incidentes e complementares). Cada família é calculada em uma consulta, filtrando `totalizacao_secao` pelo recorte e pelo lote vigente da UF antes de agregar; a mediana de duração usa `percentile_cont(0.5)` e `secoes` conta localizações distintas (UF, município, zona e seção).
- Na biometria agregada, `tp_habilitacao = 2` é classificado por `qt_falhas_biometria` (0, 1, 2, 3 e 4 ou mais); `tp_habilitacao = 3` conta como manual; `tp_habilitacao = 1` (identificador), habilitação ausente, tipo fora dessa lista e falhas ausentes com tipo 2 contam em `outra`.
- A exposição das divergências não esconde fonte: sem `fonte`, todas as fontes (`rdv`, `log`, `bweb`) são devolvidas, e cada linha traz `fonte` e localização; `fonte` só restringe a lista quando pedida.

## Limitações conhecidas

- Nas análises por eleição, a biometria é agregada por seção, sem vínculo individual. A totalização grava uma linha por sessão de eleitor do log (tempo, tipo de habilitação e falhas), sem identificação pessoal.
- Ausência de campo não é tratada como zero.
- A totalização usa um lote vigente por UF, ano e turno: as leituras e a agregação consideram apenas lotes `concluido` ou `parcial` e, sem lote explícito, o mais recente de cada UF; lotes `falhou`, `processando` e `substituido` não entram na soma. A troca de arquivo não apaga o lote anterior, apenas o marca como `substituido`.
- Divergências só existem para as conferências executadas; seção sem `-rdv.dat` ou sem `-log.jez` não gera divergência daquela fonte. A conferência BU × BWEB roda sempre; sem nenhuma linha de BWEB para a UF, gera a divergência `uf`. Cargos fora de 1 e 3 não entram na conferência.
- Ferramenta não conclui fraude; sinaliza desvios para revisão.
- Comparações descritivas de BUs não substituem auditoria independente de cédulas e não comprovam a intenção de voto.
