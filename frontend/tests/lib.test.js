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
  faixaPercentual,
  siglaTemCor,
} from '../src/lib/colors'
import {
  deInputSaoPaulo,
  formatarCorte,
  formatarData,
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

describe('cores', () => {
  it('usa paleta fixa e cor neutra para partido sem cor', () => {
    expect(corPartido('pt')).toBe('#C1121F')
    expect(corPartido('PL')).toBe('#1D4ED8')
    expect(corPartido('PARTIDO NOVO XYZ')).toBe(COR_NEUTRA)
    expect(siglaTemCor('PT')).toBe(true)
    expect(siglaTemCor('XYZ')).toBe(false)
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
    expect(corTextoContraste('#FFFFFF')).toBe('#0F172A')
    expect(corTextoContraste('#1E3A8A')).toBe('#FFFFFF')
    const partidos = new Map([[13, { sg_partido: 'PT' }]])
    expect(
      corDaArea({ lider: { nr_votavel: 13 } }, 'lider', null, partidos),
    ).toBe('#C1121F')
    expect(
      corDaArea(
        { lider: { percentual: 55 }, candidatos: [] },
        'percentual',
        null,
        partidos,
      ),
    ).toBe('#3B82F6')
  })
})

describe('status', () => {
  it('mapeia status conhecidos e desconhecidos', () => {
    expect(statusSecao('bu_recebido').tom).toBe('success')
    expect(statusSecao('anulada').tom).toBe('danger')
    expect(statusSecao('status_inexistente').rotulo).toBe('status_inexistente')
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
