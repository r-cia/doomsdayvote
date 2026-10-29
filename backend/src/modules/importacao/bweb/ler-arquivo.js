import path from 'node:path';
import { CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_CANONICOS } from './campos.js';
import { detectarLeiaute, ErroLeiaute } from './detectar-leiaute.js';
import { lerLinhas, lerPrimeiraLinha } from './leitor.js';
import { interpretarNomeArquivo2014 } from './nome-arquivo-2014.js';
import { parsearRegistro2014 } from './parser-2014.js';
import { parsearRegistro2018, validarCabecalho2018 } from './parser-2018.js';
import { parsearRegistro45, validarCabecalho45 } from './parser-45.js';

export async function lerArquivoBweb(caminho, { nomeArquivo } = {}) {
  const leiaute = await detectarLeiaute(caminho);

  if (leiaute === 'BWEB_45') {
    const primeira = await lerPrimeiraLinha(caminho);
    const { headerMap, aliasesAplicados, camposAusentesNoLeiaute } = validarCabecalho45(primeira.campos);

    async function* registros() {
      for await (const { nrLinha, campos } of lerLinhas(caminho)) {
        if (nrLinha === 1) continue;
        yield parsearRegistro45(campos, headerMap, nrLinha);
      }
    }

    return {
      leiaute,
      cabecalhoOriginal: primeira.campos,
      aliasesAplicados,
      metadadosDerivados: [],
      camposAusentesNoLeiaute,
      registros: registros(),
    };
  }

  if (leiaute === 'BWEB_2018_42') {
    const primeira = await lerPrimeiraLinha(caminho);
    const { headerMap, aliasesAplicados, camposAusentesNoLeiaute } = validarCabecalho2018(primeira.campos);

    async function* registros() {
      for await (const { nrLinha, campos } of lerLinhas(caminho)) {
        if (nrLinha === 1) continue;
        yield parsearRegistro2018(campos, headerMap, nrLinha);
      }
    }

    return {
      leiaute,
      cabecalhoOriginal: primeira.campos,
      aliasesAplicados,
      metadadosDerivados: [],
      camposAusentesNoLeiaute,
      registros: registros(),
    };
  }

  if (leiaute === 'BWEB_2014_31') {
    const nome = (nomeArquivo ?? path.basename(caminho)).replace(/\.gz$/i, '');
    const derivados = interpretarNomeArquivo2014(nome);

    async function* registros() {
      for await (const { nrLinha, campos } of lerLinhas(caminho)) {
        yield parsearRegistro2014(campos, nrLinha, derivados);
      }
    }

    return {
      leiaute,
      cabecalhoOriginal: null,
      aliasesAplicados: [],
      metadadosDerivados: {
        campos: ['ANO_ELEICAO', 'NR_TURNO'],
        origem: 'nome_arquivo',
        nomeArquivo: nome,
        valores: { ANO_ELEICAO: derivados.ano, NR_TURNO: derivados.turno },
        geracaoNoNome: derivados.geracao,
      },
      camposAusentesNoLeiaute: CAMPOS_CANONICOS.filter((nomeCampo) => !CAMPOS_2014_31.includes(nomeCampo)),
      registros: registros(),
    };
  }

  throw new ErroLeiaute('LEIAUTE_NAO_SUPORTADO', `Leiaute ${leiaute} não suportado`, { leiaute });
}
