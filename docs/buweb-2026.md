

## LEIAME 

Este arquivo contém o leiaute das tabelas existentes no repositório de dados eleitorais. Antes de trabalhar os dados é importante ler as seguintes considera çõ es: 

- A codifica çã o de caracteres dos arquivos é "Latin 1"; 

- Os campos est ã o entre aspas e separados por ponto e vírgula, inclusive os campos numéricos; 

- Campos preenchidos com #NULO significam que a informa çã o está em branco no banco de dados. O correspondente para #NULO nos campos numéricos é -1; 

- Campos preenchidos com #NE significam que naquele ano a informa çã o n ã o era registrada em banco de dados pelos sistemas eleitorais. O correspondente para #NE nos campos numéricos é -3; 

- O campo UF, além das unidades da federa çã o, pode conter alguma das seguintes situa çõ es: 

- BR: quando se tratar de informa çã o a nível nacional; 

o VT: quando se tratar de voto em tr â nsito; 

o ZZ: quando se tratar de Exterior. 

- Os arquivos est ã o em constante processo de atualiza çã o e aperfei ç oamento. Alguns arquivos podem estar em branco ou com mensagem de erro devido à indisponibilidade temporária na base de algum estado ou à inexistência daquele arquivo para a época pretendida. 

Agradecemos todas as críticas e sugest õ es recebidas de pesquisadores e usuários que est ã o colaborando para a melhoria na qualidade da presta çã o das informa çõ es. Em especial à Associa çã o Brasileira de Ciência Política (ABCP)que, por meio de acordo de coopera çã o técnica firmado com o TSE, está auxiliando na verifica çã o dos arquivos gerados e informando o TSE quanto às necessidades de dados dos pesquisadores. 

Qualquer sugest ã o ou dúvida deve ser encaminhada ao e-mail estatistica@tse.jus.br. 

Página 1 

# **<mark>I BOLETIM_URNA</mark>** 

NOTA ÇÃ O: 

BWEB_<TURNO>_<UF>_<DATA_HORA_GERACAO> 

|Variável|Descrição|
|---|---|
|DT_GERACAO|Data da extração dos dados para geração do arquivo.|
|HH_GERACAO|Hora da extração dos dados para geração do arquivo<br>com base no horário de Brasília.|
|ANO_ELEICAO|Ano de referência da eleição para geração do arquivo.<br>Observação: para eleições suplementares o ano de<br>referência da eleição é o da eleição ordinária<br>correspondente. Por exemplo: em 2016 houve<br>eleições ordinárias. Após a data desta eleição<br>ordinária e antes da próxima, houve eleições<br>suplementares<br>em<br>2017,<br>2018<br>e<br>2019.<br>As<br>informações destas eleições suplementares estarão<br>divulgadas no arquivo gerado para as Eleições 2016.|
|CD_TIPO_ELEICAO|Código do tipo de eleição. Pode assumir os valores:<br>. 0: Eleição Ordinária;<br>. 1: Eleição Extraordinária; e<br>. 2: Consulta Popular.|
|NM_TIPO_ELEICAO|Nome do tipo de eleição. Observação: as eleições<br>ordinárias são previstas em Lei, possuem data certa<br>para serem realizadas, ocorrem em anos pares e<br>possuem a periodicidade de 04 em 04 anos. Nas<br>eleições gerais ordinárias são eleitos os cargos de|
||Presidente, Governador, Deputado (Federal e<br>Estadual) e Senador. Nas eleições ordinárias<br>municipais são eleitos os cargos de Prefeito e<br>Vereador. As eleições suplementares são aquelas<br>que não têm periodicidade pré-determinada ou<br>definida e ocorrem quando, eventualmente, se<br>fizerem necessárias. As consultas populares ocorrem|



Página 2 

||sempre que a população é convocada a opinar|
|---|---|
||diretamente<br>sobre<br>um<br>assunto<br>específico<br>e<br>importante. Ela pode ser realizada de duas formas:<br>plebiscito (quando o cidadão opina previamente<br>sobre a possível criação de uma lei) e referendo<br>(quando uma lei aprovada por um órgão legislativo é<br>submetida à aceitação ou não das eleitoras e dos<br>eleitores)|
|CD_PLEITO|Código de identificação do pleito da eleição. Pleito é o<br>conjunto de uma ou mais eleições que ocorrem em<br>uma mesma data pré-determinada.|
|DT_PLEITO|Data do pleito da eleição.|
|NR_TURNO|Número do turno da eleição. Observação: no Brasil,<br>as eleições realizam-se por meio de dois sistemas: o<br>sistema majoritário (aplicado aos cargos de<br>Presidente,<br>Vice-Presidente,<br>Governador,<br>Vice-<br>Governador, Prefeito, Vice-Prefeito e Senador) e o<br>sistema proporcional (aplicado aos cargos de<br>Deputado Federal, Deputado Estadual, Deputado<br>Distrital e Vereador). O sistema majoritário consiste<br>em declarar eleita a candidata ou o candidato que<br>tenha recebido a maioria dos votos a concorrentes<br>(votos válidos, votos anulados e votos anulados sub<br>judice). Caso a candidata ou o candidato ao cargo<br>indicado no sistema majoritário, com exceção do<br>cargo de Senador, não alcance maioria absoluta<br>destes votos a concorrentes no primeiro turno<br>(mínimo de 50% + 1), haverá segundo turno em<br>que concorrerão apenas os dois candidatos mais<br>votados. O segundo turno das eleições no Brasil<br>ocorre para os cargos de Presidente, Vice-Presidente<br>da República, Governador e Vice-Governador dos<br>Estados e do Distrito Federal e para Prefeito e Vice-|



Página 3 

||Prefeito de Municípios com mais de 200 mil eleitores.<br>Nos municípios cujo eleitorado é igual ou menor que<br>200 mil e para o cargo de Senador elege-se a<br>candidata ou o candidato que tenha alcançado a<br>maioria simples dos votos|
|---|---|
|CD_ELEICAO|Código único da eleição noâmbito da Justiça<br>Eleitoral. Observação: este código é único por eleição<br>e por turno, ou seja, cada turno possui seu código de<br>eleição.|
|DS_ELEICAO|Descrição da eleição.|
|SG_UF|Sigla da Unidade da Federação em que ocorreu a<br>eleição.|
|CD_MUNICIPIO|Código TSE do município de ocorrência da eleição.<br>Em caso de eleição com abrangência federal (cargo<br>de Presidente e Vice-Presidente) a sigla é BR. Em<br>caso<br>de<br>abrangência<br>estadual<br>(cargos<br>de<br>Governador, Vice-Governador, Senador, Deputado<br>Federal, Deputado Estadual e Deputado Distrital) a<br>sigla é a UF. Em caso de abrangência municipal<br>(cargos de Prefeito, Vice-Prefeito e Vereador) é o<br>código TSE de identificação do município da<br>candidatura.|
|NM_MUNICIPIO|Nome do município de ocorrência da eleição. Em<br>caso de eleição com abrangência nacional, é igual a<br>"Brasil". Em caso de abrangência estadual, é o nome<br>da UF. Em caso de abrangência municipal, é o nome<br>do município.|
|NR_ZONA|Número da zona eleitoral em que ocorreu a eleição.|
|NR_SECAO|Número da seção eleitoral em que ocorreu a eleição.|
|NR_LOCAL_VOTACAO|Número do local de votação.|
|CD_CARGO_PERGUNTA|Código do cargo da candidata ou candidato ou, no<br>caso de plebiscito, é o código da pergunta.|
|DS_CARGO_PERGUNTA|Descrição do cargo da candidata ou candidato ou, no|



Página 4 

||caso de plebiscito, é o texto da pergunta.|
|---|---|
|NR_PARTIDO|Número do partido da candidata ou candidato.|
|SG_PARTIDO|Sigla do partido da candidata ou candidato.|
|NM_PARTIDO|Nome do partido da candidata ou candidato.|
|DT_BU_RECEBIDO|Data do boletim de urna recebido.|
|QT_APTOS|Quantidade de eleitoras e eleitores aptos a votar.|
|QT_COMPARECIMENTO|Quantidade<br>de<br>eleitoras<br>e<br>eleitores<br>que<br>compareceram às eleições.|
|QT_ABSTENCOES|Quantidade de eleitoras e eleitores aptos que não<br>compareceram às eleições.|
|CD_TIPO_URNA|Código do tipo de urna da urna efetivada. Pode<br>assumir os valores:<br>- 1: Apurada;<br>- 2: Não apurada;<br>- 3: Anulada e apurada em separado;<br>- 4: Anulada; e<br>- 5: Não instalada.|
|DS_TIPO_URNA|Descrição do tipo de urna da urna efetivada. Pode<br>assumir os valores:<br>- Apurada;<br>- Não apurada;<br>- Anulada e apurada em separado;<br>- Anulada; e<br>- Não instalada.|
|CD_TIPO_VOTAVEL|Código do tipo votável. Votável é toda entidade apta<br>a receber votos.|
|DS_TIPO_VOTAVEL|Descrição do tipo votável.|
|NR_VOTAVEL|Número do votável. Pode assumir os valores:<br>. o número da candidata ou candidato, quando voto<br>nominal;<br>. o número do partido, quando voto em legenda;<br>. o número 95, quando voto em branco;<br>. o número 96, quando voto nulo; e|



Página 5 

||. o número 97, quando voto anulado e apurado em<br>separado.|
|---|---|
|NM_VOTAVEL|Nome do votável. Pode assumir os valores:<br>. o nome do candidato, quando voto nominal ou voto<br>anulado;<br>. o nome do partido, quando voto em legenda;<br>. voto em branco, quando voto em branco;<br>. voto nulo, quando voto nulo; e<br>. voto anulado e apurado em separado, quando voto<br>anulado e apurado em separado.|
|QT_VOTOS|Quantidade de votos recebidos pelo votável.|
|NR_URNA_EFETIVADA|Número da urna efetivada. Urna efetivada representa<br>a urna que realmente foi utilizada na eleição. Antes<br>da eleição, há o processo de preparação de todas as<br>urnas que serão utilizadas. Além de todas estas<br>urnas, o TSE também prepara outras urnas que<br>poderão ser utilizadas como contingência, caso<br>ocorra algum problema com as urnas já preparadas.<br>Portanto, a urna efetivada é a urna que foi utilizada<br>na eleição, podendo ser a urna original ou uma outra<br>urna de contingência, caso tenha ocorrido algum<br>problema com a original.|
|CD_CARGA_1_URNA_EFETIVADA|O conjunto dos primeiros 19 caracteres que compõe<br>o código da carga original da urna.|
|CD_CARGA_2_URNA_EFETIVADA|O conjunto dos últimos 6 caracteres que compõe o<br>código da carga original da urna.|
|CD_FLASHCARD_URNA_EFETIVADA|Código do flashcard da urna efetivada.|
|DT_CARGA_URNA_EFETIVADA|Data da carga da urna efetivada.|
|DS_CARGO_PERGUNTA_SECAO|Informação de código do cargo/pergunta concatenado<br>com o número da seção. Apresentando os valores<br>agrupados e separados por hífen no formato:<br>[CD_CARGO_PERGUNTA] - [NR_SECAO]. Caso<br>um dos dois valores seja nulo, deverá retornar|



Página 6 

||#NULO# no lugar do código.|
|---|---|
|DS_SECOES_AGREGADAS|Lista das seções eleitorais agregadas à seção<br>eleitoral principal da referida urna. Caso haja mais de<br>uma seção eleitoral agregada, a lista de seções<br>eleitorais vêm separadas pelo caracter "/". Ex: 10 /<br>114 / 117 / 126.|
|DT_ABERTURA|Data e hora de abertura da urna eletrônica para<br>votação.|
|DT_ENCERRAMENTO|Data e hora de encerramento da urna eletrônica para<br>votação.|
|QT_ELEI_BIOM_SEM_HABILITACAO|Quantidade de eleitoras e eleitores com biometria,<br>mas que não foram habilitados por meio dela.|
|DT_EMISSAO_BU|Data e hora de emissão do boletim de urna.|
|NR_JUNTA_APURADORA|Número<br>da<br>junta<br>apuradora<br>designada<br>para<br>acompanhar a apuração por zona eleitoral.|
|NR_TURMA_APURADORA|Número da turma apuradora do sistema de apuração.|



Página 7 

