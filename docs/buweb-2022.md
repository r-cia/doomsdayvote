## LEIA-ME

Este arquivo contém o leiaute das tabelas existentes no repositório de dados eleitorais. Antes de trabalhar os dados é importante ler as seguintes considerações:

- A codificação de caracteres dos arquivos é "Latin 1";
- Os campos estão entre aspas e separados por ponto e vírgula, inclusive os campos numéricos;
- Campos preenchidos com #NULO significam que a informação está em branco no banco de dados. O correspondente para #NULO nos campos numéricos é -1;
- Campos preenchidos com #NE significam que naquele ano a informação não era registrada em banco de dados pelos sistemas eleitorais. O correspondente para #NE nos campos numéricos é -3;
- O campo UF, além das unidades da federação pode conter alguma das seguintes situações:
  - BR: quando se tratar de informação a nível nacional;
  - VT: quando se tratar de voto em trânsito;
  - ZZ: quando se tratar de Exterior.
- Os arquivos estão em constante processo de atualização e aperfeiçoamento. Alguns arquivos podem estar em branco ou com mensagem de erro devido a indisponibilidade temporária na base de algum estado ou à inexistência daquele arquivo para a época pretendida.

Agradecemos todas as críticas e sugestões recebidas de pesquisadores e usuários que estão colaborando para a melhoria na qualidade da prestação das informações. Em especial à Associação Brasileira de Ciência Política (ABCP), que por meio de acordo de cooperação técnica firmado com o TSE está auxiliando na verificação dos arquivos gerados e informando o TSE quanto às necessidades de dados dos pesquisadores.

Qualquer sugestão ou dúvida deve ser encaminhada ao e-mail estatistica@tse.jus.br.

## I BOLETIM_URNA

NOTAÇÃO: `bweb_<TURNO>_<SIGLA_UF>_<DATA_HORA_GERACAO>.zip`

|Variável|Descrição|
|---|---|
|DT_GERACAO|Data da extração dos dados para geração do arquivo.|
|HH_GERACAO|Hora da extração dos dados para geração do arquivo com base no horário de Brasília.|
|ANO_ELEICAO|Ano de referência da eleição para geração do arquivo.<br>Observação: Para eleições suplementares o ano de referência da eleição é o da eleição ordinária correspondente. Por exemplo: Em 2016 houve eleições ordinárias. Após a data desta eleição ordinária e antes da próxima, houve eleições suplementares em 2017, 2018 e 2019. As informações destas eleições suplementares estarão divulgadas no arquivo gerado para as Eleições 2016.|
|CD_TIPO_ELEICAO|Código do tipo de eleição. Pode assumir os valores: 0 - Eleição Ordinária, 1 - Eleição Extraordinária, 2 - Consulta Popular|
|NM_TIPO_ELEICAO|Nome do tipo de eleição.<br>Observação: As eleições ordinárias são previstas em Lei, possuem data certa para serem realizadas, ocorrem em anos pares e possuem a periodicidade de 04 em 04 anos. Nas eleições ordinárias nacionais são eleitos os cargos de Presidente, Governadores, Deputados (Federais e Estaduais) e Senadores. Nas eleições ordinárias municipais são eleitos os cargos de Prefeito e Vereadores.<br>As eleições suplementares são aquelas que não têm periodicidade pré-determinada ou definida e ocorrem quando, eventualmente, se fizerem necessárias.<br>As consultas populares ocorrem sempre que a população é convocada a opinar diretamente sobre um assunto específico e importante. Ela pode ser realizada de duas formas: plebiscito (quando o cidadão opina previamente sobre a possível criação de uma lei) e referendo (quando uma lei aprovada por um órgão legislativo é submetida à aceitação ou não dos eleitores).|
|CD_PLEITO|Código do pleito é uma informação de eleições em uma determinada data. Um Pleito pode ter uma ou mais eleições. Pleito eleitoral: Assim se diz em alusão à luta ou disputa, que se fere nas eleições, para designar o desenrolar destas. E, desse modo, extensivamente, é a expressão usada para designar as próprias eleições, no período em que se registrarem as votações.|
|DT_PLEITO|Data do pleito da eleição.|
|NR_TURNO|Número do turno da eleição.<br>Observação: No Brasil, as eleições realizam-se por meio de dois sistemas: o sistema majoritário (aplicado aos cargos de Presidente, Vice-Presidente, Governador, Vice-Governador, Prefeito, Vice-Prefeito e Senador) e o sistema proporcional (aplicado aos cargos de Deputado Federal, Deputado Estadual, Deputado Distrital e Vereador). O sistema majoritário consiste em declarar eleito o candidato que tenha recebido a maioria dos votos válidos (excluídos os votos em brancos e os votos nulos). Caso o candidato ao cargo indicado no sistema majoritário, com exceção do cargo de Senador, não alcance maioria absoluta destes votos válidos no primeiro turno (mínimo de 50% + 1), haverá segundo turno em que concorrerão apenas os dois candidatos mais votados. O segundo turno das eleições no Brasil ocorre para os cargos de Presidente, Vice-Presidente da República, Governadores e Vice-Governadores dos Estados e do Distrito Federal e para Prefeitos e Vice-Prefeitos de Municípios com mais de 200 mil eleitores. Nos municípios cujo eleitorado é igual ou menor que 200 mil e para o cargo de Senador elege-se o candidato que tenha alcançado a maioria simples dos votos.|
|CD_ELEICAO|Código único da eleição no âmbito da Justiça Eleitoral.<br>Observação: Este código é único por eleição e por turno, ou seja, cada turno possui seu código de eleição.|
|DS_ELEICAO|Descrição da eleição.|
|SG_UF|Sigla da Unidade da Federação em que ocorreu a eleição.|
|CD_MUNICIPIO|Código TSE do município onde ocorreu a eleição.|
|NM_MUNICIPIO|Nome do município onde ocorreu a eleição.|
|NR_ZONA|Número da Zona Eleitoral em que ocorreu a eleição.|
|NR_SECAO|Número da Seção Eleitoral em que ocorreu a eleição.|
|NR_LOCAL_VOTACAO|Número do local de votação referente ao boletim de urna.|
|CD_CARGO_PERGUNTA|Código do cargo do candidato ou pergunta, no caso de plebiscito.|
|DS_CARGO_PERGUNTA|Descrição do cargo do candidato ou pergunta, no caso de plebiscito.|
|NR_PARTIDO|Número do partido de origem do candidato.|
|SG_PARTIDO|Sigla do partido de origem do candidato.|
|NM_PARTIDO|Nome do Partido de origem do candidato.|
|DT_BU_RECEBIDO|Data do boletim de urna recebido.|
|QT_APTOS|Quantidade de eleitores aptos a votar naquele município, zona e seção.|
|QT_COMPARECIMENTO|Quantidade de eleitores que compareceram às eleições naquele município, zona e seção.|
|QT_ABSTENCOES|Quantidade de eleitores que não compareceram às eleições naquele município, zona e seção.|
|CD_TIPO_URNA|Código de identificação do tipo de urna.|
|DS_TIPO_URNA|Descrição de identificação do tipo de urna.|
|CD_TIPO_VOTAVEL|Código do tipo de votável.|
|DS_TIPO_VOTAVEL|Descrição do tipo votável.|
|NR_VOTAVEL|Pode assumir os valores: Número do candidato (quando voto nominal); Número do partido (quando voto em legenda); Número 95 (quando voto em branco); Número 96 (quando voto nulo); Número 97 (quando voto anulado e apurado em separado) e Número 98 (quando voto anulado).|
|NM_VOTAVEL|Pode assumir os valores: Nome do candidato (quando voto nominal ou voto anulado); Nome do partido (quando voto em legenda); "Voto em branco" (quando voto em branco); "Voto Nulo" (quando voto nulo) e "Voto anulado e apurado em separado" (quando voto anulado e apurado em separado).|
|QT_VOTOS|Quantidade de votos recebidos pelo votável.|
|NR_URNA_EFETIVADA|Número da urna efetivada.|
|CD_CARGA_1_URNA_EFETIVADA|Código da Carga 1 da urna efetivada.|
|CD_CARGA_2_URNA_EFETIVADA|Código da Carga 2 da urna efetivada.|
|CD_FLASHCARD_URNA_EFETIVADA|Código do Flashcard de urna efetivada.|
|DT_CARGA_URNA_EFETIVADA|Data da carga da urna efetivada.|
|DS_CARGO_PERGUNTA_SECAO|Informação de código cargo pergunta e seção. Apresentando os valores agrupados de [CD_CARGO_PERGUNTA][CD_SECAO], caso um dos valores seja nulo, deverá retornar "-" no lugar do código.|
|DS_AGREGADAS|Lista das seções agregadas.|
|DT_ABERTURA|Data/hora de abertura da urna eletrônica para votação.|
|DT_ENCERRAMENTO|Data/hora de encerramento da urna eletrônica para votação.|
|QT_ELEITORES_BIOMETRIA_NH|Quantitativo de eleitores com biometria, mas que não foram habilitados por meio dela.|
|DT_EMISSAO_BU|Data/hora de emissão do boletim de urna (BU).|
|NR_JUNTA_APURADORA|Número da junta apuradora.|
|NR_TURMA_APURADORA|Número da turma apuradora.|
