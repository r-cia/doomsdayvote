import { describe, expect, it } from 'vitest'
import {
  areaPorCodigo,
  candidatoDaArea,
  candidatosNominais,
  codigoMunicipioCurto,
  indexarAreas,
  mapaPartidos,
  normalizarCodigo,
  percentualDaArea,
  resumoCandidato,
  totaisCategoria,
  totalVotos,
  votosValidos,
} from '../src/lib/agregacoes'
import {
  COR_NEUTRA,
  FAIXAS_PERCENTUAL,
  corDaArea,
  corPartido,
  corTextoContraste,
  COR_SEM_DADOS,
  faixaPercentual,
  gradientePartido,
  siglaTemCor,
} from '../src/lib/colors'
import {
  deInputSaoPaulo,
  formatarCorte,
  formatarData,
  formatarCargo,
  formatarDataHora,
  formatarNumero,
  formatarPercentual,
  formatarSha,
  paraInputSaoPaulo,
} from '../src/lib/format'
import {
  avisoInfo,
  motivoSecao,
  opcoesStatus,
  statusSecao,
} from '../src/lib/status'

const votos = [
  {
    categoria: 'nominal',
    nr_votavel: 13,
    nm_votavel: 'Candidato A',
    sg_partido: 'PT',
    nr_partido: 13,
    qt_votos: 600,
  },
  {
    categoria: 'nominal',
    nr_votavel: 22,
    nm_votavel: 'Candidato B',
    sg_partido: 'PL',
    nr_partido: 22,
    qt_votos: 300,
  },
  { categoria: 'legenda', nr_votavel: 13, qt_votos: 50, sg_partido: 'PT' },
  { categoria: 'branco', nr_votavel: null, qt_votos: 30 },
  { categoria: 'nulo', nr_votavel: null, qt_votos: 20 },
]

describe('formatação', () => {
  it('formata números e percentuais em pt-BR', () => {
    expect(formatarNumero(1234)).toBe('1.234')
    expect(formatarNumero(null)).toBe('—')
    expect(formatarPercentual(48.321, 2)).toBe('48,32%')
    expect(formatarPercentual(null)).toBe('—')
  })

  it('formata datas no fuso de São Paulo', () => {
    expect(formatarData('2022-10-02')).toBe('02/10/2022')
    expect(formatarDataHora('2022-10-02T21:30:00.000Z')).toContain('02/10/2022')
    expect(formatarDataHora('2022-10-02T21:30:00.000Z')).toContain('18:30')
  })

  it('converte datetime-local de São Paulo para ISO e de volta', () => {
    expect(deInputSaoPaulo('2022-10-02T18:30')).toBe('2022-10-02T21:30:00.000Z')
    expect(paraInputSaoPaulo('2022-10-02T21:30:00.000Z')).toBe('2022-10-02T18:30')
    expect(deInputSaoPaulo('')).toBeNull()
  })

  it('descreve o corte e encurta hash', () => {
    expect(formatarCorte({ tipo: 'final' })).toBe('Corte final')
    expect(
      formatarCorte({
        tipo: 'recebimento_intradiario',
        as_of: '2022-10-02T21:30:00.000Z',
      }),
    ).toContain('Corte até')
    expect(formatarSha('abcdef0123456789', 8)).toBe('abcdef01…')
  })
})

describe('formatarCargo', () => {
  it('capitaliza primeira letra e minuscula o resto', () => {
    expect(formatarCargo('PRESIDENTE')).toBe('Presidente')
    expect(formatarCargo('Governador')).toBe('Governador')
    expect(formatarCargo(null)).toBe('')
  })
})

describe('cores', () => {
  it('usa paleta fixa e cor neutra para partido sem cor', () => {
    expect(corPartido('pt')).toBe('#d15059')
    expect(corPartido('PL')).toBe('#587ce2')
    expect(corPartido('PARTIDO NOVO XYZ')).toBe(COR_NEUTRA)
    expect(siglaTemCor('PT')).toBe(true)
    expect(siglaTemCor('XYZ')).toBe(false)
  })

  it('resolve siglas históricas para a cor do sucessor', () => {
    const sucessores = {
      PMDB: 'MDB',
      PR: 'PL',
      PRB: 'REPUBLICANOS',
      PPS: 'CIDADANIA',
      SD: 'SOLIDARIEDADE',
      PSDC: 'DC',
      PTN: 'PODE',
      PHS: 'PODE',
      'PT do B': 'AVANTE',
      PSL: 'UNIAO',
      PPL: 'PCDOB',
      PTB: 'PRD',
      PATRIOTA: 'PRD',
      PATRI: 'PRD',
      PEN: 'PRD',
      PRP: 'PRD',
    }
    for (const [historica, sucessor] of Object.entries(sucessores)) {
      expect(corPartido(historica)).toBe(corPartido(sucessor))
      expect(siglaTemCor(historica)).toBe(true)
    }
  })

  it('define PRD em verde escuro distinto de MDB, PV e REDE', () => {
    expect(corPartido('PRD')).toBe('#518064')
    for (const outro of ['MDB', 'PV', 'MISSAO', 'REDE']) {
      expect(corPartido('PRD')).not.toBe(corPartido(outro))
    }
  })

  it('resolve siglas de 2014 com espaços e caixa mista', () => {
    expect(corPartido('PC do B')).toBe(corPartido('PCDOB'))
    expect(corPartido('PT do B')).toBe(corPartido('AVANTE'))
    expect(corPartido('PSDB')).not.toBe(COR_NEUTRA)
  })

  describe('gradiente do modo percentual', () => {
    const luminancia = (hex) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const canal = parseInt(hex.slice(i, i + 2), 16) / 255
        return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    it('cresce em luminância da faixa mais baixa até a cor do partido', () => {
      for (const sigla of ['PT', 'PL', 'PRD', 'PC do B', 'XYZ']) {
        const cores = gradientePartido(sigla).map((faixa) => luminancia(faixa.cor))
        expect(cores).toHaveLength(10)
        for (let i = 1; i < cores.length; i += 1) expect(cores[i]).toBeGreaterThan(cores[i - 1])
      }
    })

    it('a faixa mais alta é exatamente corPartido e a mais baixa se distingue de sem dados', () => {
      for (const sigla of ['PT', 'PL', 'PRD', 'XYZ']) {
        const gradiente = gradientePartido(sigla)
        expect(gradiente.at(-1).cor).toBe(corPartido(sigla))
        const razao =
          (luminancia(gradiente[0].cor) + 0.05) / (luminancia(COR_SEM_DADOS) + 0.05)
        expect(razao).toBeGreaterThanOrEqual(1.3)
      }
    })

    it('partido sem cor na paleta usa o gradiente sobre a cor neutra', () => {
      expect(gradientePartido('XYZ').at(-1).cor).toBe(COR_NEUTRA)
      expect(gradientePartido(undefined).at(-1).cor).toBe(COR_NEUTRA)
    })

    it('mantém as faixas e os rótulos', () => {
      expect(gradientePartido('PT').map((faixa) => faixa.rotulo)).toEqual(
        FAIXAS_PERCENTUAL.map((faixa) => faixa.rotulo),
      )
    })

    it('usa o partido do candidato selecionado, ou o do líder de cada área', () => {
      const partidos = new Map([
        [13, { sg_partido: 'PT' }],
        [22, { sg_partido: 'PL' }],
      ])
      const areaA = { lider: { nr_votavel: 13, percentual: 95 }, candidatos: [{ nr_votavel: 22, percentual: 95 }] }
      const areaB = { lider: { nr_votavel: 22, percentual: 95 }, candidatos: [] }

      expect(corDaArea(areaA, 'percentual', null, partidos)).toBe(gradientePartido('PT').at(-1).cor)
      expect(corDaArea(areaB, 'percentual', null, partidos)).toBe(gradientePartido('PL').at(-1).cor)
      expect(corDaArea(areaA, 'percentual', 22, partidos)).toBe(gradientePartido('PL').at(-1).cor)
      expect(corDaArea({ lider: { nr_votavel: 99, percentual: 5 }, candidatos: [] }, 'percentual', null, partidos)).toBe(
        gradientePartido(undefined)[0].cor,
      )
    })
  })

  it('distribui percentual em dez faixas de dez pontos', () => {
    expect(FAIXAS_PERCENTUAL).toHaveLength(10)
    expect(faixaPercentual(0).rotulo).toBe('0–10%')
    expect(faixaPercentual(9.99).rotulo).toBe('0–10%')
    expect(faixaPercentual(10).rotulo).toBe('10–20%')
    expect(faixaPercentual(99.9).rotulo).toBe('90–100%')
    expect(faixaPercentual(100).rotulo).toBe('90–100%')
    expect(faixaPercentual(null)).toBeNull()
  })

  it('escolhe texto com contraste e cor por área', () => {
    expect(corTextoContraste('#FFFFFF')).toBe('#10150f')
    expect(corTextoContraste('#1E3A8A')).toBe('#FFFFFF')
    const partidos = new Map([[13, { sg_partido: 'PT' }]])
    expect(
      corDaArea({ lider: { nr_votavel: 13 } }, 'lider', null, partidos),
    ).toBe('#d15059')
    expect(
      corDaArea(
        { lider: { percentual: 55 }, candidatos: [] },
        'percentual',
        null,
        partidos,
      ),
    ).toBe(gradientePartido(undefined)[5].cor)
  })
})

describe('status', () => {
  it('mapeia status conhecidos e desconhecidos', () => {
    expect(statusSecao('bu_recebido').tom).toBe('success')
    expect(statusSecao('anulada').tom).toBe('danger')
    expect(statusSecao('status_inexistente').rotulo).toBe('Desconhecido')
    expect(opcoesStatus()).toHaveLength(8)
  })

  it('traduz motivos e avisos', () => {
    expect(motivoSecao('PRECISAO_INSUFICIENTE')).toContain('precisão')
    expect(avisoInfo('METADADOS_DERIVADOS').tom).toBe('info')
    expect(avisoInfo('CODIGO_NOVO').rotulo).toBe('CODIGO_NOVO')
  })
})

describe('agregações', () => {
  it('soma votos e válidos', () => {
    expect(totalVotos(votos)).toBe(1000)
    expect(votosValidos(votos)).toBe(950)
    expect(totaisCategoria(votos)).toEqual({
      nominal: 900,
      legenda: 50,
      branco: 30,
      nulo: 20,
      outros: 0,
    })
  })

  it('lista candidatos nominais e resumo do candidato', () => {
    const nominais = candidatosNominais(votos)
    expect(nominais.map((item) => item.nr_votavel)).toEqual([13, 22])
    expect(resumoCandidato(votos, 13).percentual).toBeCloseTo(63.157, 2)
    expect(mapaPartidos(votos).get(22).sg_partido).toBe('PL')
  })

  it('normaliza códigos e encontra área por código curto', () => {
    expect(normalizarCodigo(' 00123 ')).toBe('123')
    expect(normalizarCodigo('sp')).toBe('SP')
    expect(codigoMunicipioCurto('3550308')).toBe('50308')
    const areas = [{ cd_municipio_tse: 50308, total_votos: 10 }]
    const indice = indexarAreas(areas, 'municipio')
    expect(areaPorCodigo(indice, '3550308', 'municipio')).toBe(areas[0])
  })

  it('seleciona percentual do líder ou do candidato', () => {
    const area = {
      lider: { percentual: 55 },
      candidatos: [{ nr_votavel: 13, percentual: 42 }],
    }
    expect(percentualDaArea(area, 'lider', null)).toBe(55)
    expect(percentualDaArea(area, 'percentual', 13)).toBe(42)
    expect(candidatoDaArea(area, 13).percentual).toBe(42)
    expect(percentualDaArea(area, 'percentual', 99)).toBeNull()
  })
})
