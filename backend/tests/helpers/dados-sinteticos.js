import { crc32 } from 'node:zlib';
import { CAMPOS_2014_31, CAMPOS_2018_42 } from '../../src/modules/importacao/bweb/campos.js';

export const LIMITE_ZIP = 1048576;

const TIPO_UNIVERSAL = Object.freeze({
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  ENUMERATED: 0x0a,
  NUMERIC_STRING: 0x12,
  GENERAL_STRING: 0x1b,
  SEQUENCE: 0x30,
});

const CODIGO_RDV = Object.freeze({ 1: 2, 2: 3, 3: 4, 4: 1 });

const NOME_CARGO = Object.freeze({ 1: 'Presidente', 3: 'Governador' });

const NOME_TIPO_VOTAVEL = Object.freeze({ 1: 'Nominal', 2: 'Legenda', 3: 'Nulo', 4: 'Branco' });

const CAMPOS_BWEB_2026 = [
  'DT_GERACAO',
  'HH_GERACAO',
  'ANO_ELEICAO',
  'CD_TIPO_ELEICAO',
  'NM_TIPO_ELEICAO',
  'CD_PLEITO',
  'DT_PLEITO',
  'NR_TURNO',
  'CD_ELEICAO',
  'DS_ELEICAO',
  'SG_UF',
  'CD_MUNICIPIO',
  'NM_MUNICIPIO',
  'NR_ZONA',
  'NR_SECAO',
  'NR_LOCAL_VOTACAO',
  'CD_CARGO_PERGUNTA',
  'DS_CARGO_PERGUNTA',
  'NR_PARTIDO',
  'SG_PARTIDO',
  'NM_PARTIDO',
  'DT_BU_RECEBIDO',
  'QT_APTOS',
  'QT_COMPARECIMENTO',
  'QT_ABSTENCOES',
  'CD_TIPO_URNA',
  'DS_TIPO_URNA',
  'CD_TIPO_VOTAVEL',
  'DS_TIPO_VOTAVEL',
  'NR_VOTAVEL',
  'NM_VOTAVEL',
  'QT_VOTOS',
  'NR_URNA_EFETIVADA',
  'CD_CARGA_1_URNA_EFETIVADA',
  'CD_CARGA_2_URNA_EFETIVADA',
  'CD_FLASHCARD_URNA_EFETIVADA',
  'DT_CARGA_URNA_EFETIVADA',
  'DS_CARGO_PERGUNTA_SECAO',
  'DS_SECOES_AGREGADAS',
  'DT_ABERTURA',
  'DT_ENCERRAMENTO',
  'QT_ELEI_BIOM_SEM_HABILITACAO',
  'DT_EMISSAO_BU',
  'NR_JUNTA_APURADORA',
  'NR_TURMA_APURADORA',
];

export const CENARIO = Object.freeze({
  ano: 2026,
  turno: 1,
  uf: 'AC',
  municipio: 9999,
  zona: 101,
  secao: 1,
  local: 9001,
  urna: 999999,
  dataHora: '20261004T171000',
  dataHoraArquivo: '20261004T171000',
  abertura: '20261004T070001',
  encerramento: '20261004T170000',
  aberturaEvento: '2026-10-04T07:00:01',
  encerramentoEvento: '2026-10-04T17:00:00',
  comparecimento: 3,
  aptos: 3,
  habilitacao1: 3,
  habilitacao2: 3,
  habilitacao3: 0,
  eleitores: Object.freeze([
    Object.freeze({
      habilitadoEm: '2026-10-04T07:00:10',
      computadoEm: '2026-10-04T07:00:40',
      duracaoMs: 30000,
      falhasBiometria: 0,
      teclasIndevidas: 0,
      correcao: false,
    }),
    Object.freeze({
      habilitadoEm: '2026-10-04T07:01:00',
      computadoEm: '2026-10-04T07:01:20',
      duracaoMs: 20000,
      falhasBiometria: 1,
      teclasIndevidas: 0,
      correcao: false,
    }),
    Object.freeze({
      habilitadoEm: '2026-10-04T07:02:00',
      computadoEm: '2026-10-04T07:02:10',
      duracaoMs: 10000,
      falhasBiometria: 2,
      teclasIndevidas: 1,
      correcao: true,
    }),
  ]),
  incidente: Object.freeze({
    instante: '2026-10-04T07:05:00',
    nivel: 'ALERTA',
    modulo: 'LOGD',
    texto: 'Falha na comunicação com o servidor de totalização',
  }),
  cargos: Object.freeze([
    Object.freeze({
      identificador: 1,
      nome: 'Presidente',
      aptos: 3,
      comparecimento: 3,
      votaveis: Object.freeze([
        Object.freeze({ tipo: 1, numero: 13, nome: 'Candidato 13', quantidade: 1 }),
        Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 1 }),
        Object.freeze({ tipo: 3, numero: null, quantidade: 1 }),
      ]),
    }),
    Object.freeze({
      identificador: 3,
      nome: 'Governador',
      aptos: 3,
      comparecimento: 3,
      votaveis: Object.freeze([
        Object.freeze({ tipo: 1, numero: 10, nome: 'Candidato 10', quantidade: 1 }),
        Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 1 }),
        Object.freeze({ tipo: 3, numero: null, quantidade: 1 }),
      ]),
    }),
  ]),
});

function inteiroConteudo(valor) {
  if (!Number.isInteger(valor) || valor < 0) {
    throw new RangeError(`inteiro BER precisa ser natural: ${valor}`);
  }
  if (valor === 0) return Buffer.from([0]);

  const octetos = [];
  let restante = valor;
  while (restante > 0) {
    octetos.unshift(restante & 0xff);
    restante = Math.floor(restante / 256);
  }
  if (octetos[0] & 0x80) octetos.unshift(0);
  return Buffer.from(octetos);
}

function comprimento(valor) {
  if (valor < 0x80) return Buffer.from([valor]);

  const octetos = [];
  let restante = valor;
  while (restante > 0) {
    octetos.unshift(restante & 0xff);
    restante = Math.floor(restante / 256);
  }
  return Buffer.from([0x80 | octetos.length, ...octetos]);
}

function tlv(tag, conteudo) {
  const dados = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo);
  return Buffer.concat([Buffer.from([tag]), comprimento(dados.length), dados]);
}

function sequencia(...filhos) {
  return tlv(TIPO_UNIVERSAL.SEQUENCE, Buffer.concat(filhos));
}

function inteiro(valor) {
  return tlv(TIPO_UNIVERSAL.INTEGER, inteiroConteudo(valor));
}

function enumerado(valor) {
  return tlv(TIPO_UNIVERSAL.ENUMERATED, inteiroConteudo(valor));
}

function texto(valor) {
  return tlv(TIPO_UNIVERSAL.GENERAL_STRING, Buffer.from(String(valor), 'latin1'));
}

function octetString(valor) {
  return tlv(TIPO_UNIVERSAL.OCTET_STRING, Buffer.isBuffer(valor) ? valor : Buffer.from(valor));
}

function numerico(valor) {
  return tlv(TIPO_UNIVERSAL.NUMERIC_STRING, Buffer.from(String(valor), 'latin1'));
}

function contextoInteiro(numero, valor) {
  return tlv(0x80 | numero, inteiroConteudo(valor));
}

function contextoConstruido(numero, ...filhos) {
  return tlv(0xa0 | numero, Buffer.concat(filhos));
}

function assinaturaVotavel(tipo, numero) {
  const semente = (tipo * 31 + (numero ?? 0)) & 0xff;
  return Buffer.alloc(64, semente);
}

function votavelBer({ tipo, numero = null, quantidade }) {
  const campos = [contextoInteiro(1, tipo), contextoInteiro(2, quantidade)];
  if (numero !== null) campos.push(contextoConstruido(3, inteiro(numero)));
  campos.push(octetString(assinaturaVotavel(tipo, numero)));
  return sequencia(...campos);
}

function cargoBer({ identificador, aptos, comparecimento, votaveis }) {
  return sequencia(
    sequencia(
      inteiro(identificador),
      inteiro(aptos),
      inteiro(0),
      inteiro(0),
      inteiro(0),
      sequencia(
        enumerado(1),
        inteiro(comparecimento),
        sequencia(
          contextoInteiro(1, identificador),
          sequencia(...votaveis.map(votavelBer)),
        ),
      ),
    ),
  );
}

function cargoBer2022({ identificador, aptos, comparecimento, votaveis }) {
  return sequencia(
    inteiro(500 + identificador),
    inteiro(aptos),
    sequencia(
      sequencia(
        enumerado(1),
        inteiro(comparecimento),
        sequencia(
          sequencia(contextoInteiro(1, identificador), inteiro(2), sequencia(...votaveis.map(votavelBer))),
        ),
      ),
    ),
  );
}

function urnaBer(urna) {
  return sequencia(inteiro(urna), octetString(Buffer.alloc(32, 0x11)), sequencia(inteiro(1), texto('URNA')));
}

export function gerarBu(opcoes = {}) {
  const {
    municipio = CENARIO.municipio,
    zona = CENARIO.zona,
    local = CENARIO.local,
    secao = CENARIO.secao,
    urna = CENARIO.urna,
    dataHora = CENARIO.dataHora,
    dataHoraArquivo = CENARIO.dataHoraArquivo,
    abertura = CENARIO.abertura,
    encerramento = CENARIO.encerramento,
    comparecimento = CENARIO.comparecimento,
    habilitacoes = [CENARIO.habilitacao1, CENARIO.habilitacao2, CENARIO.habilitacao3],
    cargos = CENARIO.cargos,
    leiaute2022 = false,
    habilitacoes2022 = null,
  } = opcoes;

  if (leiaute2022) {
    const interno = sequencia(
      sequencia(texto(dataHora)),
      enumerado(2),
      urnaBer(urna),
      sequencia(sequencia(inteiro(municipio), inteiro(zona)), inteiro(local), inteiro(secao)),
      texto('2022'),
      contextoConstruido(0, texto(abertura), texto(encerramento)),
      ...(habilitacoes2022 === null
        ? []
        : [contextoInteiro(1, habilitacoes2022[0]), contextoInteiro(2, habilitacoes2022[1])]),
      contextoConstruido(
        3,
        ...cargos.map((cargo) =>
          cargoBer2022({
            identificador: cargo.identificador,
            aptos: cargo.aptos ?? CENARIO.aptos,
            comparecimento: cargo.comparecimento ?? comparecimento,
            votaveis: cargo.votaveis,
          }),
        ),
      ),
    );
    return sequencia(sequencia(texto(dataHoraArquivo)), octetString(interno));
  }

  const conteudo = sequencia(
    sequencia(texto(dataHora)),
    sequencia(sequencia(inteiro(municipio), inteiro(zona)), inteiro(local), inteiro(secao)),
    urnaBer(urna),
    contextoConstruido(0, texto(abertura), texto(encerramento)),
    inteiro(comparecimento),
    ...(habilitacoes === null
      ? []
      : [contextoConstruido(1, ...habilitacoes.map((valor) => inteiro(valor)))]),
    sequencia(
      ...cargos.map((cargo) =>
        cargoBer({
          identificador: cargo.identificador,
          aptos: cargo.aptos ?? CENARIO.aptos,
          comparecimento: cargo.comparecimento ?? comparecimento,
          votaveis: cargo.votaveis,
        }),
      ),
    ),
  );

  return sequencia(sequencia(texto(dataHoraArquivo)), octetString(conteudo));
}

export function votosDoCenario() {
  return CENARIO.cargos.flatMap((cargo) =>
    cargo.votaveis.map((votavel) => ({
      cargo: cargo.identificador,
      tipo: votavel.tipo,
      numero: votavel.numero,
      quantidade: votavel.quantidade,
    })),
  );
}

export function gerarRdv({ votos = votosDoCenario(), dataHora = CENARIO.dataHora } = {}) {
  const porCargo = new Map();

  for (const voto of votos) {
    const codigo = CODIGO_RDV[voto.tipo];
    if (!codigo) throw new RangeError(`tipo de votável sem código no RDV: ${voto.tipo}`);

    const numero = voto.numero ?? null;
    const campos = [enumerado(codigo)];
    if (numero !== null) campos.push(numerico(numero));
    const votoBer = sequencia(...campos);

    const quantidade = voto.quantidade ?? 1;
    const tag = voto.tag === undefined ? 1 : voto.tag;
    const chave = `${tag}:${voto.cargo}`;
    const grupo = porCargo.get(chave) ?? { tag, cargo: voto.cargo, lista: [] };
    for (let indice = 0; indice < quantidade; indice += 1) {
      grupo.lista.push(votoBer);
    }
    porCargo.set(chave, grupo);
  }

  const blocos = [...porCargo.values()].map(({ tag, cargo, lista }) =>
    sequencia(
      sequencia(
        sequencia(...(tag === null ? [] : [contextoInteiro(tag, cargo)]), sequencia(...lista)),
      ),
    ),
  );

  return sequencia(sequencia(texto(dataHora)), contextoConstruido(1, ...blocos));
}

function instanteLog(instante) {
  const achado = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(instante);
  if (!achado) throw new Error(`instante fora do formato do logd.dat: ${instante}`);
  const [, ano, mes, dia, hora, minuto, segundo] = achado;
  return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

export function gerarZip(entradas) {
  const itens = entradas.map((entrada) =>
    Array.isArray(entrada)
      ? { nome: entrada[0], conteudo: Buffer.from(entrada[1]) }
      : { nome: entrada.nome, conteudo: Buffer.from(entrada.conteudo) },
  );

  const partes = [];
  const centrais = [];
  let deslocamento = 0;

  for (const { nome, conteudo } of itens) {
    const nomeBuffer = Buffer.from(nome, 'latin1');
    const crc = crc32(conteudo);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(conteudo.length, 18);
    local.writeUInt32LE(conteudo.length, 22);
    local.writeUInt16LE(nomeBuffer.length, 26);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(conteudo.length, 20);
    central.writeUInt32LE(conteudo.length, 24);
    central.writeUInt16LE(nomeBuffer.length, 28);
    central.writeUInt32LE(deslocamento, 42);

    partes.push(local, nomeBuffer, conteudo);
    centrais.push(central, nomeBuffer);
    deslocamento += local.length + nomeBuffer.length + conteudo.length;
  }

  const diretorioCentral = Buffer.concat(centrais);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(itens.length, 8);
  eocd.writeUInt16LE(itens.length, 10);
  eocd.writeUInt32LE(diretorioCentral.length, 12);
  eocd.writeUInt32LE(deslocamento, 16);

  const zip = Buffer.concat([...partes, diretorioCentral, eocd]);
  if (zip.length > LIMITE_ZIP) {
    throw new Error(`zip sintético excede ${LIMITE_ZIP} bytes: ${zip.length}`);
  }
  return zip;
}

export function eventosDoCenario() {
  const eventos = [
    {
      instante: CENARIO.aberturaEvento,
      nivel: 'INFO',
      modulo: 'URNA',
      texto: 'Urna pronta para receber votos',
    },
  ];

  for (const eleitor of CENARIO.eleitores) {
    eventos.push({
      instante: eleitor.habilitadoEm,
      nivel: 'INFO',
      modulo: 'LOGD',
      texto: 'Eleitor foi habilitado',
    });
    eventos.push({
      instante: eleitor.habilitadoEm,
      nivel: 'INFO',
      modulo: 'LOGD',
      texto: 'Tipo de habilitação do eleitor [biométrica]',
    });

    for (let tentativa = 0; tentativa < eleitor.falhasBiometria; tentativa += 1) {
      eventos.push({
        instante: eleitor.habilitadoEm,
        nivel: 'INFO',
        modulo: 'LOGD',
        texto: 'Número de tentativas de reconhecimento do dedo. Quantidade: 1',
      });
    }

    for (let tecla = 0; tecla < eleitor.teclasIndevidas; tecla += 1) {
      eventos.push({
        instante: eleitor.computadoEm,
        nivel: 'INFO',
        modulo: 'LOGD',
        texto: 'Tecla indevida pressionada',
      });
    }

    if (eleitor.correcao) {
      eventos.push({
        instante: eleitor.computadoEm,
        nivel: 'INFO',
        modulo: 'LOGD',
        texto: 'Eleitor corrigiu na tela de confirmação de candidato',
      });
    }

    eventos.push({
      instante: eleitor.computadoEm,
      nivel: 'INFO',
      modulo: 'LOGD',
      texto: 'O voto do eleitor foi computado',
    });
  }

  eventos.push({
    instante: CENARIO.incidente.instante,
    nivel: CENARIO.incidente.nivel,
    modulo: CENARIO.incidente.modulo,
    texto: CENARIO.incidente.texto,
  });

  eventos.push({
    instante: CENARIO.encerramentoEvento,
    nivel: 'INFO',
    modulo: 'URNA',
    texto: 'Procedimento de encerramento confirmado',
  });

  return eventos;
}

export function gerarLogJez({ eventos = eventosDoCenario(), corromper = [] } = {}) {
  const linhas = eventos.map((evento, indice) => {
    if (corromper.includes(indice)) return '04-10/0006 08:11840\tINDO\t01740981\tTOTA\tVmtm aolfirmado';
    const {
      instante,
      nivel = 'INFO',
      urna = CENARIO.urna,
      modulo = 'LOGD',
      texto,
      hash = '0000000000000000',
    } = evento;
    return `${instanteLog(instante)}\t${nivel}\t${urna}\t${modulo}\t${texto}\t${hash}`;
  });

  return gerarZip([['logd.dat', Buffer.from(`${linhas.join('\r\n')}\r\n`, 'latin1')]]);
}

function instanteArquivo(valor) {
  const achado = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(valor);
  if (!achado) throw new Error(`instante BU fora do formato: ${valor}`);
  return { ano: achado[1], mes: achado[2], dia: achado[3], hora: achado[4], minuto: achado[5] };
}

function dataBweb(valor) {
  const { ano, mes, dia } = instanteArquivo(valor);
  return `${dia}/${mes}/${ano}`;
}

function dataHoraBweb(valor) {
  const { ano, mes, dia, hora, minuto } = instanteArquivo(valor);
  return `${dia}/${mes}/${ano} ${hora}:${minuto}:00`;
}

function campoBweb(valor) {
  const texto = String(valor ?? '');
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const CARGOS_FORA_DO_ESCOPO = Object.freeze([
  Object.freeze({
    identificador: 5,
    nome: 'Senador',
    votaveis: Object.freeze([Object.freeze({ tipo: 1, numero: 123, nome: 'Candidato 123', quantidade: 1 })]),
  }),
  Object.freeze({
    identificador: 6,
    nome: 'Deputado Federal',
    votaveis: Object.freeze([Object.freeze({ tipo: 1, numero: 456, nome: 'Candidato 456', quantidade: 1 })]),
  }),
]);

function linhaDeCampos(campos, valores) {
  return campos.map((campo) => campoBweb(valores[campo])).join(';');
}

export function gerarBweb(opcoes = {}) {
  const {
    ano = CENARIO.ano,
    turno = CENARIO.turno,
    uf = CENARIO.uf,
    municipio = CENARIO.municipio,
    zona = CENARIO.zona,
    secao = CENARIO.secao,
    local = CENARIO.local,
    urna = CENARIO.urna,
    cargos = CENARIO.cargos,
    incluirForaDoEscopo = false,
    dataGeracao = CENARIO.dataHora,
    dataBuRecebido = '20261004T172000',
    dataEmissao = CENARIO.dataHora,
    abertura = CENARIO.abertura,
    encerramento = CENARIO.encerramento,
    dataPleito = CENARIO.dataHora,
    pleito = 9601,
    eleicao = 9601,
    tipoEleicao = 1,
    nomeTipoEleicao = 'Eleição Geral Federal',
    dsEleicao = 'Eleições 2026',
    nomeMunicipio = `MUNICÍPIO ${municipio}`,
    nrPartido = 0,
    sgPartido = '',
    nmPartido = '',
  } = opcoes;

  const linhas = [CAMPOS_BWEB_2026.join(';')];

  const cargosDoArquivo = incluirForaDoEscopo ? [...cargos, ...CARGOS_FORA_DO_ESCOPO] : cargos;

  for (const cargo of cargosDoArquivo) {
    const aptos = cargo.aptos ?? CENARIO.aptos;
    const comparecimento = cargo.comparecimento ?? CENARIO.comparecimento;

    for (const votavel of cargo.votaveis) {
      const numero = votavel.numero ?? 95;
      const campos = {
        DT_GERACAO: dataBweb(dataGeracao),
        HH_GERACAO: dataHoraBweb(dataGeracao).slice(-8),
        ANO_ELEICAO: ano,
        CD_TIPO_ELEICAO: tipoEleicao,
        NM_TIPO_ELEICAO: nomeTipoEleicao,
        CD_PLEITO: pleito,
        DT_PLEITO: dataBweb(dataPleito),
        NR_TURNO: turno,
        CD_ELEICAO: eleicao,
        DS_ELEICAO: dsEleicao,
        SG_UF: uf,
        CD_MUNICIPIO: municipio,
        NM_MUNICIPIO: nomeMunicipio,
        NR_ZONA: zona,
        NR_SECAO: secao,
        NR_LOCAL_VOTACAO: local,
        CD_CARGO_PERGUNTA: cargo.identificador,
        DS_CARGO_PERGUNTA: cargo.nome ?? NOME_CARGO[cargo.identificador],
        NR_PARTIDO: nrPartido,
        SG_PARTIDO: sgPartido,
        NM_PARTIDO: nmPartido,
        DT_BU_RECEBIDO: dataHoraBweb(dataBuRecebido),
        QT_APTOS: aptos,
        QT_COMPARECIMENTO: comparecimento,
        QT_ABSTENCOES: aptos - comparecimento,
        CD_TIPO_URNA: 1,
        DS_TIPO_URNA: 'Urna eletrônica',
        CD_TIPO_VOTAVEL: votavel.tipo,
        DS_TIPO_VOTAVEL: NOME_TIPO_VOTAVEL[votavel.tipo],
        NR_VOTAVEL: numero,
        NM_VOTAVEL: votavel.nome ?? '',
        QT_VOTOS: votavel.quantidade,
        NR_URNA_EFETIVADA: urna,
        CD_CARGA_1_URNA_EFETIVADA: '',
        CD_CARGA_2_URNA_EFETIVADA: '',
        CD_FLASHCARD_URNA_EFETIVADA: '',
        DT_CARGA_URNA_EFETIVADA: '',
        DS_CARGO_PERGUNTA_SECAO: cargo.nome ?? NOME_CARGO[cargo.identificador],
        DS_SECOES_AGREGADAS: '',
        DT_ABERTURA: dataHoraBweb(abertura),
        DT_ENCERRAMENTO: dataHoraBweb(encerramento),
        QT_ELEI_BIOM_SEM_HABILITACAO: 0,
        DT_EMISSAO_BU: dataHoraBweb(dataEmissao),
        NR_JUNTA_APURADORA: 0,
        NR_TURMA_APURADORA: 0,
      };

      linhas.push(CAMPOS_BWEB_2026.map((campo) => campoBweb(campos[campo])).join(';'));
    }
  }

  return `${linhas.join('\n')}\n`;
}

const CARGOS_2014 = Object.freeze([
  Object.freeze({
    identificador: 1,
    nome: 'Presidente',
    votaveis: Object.freeze([
      Object.freeze({ tipo: 1, numero: 13, nome: 'Candidato 13', quantidade: 50 }),
      Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 40 }),
    ]),
  }),
  Object.freeze({
    identificador: 3,
    nome: 'Governador',
    votaveis: Object.freeze([
      Object.freeze({ tipo: 1, numero: 10, nome: 'Candidato 10', quantidade: 45 }),
      Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 45 }),
    ]),
  }),
]);

export function gerarBweb2014({
  incluirForaDoEscopo = false,
  uf = 'AC',
  municipio = 1392,
  nomeMunicipio = 'RIO BRANCO',
  zona = 1,
  secao = 2,
  local = 3,
  urna = 123,
} = {}) {
  const cargos = incluirForaDoEscopo ? [...CARGOS_2014, ...CARGOS_FORA_DO_ESCOPO] : CARGOS_2014;
  const linhas = [];

  for (const cargo of cargos) {
    for (const votavel of cargo.votaveis) {
      linhas.push(
        linhaDeCampos(CAMPOS_2014_31, {
          DT_GERACAO: '14/10/2014',
          HH_GERACAO: '13:16:00',
          CD_PLEITO: 143,
          CD_ELEICAO: 157,
          SG_UF: uf,
          CD_CARGO_PERGUNTA: cargo.identificador,
          DS_CARGO_PERGUNTA: cargo.nome,
          NR_ZONA: zona,
          NR_SECAO: secao,
          NR_LOCAL_VOTACAO: local,
          NR_PARTIDO: 13,
          NM_PARTIDO: 'PT',
          CD_MUNICIPIO: municipio,
          NM_MUNICIPIO: nomeMunicipio,
          DT_BU_RECEBIDO: '14/10/2014',
          QT_APTOS: 100,
          QT_ABSTENCOES: 10,
          QT_COMPARECIMENTO: 90,
          CD_TIPO_ELEICAO: 0,
          CD_TIPO_URNA: 1,
          DS_TIPO_URNA: 'Apurada',
          NR_VOTAVEL: votavel.numero,
          NM_VOTAVEL: votavel.nome,
          QT_VOTOS: votavel.quantidade,
          CD_TIPO_VOTAVEL: votavel.tipo,
          NR_URNA_EFETIVADA: urna,
          CD_CARGA_1_URNA_EFETIVADA: 'c1',
          CD_CARGA_2_URNA_EFETIVADA: 'c2',
          DT_CARGA_URNA_EFETIVADA: '14/10/2014',
          CD_FLASHCARD_URNA_EFETIVADA: 'c4',
          DS_CARGO_PERGUNTA_SECAO: `${cargo.nome} ${secao}`,
        }),
      );
    }
  }

  return `${linhas.join('\n')}\n`;
}

const CARGOS_2018 = Object.freeze([
  Object.freeze({
    identificador: 1,
    nome: 'Presidente',
    votaveis: Object.freeze([
      Object.freeze({ tipo: 1, numero: 13, nome: 'Candidato 13', quantidade: 45 }),
      Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 45 }),
    ]),
  }),
  Object.freeze({
    identificador: 3,
    nome: 'Governador',
    votaveis: Object.freeze([
      Object.freeze({ tipo: 1, numero: 10, nome: 'Candidato 10', quantidade: 45 }),
      Object.freeze({ tipo: 1, numero: 22, nome: 'Candidato 22', quantidade: 45 }),
    ]),
  }),
]);

const ALIASES_2018 = Object.freeze({
  SG_UF: 'SG_ UF',
  CD_FLASHCARD_URNA_EFETIVADA: 'CD_FLASCARD_URNA_EFETIVADA',
  DS_SECOES_AGREGADAS: 'DS_AGREGADAS',
  QT_ELEI_BIOM_SEM_HABILITACAO: 'QT_ELEITORES_BIOMETRIA_NH',
});

export function gerarBweb2018({
  incluirForaDoEscopo = false,
  uf = 'AC',
  municipio = 1392,
  nomeMunicipio = 'RIO BRANCO',
  zona = 1,
  secao = 2,
  local = 3,
  urna = 123,
} = {}) {
  const cargos = incluirForaDoEscopo ? [...CARGOS_2018, ...CARGOS_FORA_DO_ESCOPO] : CARGOS_2018;
  const linhas = [CAMPOS_2018_42.map((campo) => ALIASES_2018[campo] ?? campo).join(';')];

  for (const cargo of cargos) {
    for (const votavel of cargo.votaveis) {
      linhas.push(
        linhaDeCampos(CAMPOS_2018_42, {
          DT_GERACAO: '30/10/2018',
          HH_GERACAO: '17:44:00',
          ANO_ELEICAO: 2018,
          CD_PLEITO: 202,
          DT_PLEITO: '28/10/2018',
          NR_TURNO: 2,
          CD_ELEICAO: 203,
          DS_ELEICAO: 'Eleições Gerais 2018',
          DT_ELEICAO: '07/10/2018',
          SG_UF: uf,
          CD_MUNICIPIO: municipio,
          NM_MUNICIPIO: nomeMunicipio,
          NR_ZONA: zona,
          NR_SECAO: secao,
          NR_LOCAL_VOTACAO: local,
          CD_CARGO_PERGUNTA: cargo.identificador,
          DS_CARGO_PERGUNTA: cargo.nome,
          NR_PARTIDO: 13,
          SG_PARTIDO: 'PT',
          NM_PARTIDO: 'Partido dos Trabalhadores',
          QT_APTOS: 100,
          QT_COMPARECIMENTO: 90,
          QT_ABSTENCOES: 10,
          CD_TIPO_URNA: 1,
          DS_TIPO_URNA: 'Apurada',
          CD_TIPO_VOTAVEL: votavel.tipo,
          DS_TIPO_VOTAVEL: NOME_TIPO_VOTAVEL[votavel.tipo],
          NR_VOTAVEL: votavel.numero,
          NM_VOTAVEL: votavel.nome,
          QT_VOTOS: votavel.quantidade,
          NR_URNA_EFETIVADA: urna,
          CD_CARGA_1_URNA_EFETIVADA: 'c1',
          CD_CARGA_2_URNA_EFETIVADA: 'c2',
          CD_FLASHCARD_URNA_EFETIVADA: 'c4',
          DT_CARGA_URNA_EFETIVADA: '28/10/2018',
          DS_CARGO_PERGUNTA_SECAO: `${cargo.nome} ${secao}`,
          DS_SECOES_AGREGADAS: '0001,0002',
          QT_ELEI_BIOM_SEM_HABILITACAO: 2,
          NR_JUNTA_APURADORA: 0,
          NR_TURMA_APURADORA: 0,
        }),
      );
    }
  }

  return `${linhas.join('\n')}\n`;
}

export function gerarBweb45(opcoes = {}) {
  return gerarBweb(opcoes);
}

function combinarComCabecalho(conteudos) {
  const [primeiro, ...resto] = conteudos.map((conteudo) => conteudo.trimEnd());
  const linhas = primeiro.split('\n');
  const corpo = linhas.slice(1);
  for (const conteudo of resto) corpo.push(...conteudo.split('\n').slice(1));
  return `${[linhas[0], ...corpo].join('\n')}\n`;
}

function concatenar(conteudos) {
  return conteudos.map((conteudo) => conteudo.trimEnd()).join('\n') + '\n';
}

export function gerarBwebMulti(opcoes = []) {
  return combinarComCabecalho(opcoes.map((item) => gerarBweb(item)));
}

export function gerarBweb2014Multi(opcoes = []) {
  return concatenar(opcoes.map((item) => gerarBweb2014(item)));
}

export function gerarBweb2018Multi(opcoes = []) {
  return combinarComCabecalho(opcoes.map((item) => gerarBweb2018(item)));
}

export function opcoesDeSecoes(total, base = {}) {
  return Array.from({ length: total }, (_, indice) => ({ secao: indice + 1, ...base }));
}
