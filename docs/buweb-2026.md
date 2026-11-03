## LEIAME

Este arquivo contém o leiaute das tabelas existentes no repositório de dados eleitorais. Antes de trabalhar os dados é importante ler as seguintes considerações:

- A codificação de caracteres dos arquivos é "Latin 1";
- Os campos estão entre aspas e separados por ponto e vírgula, inclusive os campos numéricos;
- Campos preenchidos com #NULO significam que a informação está em branco no banco de dados. O correspondente para #NULO nos campos numéricos é -1;
- Campos preenchidos com #NE significam que naquele ano a informação não era registrada em banco de dados pelos sistemas eleitorais. O correspondente para #NE nos campos numéricos é -3;
- O campo UF, além das unidades da federação, pode conter alguma das seguintes situações:
  - BR: quando se tratar de informação a nível nacional;
  - VT: quando se tratar de voto em trânsito;
  - ZZ: quando se tratar de Exterior.
- Os arquivos estão em constante processo de atualização e aperfeiçoamento. Alguns arquivos podem estar em branco ou com mensagem de erro devido à indisponibilidade temporária na base de algum estado ou à inexistência daquele arquivo para a época pretendida.

Agradecemos todas as críticas e sugestões recebidas de pesquisadores e usuários que estão colaborando para a melhoria na qualidade da prestação das informações. Em especial à Associação Brasileira de Ciência Política (ABCP) que, por meio de acordo de cooperação técnica firmado com o TSE, está auxiliando na verificação dos arquivos gerados e informando o TSE quanto às necessidades de dados dos pesquisadores.

Qualquer sugestão ou dúvida deve ser encaminhada ao e-mail estatistica@tse.jus.br.

# I BOLETIM_URNA

NOTAÇÃO: `BWEB_<TURNO>_<UF>_<DATA_HORA_GERACAO>`

|Variável|Descrição|
|---|---|
|DT_GERACAO|Data da extração dos dados para geração do arquivo.|
|HH_GERACAO|Hora da extração dos dados para geração do arquivo com base no horário de Brasília.|
|ANO_ELEICAO|Ano de referência da eleição para geração do arquivo.<br>Observação: para eleições suplementares o ano de referência da eleição é o da eleição ordinária correspondente. Por exemplo: em 2016 houve eleições ordinárias. Após a data desta eleição ordinária e antes da próxima, houve eleições suplementares em 2017, 2018 e 2019. As informações destas eleições suplementares estarão divulgadas no arquivo gerado para as Eleições 2016.|
|CD_TIPO_ELEICAO|Código do tipo de eleição. Pode assumir os valores:<br>. 0: Eleição Ordinária;<br>. 1: Eleição Extraordinária; e<br>. 2: Consulta Popular.|
|NM_TIPO_ELEICAO|Nome do tipo de eleição.<br>Observação: as eleições ordinárias são previstas em Lei, possuem data certa para serem realizadas, ocorrem em anos pares e possuem a periodicidade de 04 em 04 anos. Nas eleições gerais ordinárias são eleitos os cargos de Presidente, Governador, Deputado (Federal e Estadual) e Senador. Nas eleições ordinárias municipais são eleitos os cargos de Prefeito e Vereador. As eleições suplementares são aquelas que não têm periodicidade pré-determinada ou definida e ocorrem quando, eventualmente, se fizerem necessárias. As consultas populares ocorrem sempre que a população é convocada a opinar diretamente sobre um assunto específico e importante. Ela pode ser realizada de duas formas: plebiscito (quando o cidadão opina previamente sobre a possível criação de uma lei) e referendo (quando uma lei aprovada por um órgão legislativo é submetida à aceitação ou não das eleitoras e dos eleitores)|
|CD_PLEITO|Código de identificação do pleito da eleição. Pleito é o conjunto de uma ou mais eleições que ocorrem em uma mesma data pré-determinada.|
|DT_PLEITO|Data do pleito da eleição.|
|NR_TURNO|Número do turno da eleição.<br>Observação: no Brasil, as eleições realizam-se por meio de dois sistemas: o sistema majoritário (aplicado aos cargos de Presidente, Vice-Presidente, Governador, Vice-Governador, Prefeito, Vice-Prefeito e Senador) e o sistema proporcional (aplicado aos cargos de Deputado Federal, Deputado Estadual, Deputado Distrital e Vereador). O sistema majoritário consiste em declarar eleita a candidata ou o candidato que tenha recebido a maioria dos votos a concorrentes (votos válidos, votos anulados e votos anulados sub judice). Caso a candidata ou o candidato ao cargo indicado no sistema majoritário, com exceção do cargo de Senador, não alcance maioria absoluta destes votos a concorrentes no primeiro turno (mínimo de 50% + 1), haverá segundo turno em que concorrerão apenas os dois candidatos mais votados. O segundo turno das eleições no Brasil ocorre para os cargos de Presidente, Vice-Presidente da República, Governador e Vice-Governador dos Estados e do Distrito Federal e para Prefeito e Vice-Prefeito de Municípios com mais de 200 mil eleitores. Nos municípios cujo eleitorado é igual ou menor que 200 mil e para o cargo de Senador elege-se a candidata ou o candidato que tenha alcançado a maioria simples dos votos|
|CD_ELEICAO|Código único da eleição no âmbito da Justiça Eleitoral.<br>Observação: este código é único por eleição e por turno, ou seja, cada turno possui seu código de eleição.|
|DS_ELEICAO|Descrição da eleição.|
|SG_UF|Sigla da Unidade da Federação em que ocorreu a eleição.|
|CD_MUNICIPIO|Código TSE do município de ocorrência da eleição. Em caso de eleição com abrangência federal (cargo de Presidente e Vice-Presidente) a sigla é BR. Em caso de abrangência estadual (cargos de Governador, Vice-Governador, Senador, Deputado Federal, Deputado Estadual e Deputado Distrital) a sigla é a UF. Em caso de abrangência municipal (cargos de Prefeito, Vice-Prefeito e Vereador) é o código TSE de identificação do município da candidatura.|
|NM_MUNICIPIO|Nome do município de ocorrência da eleição. Em caso de eleição com abrangência nacional, é igual a "Brasil". Em caso de abrangência estadual, é o nome da UF. Em caso de abrangência municipal, é o nome do município.|
|NR_ZONA|Número da zona eleitoral em que ocorreu a eleição.|
|NR_SECAO|Número da seção eleitoral em que ocorreu a eleição.|
|NR_LOCAL_VOTACAO|Número do local de votação.|
|CD_CARGO_PERGUNTA|Código do cargo da candidata ou candidato ou, no caso de plebiscito, é o código da pergunta.|
|DS_CARGO_PERGUNTA|Descrição do cargo da candidata ou candidato ou, no caso de plebiscito, é o texto da pergunta.|
|NR_PARTIDO|Número do partido da candidata ou candidato.|
|SG_PARTIDO|Sigla do partido da candidata ou candidato.|
|NM_PARTIDO|Nome do partido da candidata ou candidato.|
|DT_BU_RECEBIDO|Data do boletim de urna recebido.|
|QT_APTOS|Quantidade de eleitoras e eleitores aptos a votar.|
|QT_COMPARECIMENTO|Quantidade de eleitoras e eleitores que compareceram às eleições.|
|QT_ABSTENCOES|Quantidade de eleitoras e eleitores aptos que não compareceram às eleições.|
|CD_TIPO_URNA|Código do tipo de urna da urna efetivada. Pode assumir os valores:<br>- 1: Apurada;<br>- 2: Não apurada;<br>- 3: Anulada e apurada em separado;<br>- 4: Anulada; e<br>- 5: Não instalada.|
|DS_TIPO_URNA|Descrição do tipo de urna da urna efetivada. Pode assumir os valores:<br>- Apurada;<br>- Não apurada;<br>- Anulada e apurada em separado;<br>- Anulada; e<br>- Não instalada.|
|CD_TIPO_VOTAVEL|Código do tipo votável. Votável é toda entidade apta a receber votos.|
|DS_TIPO_VOTAVEL|Descrição do tipo votável.|
|NR_VOTAVEL|Número do votável. Pode assumir os valores:<br>. o número da candidata ou candidato, quando voto nominal;<br>. o número do partido, quando voto em legenda;<br>. o número 95, quando voto em branco;<br>. o número 96, quando voto nulo; e<br>. o número 97, quando voto anulado e apurado em separado.|
|NM_VOTAVEL|Nome do votável. Pode assumir os valores:<br>. o nome do candidato, quando voto nominal ou voto anulado;<br>. o nome do partido, quando voto em legenda;<br>. voto em branco, quando voto em branco;<br>. voto nulo, quando voto nulo; e<br>. voto anulado e apurado em separado, quando voto anulado e apurado em separado.|
|QT_VOTOS|Quantidade de votos recebidos pelo votável.|
|NR_URNA_EFETIVADA|Número da urna efetivada. Urna efetivada representa a urna que realmente foi utilizada na eleição. Antes da eleição, há o processo de preparação de todas as urnas que serão utilizadas. Além de todas estas urnas, o TSE também prepara outras urnas que poderão ser utilizadas como contingência, caso ocorra algum problema com as urnas já preparadas. Portanto, a urna efetivada é a urna que foi utilizada na eleição, podendo ser a urna original ou uma outra urna de contingência, caso tenha ocorrido algum problema com a original.|
|CD_CARGA_1_URNA_EFETIVADA|O conjunto dos primeiros 19 caracteres que compõe o código da carga original da urna.|
|CD_CARGA_2_URNA_EFETIVADA|O conjunto dos últimos 6 caracteres que compõe o código da carga original da urna.|
|CD_FLASHCARD_URNA_EFETIVADA|Código do flashcard da urna efetivada.|
|DT_CARGA_URNA_EFETIVADA|Data da carga da urna efetivada.|
|DS_CARGO_PERGUNTA_SECAO|Informação de código do cargo/pergunta concatenado com o número da seção. Apresentando os valores agrupados e separados por hífen no formato: [CD_CARGO_PERGUNTA] - [NR_SECAO]. Caso um dos dois valores seja nulo, deverá retornar #NULO# no lugar do código.|
|DS_SECOES_AGREGADAS|Lista das seções eleitorais agregadas à seção eleitoral principal da referida urna. Caso haja mais de uma seção eleitoral agregada, a lista de seções eleitorais vêm separadas pelo caracter "/". Ex: 10 / 114 / 117 / 126.|
|DT_ABERTURA|Data e hora de abertura da urna eletrônica para votação.|
|DT_ENCERRAMENTO|Data e hora de encerramento da urna eletrônica para votação.|
|QT_ELEI_BIOM_SEM_HABILITACAO|Quantidade de eleitoras e eleitores com biometria, mas que não foram habilitados por meio dela.|
|DT_EMISSAO_BU|Data e hora de emissão do boletim de urna.|
|NR_JUNTA_APURADORA|Número da junta apuradora designada para acompanhar a apuração por zona eleitoral.|
|NR_TURMA_APURADORA|Número da turma apuradora do sistema de apuração.|
