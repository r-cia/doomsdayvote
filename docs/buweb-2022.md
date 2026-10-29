# ~~qT~~ 

TSE LEIA-ME 

Este arquivo contém o leiaute das tabelas existentes no repositório de dados eleitorais. Antes de trabalhar os dados é importante ler as seguintes considerações: 

- A codificação de caracteres dos arquivos é "Latin 1"; 

- Os campos estão entre aspas e separados por ponto e vírgula, inclusive os campos numéricos; 

- Campos preenchidos com #NULO significam que a informação está em branco no banco de dados. O correspondente para #NULO nos campos numéricos é -1; 

- Campos preenchidos com #NE significam que naquele ano a informação não era registrada em banco de dados pelos sistemas eleitorais. O correspondente para #NE nos campos numéricos é -3; 

- O campo UF, além das unidades da federação pode conter alguma das seguintes situações: 

o BR: quando se tratar de informação a nível nacional; 

o VT: quando se tratar de voto em trânsito; 

- ZZ: quando se tratar de Exterior. 

- Os arquivos estão em constante processo de atualização e aperfeiçoamento. Alguns arquivos podem estar em branco ou com mensagem de erro devido a indisponibilidade temporária na base de algum estado ou à inexistência daquele arquivo para a época pretendida. 

Agradecemos todas as críticas e sugestões recebidas de pesquisadores e usuários que estão colaborando para a melhoria na qualidade da prestação das informações. Em especial à Associação Brasileira de Ciência Política (ABCP), que por meio de acordo de cooperação técnica firmado com o TSE está auxiliando na verificação dos arquivos gerados e informando o TSE quanto às necessidades de dados dos pesquisadores. 

Qualquer sugestão ou dúvida deve ser encaminhada ao e-mail estatistica@tse.jus.br. 

Página 1 

## **<mark>I BOLETIM_URNA</mark>** 

NOTAÇÃO: bweb_<TURNO>_<SIGLA_UF>_<DATA_HORA_GERACAO>.zip 

|Variável|Descrição|
|---|---|
|DT_GERACAO|Data da extração dos dados para geração do arquivo.|
|HH_GERACAO|Hora da extração dos dados para geração do arquivo com<br>base no horário de Brasília.|
|ANO_ELEICAO|Ano de referência da eleição para geração do arquivo.<br>Observação: Para eleições suplementares o ano de<br>referência<br>da<br>eleição<br>é<br>o<br>da<br>eleição<br>ordinária<br>correspondente. Por exemplo: Em 2016 houve eleições<br>ordinárias. Após a data desta eleição ordinária e antes da<br>próxima, houve eleições suplementares em 2017, 2018 e<br>2019. As informações destas eleições suplementares<br>estarão divulgadas no arquivo gerado para as Eleições<br>2016.|
|CD_TIPO_ELEICAO|Código do tipo de eleição. Pode assumir os valores: 0 -<br>Eleição Ordinária, 1 - Eleição Extraordinária, 2 - Consulta<br>Popular|
|NM_TIPO_ELEICAO|Nome do tipo de eleição. Observação: As eleições<br>ordinárias são previstas em Lei, possuem data certa para<br>serem realizadas, ocorrem em anos pares e possuem a<br>periodicidade de 04 em 04 anos. Nas eleições ordinárias<br>nacionais<br>são<br>eleitos<br>os<br>cargos<br>de<br>Presidente,<br>Governadores, Deputados (Federais e Estaduais) e<br>Senadores. Nas eleições ordinárias municipais são eleitos<br>os cargos de Prefeito e Vereadores.<br>As eleições suplementares são aquelas que não têm<br>periodicidade pré-determinada ou definida e ocorrem<br>quando, eventualmente, se fizerem necessárias.<br>As consultas populares ocorrem sempre que a população é<br>convocada a opinar diretamente sobre um assunto<br>específico e importante. Ela pode ser realizada de duas<br>formas: plebiscito (quando o cidadão opina previamente|



Página 2 

||sobre a possível criação de uma lei) e referendo (quando<br>uma lei aprovada por um órgão legislativo é submetida à<br>aceitação ou não dos eleitores).|
|---|---|
|CD_PLEITO|Código do pleito é uma informação de eleições em uma<br>determinada data. Um Pleito pode ter uma ou mais<br>eleições. Pleito eleitoral: Assim se diz em alusão à luta ou<br>disputa, que se fere nas eleições, para designar o<br>desenrolar destas. E, desse modo, extensivamente, é a<br>expressão usada para designar as próprias eleições, no<br>período em que se registrarem as votações.|
|DT_PLEITO|Data do pleito da eleição.|
|NR_TURNO|Número do turno da eleição. Observação: No Brasil, as<br>eleições realizam-se por meio de dois sistemas: o sistema<br>majoritário (aplicado aos cargos de Presidente, Vice-<br>Presidente, Governador, Vice-Governador, Prefeito, Vice-<br>Prefeito e Senador) e o sistema proporcional (aplicado aos<br>cargos<br>de<br>Deputado<br>Federal,<br>Deputado<br>Estadual,<br>Deputado Distrital e Vereador). O sistema majoritário<br>consiste em declarar eleito o candidato que tenha recebido<br>a maioria dos votos válidos (excluídos os votos em brancos<br>e os votos nulos). Caso o candidato ao cargo indicado no<br>sistema majoritário, com exceção do cargo de Senador,<br>não alcance maioria absoluta destes votos válidos no<br>primeiro turno (mínimo de 50% + 1), haverá segundo turno<br>em que concorrerão apenas os dois candidatos mais<br>votados. O segundo turno das eleições no Brasil ocorre<br>para os cargos de Presidente, Vice-Presidente da<br>República,<br>Governadores<br>e<br>Vice-Governadores<br>dos<br>Estados e do Distrito Federal e para Prefeitos e Vice-<br>Prefeitos de Municípios com mais de 200 mil eleitores. Nos<br>municípios cujo eleitorado é igual ou menor que 200 mil e<br>para o cargo de Senador elege-se o candidato que tenha<br>alcançado a maioria simples dos votos.|



Página 3 

|CD_ELEICAO|Código único da eleição no âmbito da Justiça Eleitoral.<br>Observação: Este código é único por eleição e por turno,<br>ou seja, cada turno possui seu código de eleição.|
|---|---|
|DS_ELEICAO|Descrição da eleição.|
|SG_UF|Sigla da Unidade da Federação em que ocorreu a eleição.|
|CD_MUNICIPIO|Código TSE do município onde ocorreu a eleição.|
|NM_MUNICIPIO|Nome do município onde ocorreu a eleição.|
|NR_ZONA|Número da Zona Eleitoral em que ocorreu a eleição.|
|NR_SECAO|Número da Seção Eleitoral em que ocorreu a eleição.|
|NR_LOCAL_VOTACAO|Número do local de votação referente ao boletim de urna.|
|CD_CARGO_PERGUNTA|Código do cargo do candidato ou pergunta, no caso de<br>plebiscito.|
|DS_CARGO_PERGUNTA|Descrição do cargo do candidato ou pergunta, no caso de<br>plebiscito.|
|NR_PARTIDO|Número do partido de origem do candidato.|
|SG_PARTIDO|Sigla do partido de origem do candidato.|
|NM_PARTIDO|Nome do Partido de origem do candidato.|
|DT_BU_RECEBIDO|Data do boletim de urna recebido.|
|QT_APTOS|Quantidade de eleitores aptos a votar naquele município,<br>zona e seção.|
|QT_COMPARECIMENTO|Quantidade de eleitores que compareceram às eleições<br>naquele município, zona e seção.|
|QT_ABSTENCOES|Quantidade de eleitores que não compareceram às<br>eleições naquele município, zona e seção.|
|CD_TIPO_URNA|Código de identificação do tipo de urna.|
|DS_TIPO_URNA|Descrição de identificação do tipo de urna.|
|CD_TIPO_VOTAVEL|Código do tipo de votável.|
|DS_TIPO_VOTAVEL|Descrição do tipo votavel.|
|NR_VOTAVEL|Pode assumir os valores: Número do candidato (quando<br>voto nominal); Número do partido (quando voto em<br>legenda); Número 95 (quando voto em branco); Número 96<br>(quando voto nulo); Número 97 (quando voto anulado e<br>apurado em separado) e Número 98(quando voto anulado).|



Página 4 

|NM_VOTAVEL|Pode assumir os valores: Nome do candidato (quando voto<br>nominal ou voto anulado); Nome do partido (quando voto<br>em legenda); "Voto em branco" (quando voto em branco);<br>"Voto Nulo" (quando voto nulo) e "Voto anulado e apurado<br>em separado" (quando voto anulado e apurado em<br>separado).|
|---|---|
|QT_VOTOS|Quantidade de votos recebidos pelo votável.|
|NR_URNA_EFETIVADA|Número da urna efetivada.|
|CD_CARGA_1_URNA_EFETIVADA|Código da Carga 1 da urna efetivada.|
|CD_CARGA_2_URNA_EFETIVADA|Código da Carga 2 da urna efetivada.|
|CD_FLASHCARD_URNA_EFETIVADA|Código do Flashcard de urna efetivada.|
|DT_CARGA_URNA_EFETIVADA|Data da carga da urna efetivada.|
|DS_CARGO_PERGUNTA_SECAO|Informação<br>de<br>código<br>cargo<br>pergunta<br>e<br>seção.<br>Apresentando<br>os<br>valores<br>agrupados<br>de<br>[CD_CARGO_PERGUNTA][CD_SECAO], caso um dos<br>valores seja nulo, deverá retornar " - " no lugar do código.|
|DS_AGREGADAS|Lista das seções agregadas.|
|DT_ABERTURA|Data/hora de abertura da urna eletrônica para votação.|
|DT_ENCERRAMENTO|Data/hora de encerramento da urna eletrônica para<br>votação.|
|QT_ELEITORES_BIOMETRIA_NH|Quantitativo de eleitores com biometria, mas que não foram<br>habilitados por meio dela.|
|DT_EMISSAO_BU|Data/hora de emissão do boletim de urna (BU).|
|NR_JUNTA_APURADORA|Número da junta apuradora.|
|NR_TURMA_APURADORA|Número da turma apuradora.|



Página 5 

