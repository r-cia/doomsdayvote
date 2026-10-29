

## LEIA-ME 

Este arquivo contém o leiaute das tabelas existentes no repositório de dados eleitorais. Antes de trabalhar os dados é importante ler as seguintes considerações: 

- A codificação de caracteres dos arquivos é "Latin 1"; 

- Os campos estão entre aspas e separados por ponto e vírgula, inclusive os campos numéricos; 

- Campos preenchidos com #NULO significam que a informação está em branco no banco de dados. O correspondente para #NULO nos campos numéricos é -1; 

- Campos preenchidos com #NE significam que naquele ano a informação não era registrada em banco de dados pelos sistemas eleitorais. O correspondente para #NE nos campos numéricos é -3; 

- O campo UF, além das unidades da federação pode conter alguma das seguintes situações: 

o BR: quando se tratar de informação a nível nacional; 

o VT: quando se tratar de voto em trânsito; 

o ZZ: quando se tratar de Exterior. 

- Os arquivos estão em constante processo de atualização e aperfeiçoamento. Alguns arquivos podem estar em branco ou com mensagem de erro devido a indisponibilidade temporária na base de algum estado ou à inexistência daquele arquivo para a época pretendida. 

Agradecemos todas as críticas e sugestões recebidas de pesquisadores e usuários que estão colaborando para a melhoria na qualidade da prestação das informações. Em especial à Associação Brasileira de Ciência Política (ABCP), que por meio de acordo de cooperação técnica firmado com o TSE está auxiliando na verificação dos arquivos gerados e informando o TSE quanto às necessidades de dados dos pesquisadores. 

Qualquer sugestão ou dúvida deve ser encaminhada ao e-mail <u>estatistica@tse.jus.br.</u> 



Página 1 

# **<mark>I BOLETIM_DE_URNA</mark>** 

NOTAÇÃO: 

<u>bweb <Turno>t <</u> _<u>UF><Data><Hash></u>_ <u>.zip</u> 

|Variável|Descrição|
|---|---|
|DT_GERACAO|Data degeração do arquivo(data da extração dos dados)|
|HH_GERACAO|Hora de geração do arquivo (hora da extração dos dados)<br>- Horário deBrasília|
|ANO_ELEICAO|Ano da eleição(referente ao ano eleitoral depesquisa).|
|CD_PLEITO|Código dopleito da eleição.|
|DT_PLEITO|Data dopleito da eleição.|
|NR_TURNO|Número do turno da eleição.|
|CD_ELEICAO|Código da eleição.|
|DSELEICAO|Descrição da eleição.|
|_<br>DT_ELEICAO|Data emque ocorreu a eleição.|
|SG_UF|Sigla da Unidade da Federação emque ocorreu a eleição.|
|CD_MUNICIPIO|CódigoTSEdomunicípio onde ocorreu a eleição.|
|NM_MUNICIPIO|Nome do município onde ocorreu a eleição.|
|NR_ZONA|Número da Zona Eleitoral em que ocorreu a eleição.|
|NR_SECAO|Número da SeçãoEleitoralemque ocorreu a eleição.|
|NR_LOCAL_VOTACAO|Número do local de votação referente ao boletim de urna.|
|CD_CARGO_PERGUNTA|Código do cargo do candidato ou pergunta, no caso de<br>plebiscito.|
|DS_CARGO_PERGUNTA|Descrição do cargo do candidato ou pergunta, no caso de<br>plebiscito.|
|NR_PARTIDO|Número deidentificação do partido.|
|SG_PARTIDO|Sigla dopartido.|
|NM_PARTIDO|Nome do partido.|
|QT_APTOS|Quantidade de eleitores aptos a votar naquele município,<br>zona e seção.|
|QT_COMPARECIMENTO|Quantidade de eleitores que compareceram às eleições<br>naquele município,zona e seção.|
|QT_ABSTENCOES|Quantidade de eleitores que não compareceram às<br>eleições naquele município,zona e seção.|
|CD_TIPO_URNA|Código de identificação do tipo de urna.|
|DS_TIPO_URNA|Descrição de identificação do tipo de urna.|
|CD_TIPO_VOTAVEL|Código do Tipo de votável.|
|DS_TIPO_VOTAVEL|Descrição do tipo votavel.|
|NR_VOTAVEL|Pode assumir os valores: Número do candidato (quando<br>voto nominal); Número do partido (quando voto em<br>legenda); Número 95 (quando voto em branco); Número<br>96 (quando voto nulo); Número 97 (quando voto anulado e<br>apurado em separado) e Número 98(quando voto<br>anulado).|
|NM_VOTAVEL|Pode assumir os valores: Nome do candidato (quando<br>voto nominal ou voto anulado); Nome do partido (quando<br>voto em legenda); "Voto em branco"(quando voto em|



Página 2 

||branco); "Voto Nulo"(quando voto nulo) e "Voto anulado e<br>apurado em separado"(quando voto anulado e apurado<br>emseparado).|
|---|---|
|QT_VOTOS|Quantidade de votos recebidos pelo votável.|
|NR_URNA_EFETIVADA|Número da urna efetivada.|
|CD_CARGA_1_URNA_EFETIVADA|Código da Carga1da urna efetivada.|
|CD_CARGA_2_URNA_EFETIVADA|Código da Carga 2 da urna efetivada.|
|CD_FLASHCARD_URNA_EFETIVADA|Código doFlashcard de urna efetivada.|
|DT_CARGA_URNA_EFETIVADA|Data da carga da urna efetivada.|
|DS_CARGO_PERGUNTA_SECAO|Informação de cargo, pergunta e seção. Apresentando os<br>valores agrupados de<br>[CD_CARGO_PERGUNTA][CD_SECAO], caso um dos<br>valores sejanulo, deveráretornar "-"nolugardo código.|
|DS_AGREGADAS|Lista das seções agregadas.|
|DT_ABERTURA|Data/hora de abertura da urna eletrônica paravotação.|
|DT_ENCERRAMENTO|Data/hora de encerramento da urna eletrônica para<br>votação.|
|QT_ELEITORES_BIOMETRIA_NH|Quantitativo de eleitores com biometria, mas que não<br>foram habilitados por meio dela.|
|NR_JUNTA_APURADORA|Número dajunta apuradora.|
|NR_TURMA_APURADORA|Número daturma apuradora.|



Página 3 

Página 4 

