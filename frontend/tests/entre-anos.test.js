import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CurvasAnos from '../src/components/CurvasAnos.vue'
import {
  diferenca,
  PALETA_CANDIDATOS,
  PALETA_DIFERENCAS,
  TRACOS_ANOS,
  coresDosCandidatos,
  coresDosPares,
  diferencasEntrePares,
  dominioLog,
  margemEsquerda,
  percentualDoTotal,
  tracosDosAnos,
} from '../src/lib/entre-anos'

describe('cores e traços', () => {
  const nomes = ['LULA', 'JAIR BOLSONARO', 'FERNANDO HADDAD', 'LULA', 'FLAVIO BOLSONARO']

  it('atribui a cor do candidato pela ordem alfabética, independente da ordem de chegada', () => {
    const cores = coresDosCandidatos(nomes)
    expect([...cores.keys()]).toEqual(['FERNANDO HADDAD', 'FLAVIO BOLSONARO', 'JAIR BOLSONARO', 'LULA'])
    expect(cores.get('FERNANDO HADDAD')).toBe(PALETA_CANDIDATOS[0])
    expect(cores.get('LULA')).toBe(PALETA_CANDIDATOS[3])
    expect(coresDosCandidatos([...nomes].reverse())).toEqual(cores)
  })

  it('mapeia cada ano a um traço fixo pela ordem crescente dos anos', () => {
    const tracos = tracosDosAnos([2026, 2018, 2022, 2018])
    expect(tracos.get(2018)).toBe(TRACOS_ANOS[0])
    expect(tracos.get(2022)).toBe(TRACOS_ANOS[1])
    expect(tracos.get(2026)).toBe(TRACOS_ANOS[2])
  })

  it('usa para as diferenças uma paleta disjunta da dos candidatos, uma cor por par', () => {
    expect(PALETA_DIFERENCAS.filter((cor) => PALETA_CANDIDATOS.includes(cor))).toEqual([])
    const pares = coresDosPares([2026, 2018, 2022])
    expect([...pares.keys()]).toEqual(['2018-2022', '2018-2026', '2022-2026'])
    expect(new Set(pares.values()).size).toBe(3)
    for (const cor of pares.values()) expect(PALETA_DIFERENCAS).toContain(cor)
  })

  it('aplica a cor do par às séries de diferença', () => {
    const series = [2018, 2022].map((ano) => ({ chave: String(ano), ano, pontos: [{ minuto: 0, valor: ano }] }))
    const [par] = diferencasEntrePares(series, coresDosPares([2018, 2022]))
    expect(par.cor).toBe(PALETA_DIFERENCAS[0])
  })
})

describe('lib entre-anos', () => {
  it('marca potências de 10 cobrindo o intervalo dos dados', () => {
    expect(dominioLog([3, 250, 207952]).marcas).toEqual([1, 10, 100, 1000, 10000, 100000, 1000000])
    expect(dominioLog([0, 50, 800]).marcas).toEqual([10, 100, 1000])
    expect(dominioLog([100, 100]).marcas).toEqual([100, 1000])
    expect(dominioLog([0, null]).marcas).toEqual([1, 10])
  })

  it('reserva margem pelo maior rótulo', () => {
    expect(margemEsquerda(['0', '207.952'])).toBeGreaterThan(margemEsquerda(['0', '10']))
    expect(margemEsquerda(['207.952'])).toBeGreaterThanOrEqual(7 * 6)
  })

  it('diferença usa só a interseção dos intervalos e ignora nulos', () => {
    const a = [{ minuto: 0, valor: 10 }, { minuto: 5, valor: 20 }, { minuto: 10, valor: null }, { minuto: 15, valor: 8 }]
    const b = [{ minuto: 5, valor: 5 }, { minuto: 10, valor: 1 }, { minuto: 20, valor: 2 }, { minuto: 0, valor: 12 }]
    expect(diferenca(a, b)).toEqual([{ minuto: 0, valor: -2 }, { minuto: 5, valor: 15 }])
  })

  it('percentual do total divide cada intervalo pelo total da curva', () => {
    const pontos = [{ minuto: 0, valor: 25 }, { minuto: 5, valor: 75 }, { minuto: 10, valor: null }]
    expect(percentualDoTotal(pontos)).toEqual([
      { minuto: 0, valor: 25 },
      { minuto: 5, valor: 75 },
      { minuto: 10, valor: null },
    ])
    expect(percentualDoTotal([{ minuto: 0, valor: 0 }])[0].valor).toBeNull()
  })

  it('gera uma diferença por par de anos, rotulada A − B', () => {
    const series = ['2018', '2022', '2026'].map((ano, indice) => ({
      chave: ano,
      ano,
      pontos: [{ minuto: 0, valor: (indice + 1) * 10 }],
    }))
    const resultado = diferencasEntrePares(series)
    expect(resultado.map((item) => item.rotulo)).toEqual(['2018 − 2022', '2018 − 2026', '2022 − 2026'])
    expect(resultado.map((item) => item.pontos[0].valor)).toEqual([-10, -20, -10])
  })
})

describe('CurvasAnos', () => {
  const series = [
    {
      chave: '2018',
      rotulo: '2018 · A',
      pontos: [
        { minuto: 1020, valor: 10 },
        { minuto: 1025, valor: 30 },
      ],
    },
    {
      chave: '2022',
      rotulo: '2022 · B',
      pontos: [
        { minuto: 1020, valor: 20 },
        { minuto: 1025, valor: null },
      ],
    },
  ]

  it('desenha uma curva e uma entrada de legenda por série', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 'Votos por intervalo', series } })

    expect(wrapper.findAll('path')).toHaveLength(2)
    expect(wrapper.findAll('.curvas__legenda li').map((item) => item.text())).toEqual(['2018 · A', '2022 · B'])
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toContain('Votos por intervalo')
  })

  it('ignora pontos nulos no traçado', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 't', series } })

    expect(wrapper.findAll('path')[1].attributes('d').match(/L/g)).toBeNull()
  })

  it('na escala log deixa intervalos com 0 voto como lacuna', () => {
    const wrapper = mount(CurvasAnos, {
      props: {
        titulo: 't',
        escala: 'log',
        series: [
          {
            chave: 'a',
            rotulo: 'a',
            pontos: [
              { minuto: 0, valor: 10 },
              { minuto: 5, valor: 0 },
              { minuto: 10, valor: 5000 },
            ],
          },
        ],
      },
    })

    const caminho = wrapper.get('path').attributes('d')
    expect(caminho.match(/M/g)).toHaveLength(2)
    expect(caminho).not.toContain('L')
    expect(wrapper.text()).toContain('1.000')
  })

  it('usa a cor e o traço informados na série, inclusive na legenda', () => {
    const wrapper = mount(CurvasAnos, {
      props: {
        titulo: 't',
        series: [{ chave: 'a', rotulo: '2022 · LULA', cor: '#123456', tracejado: '8 4', pontos: [{ minuto: 0, valor: 1 }, { minuto: 5, valor: 2 }] }],
      },
    })

    const caminho = wrapper.get('path')
    expect(caminho.attributes('stroke')).toBe('#123456')
    expect(caminho.attributes('stroke-dasharray')).toBe('8 4')
    expect(wrapper.get('.curvas__legenda line').attributes('stroke-dasharray')).toBe('8 4')
  })

  it('desenha a linha de zero quando há diferenças negativas', () => {
    const wrapper = mount(CurvasAnos, {
      props: {
        titulo: 't',
        formato: 'pontos',
        series: [{ chave: 'd', rotulo: '2018 − 2022', pontos: [{ minuto: 0, valor: -3 }, { minuto: 5, valor: 4 }] }],
      },
    })

    expect(wrapper.find('.curvas__zero').exists()).toBe(true)
  })

  it('mostra as horas no eixo a partir dos minutos desde 00:00', () => {
    const wrapper = mount(CurvasAnos, { props: { titulo: 't', series } })

    expect(wrapper.text()).toContain('17:00')
  })
})
