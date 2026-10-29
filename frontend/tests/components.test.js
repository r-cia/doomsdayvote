import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import FilterBar from '../src/components/FilterBar.vue'
import KpiCards from '../src/components/KpiCards.vue'
import MapPanel from '../src/components/MapPanel.vue'
import MapTable from '../src/components/MapTable.vue'
import SectionsTable from '../src/components/SectionsTable.vue'
import PlotDia from '../src/components/PlotDia.vue'
import PlacarRanking from '../src/components/PlacarRanking.vue'
import BiometriaPanel from '../src/components/BiometriaPanel.vue'
import BenfordPanel from '../src/components/BenfordPanel.vue'

vi.mock('vue-chartjs', () => ({
  Line: {
    name: 'Line',
    props: ['data', 'options'],
    template: '<div data-test="chart"></div>',
  },
}))

vi.mock('maplibre-gl', () => {
  class MapaFalso {
    constructor() {
      this.canvas = { style: {} }
    }

    addControl() {}

    on() {}

    getSource() {
      return null
    }

    addSource() {}

    addLayer() {}

    getLayer() {
      return null
    }

    fitBounds() {}

    resize() {}

    remove() {}

    queryRenderedFeatures() {
      return []
    }

    getCanvas() {
      return this.canvas
    }
  }

  class LimitesFalsos {
    extend() {}
  }

  class ControleFalso {
    constructor() {}
  }

  return {
    Map: MapaFalso,
    LngLatBounds: LimitesFalsos,
    NavigationControl: ControleFalso,
    ScaleControl: ControleFalso,
  }
})

const eleicoes = [
  {
    id: 'e1',
    ano_eleicao: 2022,
    nr_turno: 1,
    ds_eleicao: 'Eleição Geral',
    cargos: [
      { cd_cargo_pergunta: 1, ds_cargo_pergunta: 'Presidente' },
      { cd_cargo_pergunta: 3, ds_cargo_pergunta: 'Governador' },
    ],
  },
]

const candidatos = [
  { nr_votavel: 13, nm_votavel: 'Candidato A', sg_partido: 'PT' },
  { nr_votavel: 22, nm_votavel: 'Candidato B', sg_partido: 'PL' },
]

const filtros = {
  electionId: 'e1',
  ano: 2022,
  cargo: 1,
  turno: 1,
  candidato: null,
  asOfInput: '',
  uf: null,
  municipio: null,
}

describe('FilterBar', () => {
  it('pede cargo, ano, turno e candidato nessa ordem', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        cargos: eleicoes[0].cargos,
        anos: [2022, 2018],
        turnos: [1, 2],
        candidatos,
        filtros,
      },
    })

    const selects = wrapper.findAll('select')
    await selects[0].setValue('3')
    await selects[1].setValue('2022')
    await selects[2].setValue('2')
    await selects[3].setValue('22')

    expect(wrapper.emitted('update:cargo')[0]).toEqual([3])
    expect(wrapper.emitted('update:ano')[0]).toEqual([2022])
    expect(wrapper.emitted('update:turno')[0]).toEqual([2])
    expect(wrapper.emitted('update:candidato')[0]).toEqual([22])
  })

  it('emite corte e UF', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        cargos: eleicoes[0].cargos,
        anos: [2022],
        turnos: [1],
        candidatos,
        filtros,
      },
    })

    await wrapper.find('input[type="datetime-local"]').setValue('2022-10-02T18:30')
    const ufSelect = wrapper.findAll('select').at(-1)
    await ufSelect.setValue('SP')

    expect(wrapper.emitted('update:asof')[0]).toEqual(['2022-10-02T18:30'])
    expect(wrapper.emitted('update:uf')[0]).toEqual(['SP'])
  })
})

describe('KpiCards', () => {
  it('mostra votos, seções, carga e candidato', () => {
    const wrapper = mount(KpiCards, {
      props: {
        resumo: {
          captured_at: '2022-10-02T21:30:00.000Z',
          source_updated_at: null,
          secoes_com_bu: 12,
          votos: [
            { categoria: 'nominal', nr_votavel: 13, qt_votos: 600 },
            { categoria: 'nominal', nr_votavel: 22, qt_votos: 400 },
            { categoria: 'branco', nr_votavel: null, qt_votos: 50 },
          ],
          metricas: {
            qt_aptos: 2000,
            qt_comparecimento: 1050,
            qt_abstencoes: 950,
            bus_considerados: 12,
          },
        },
        candidato: candidatos[0],
      },
    })

    const texto = wrapper.text()
    expect(texto).toContain('1.050')
    expect(texto).toContain('12')
    expect(texto).toContain('18:30')
    expect(texto).toContain('60,00%')
    expect(texto).toContain('Candidato A')
  })
})

describe('MapTable', () => {
  const areas = [
    {
      sg_uf: 'SP',
      total_votos: 100,
      votos_validos: 90,
      lider: { nr_votavel: 13, qt_votos: 60, percentual: 66.67 },
      candidatos: [{ nr_votavel: 13, qt_votos: 60, percentual: 66.67 }],
    },
    {
      sg_uf: 'RJ',
      total_votos: 80,
      votos_validos: 70,
      lider: { nr_votavel: 22, qt_votos: 40, percentual: 57.14 },
      candidatos: [{ nr_votavel: 22, qt_votos: 40, percentual: 57.14 }],
    },
  ]

  it('renderiza os mesmos dados do mapa e permite clique', async () => {
    const wrapper = mount(MapTable, {
      props: { areas, nivel: 'uf', modo: 'lider', candidato: 13, candidatos },
    })

    expect(wrapper.text()).toContain('SP')
    expect(wrapper.text()).toContain('Candidato A')
    expect(wrapper.text()).toContain('66,67%')

    await wrapper.find('[data-area-btn="SP"]').trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([{ tipo: 'uf', valor: 'SP' }])
  })

  it('navega por setas e seleciona município com UF', async () => {
    const wrapper = mount(MapTable, {
      props: {
        areas: [
          {
            cd_municipio_tse: 50308,
            total_votos: 10,
            votos_validos: 10,
            lider: { nr_votavel: 13, qt_votos: 6, percentual: 60 },
            candidatos: [],
          },
          {
            cd_municipio_tse: 330455,
            total_votos: 5,
            votos_validos: 5,
            lider: { nr_votavel: 22, qt_votos: 3, percentual: 60 },
            candidatos: [],
          },
        ],
        nivel: 'municipio',
        modo: 'lider',
        candidato: null,
        candidatos,
        uf: 'SP',
      },
      attachTo: document.body,
    })

    const botoes = wrapper.findAll('[data-area-btn]')
    botoes[0].element.focus()
    await wrapper.find('tbody').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(botoes[1].element)

    await botoes[1].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([
      { tipo: 'municipio', valor: 330455, uf: 'SP' },
    ])
  })
})

describe('PlotDia', () => {
  const pontos = [
    { t: '2022-10-02T21:00:00.000Z', votos_acumulados: 1000, secoes_com_bu_acumuladas: 5 },
    { t: '2022-10-02T21:05:00.000Z', votos_acumulados: 1500, secoes_com_bu_acumuladas: 8 },
  ]

  it('mostra o corte, o slider e a leitura do dia', async () => {
    const wrapper = mount(PlotDia, {
      props: {
        pontos,
        series: [
          {
            nr_votavel: 13,
            nm_votavel: 'Candidato A',
            pontos: [
              { t: '2022-10-02T21:00:00.000Z', votos_acumulados: 600 },
              { t: '2022-10-02T21:05:00.000Z', votos_acumulados: 900 },
            ],
          },
        ],
        candidatos,
      },
    })

    expect(wrapper.find('input[type="range"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1.500')
    expect(wrapper.text()).toContain('8')

    await wrapper.find('input[type="range"]').setValue('0')
    expect(wrapper.emitted('update:corte')[0][0]).toMatch(/^2022-10-02T18:00$/)

    await wrapper.setProps({ corte: '2022-10-02T18:00:00.000Z' })
    expect(wrapper.text()).toContain('1.000')
  })

  it('avisa quando a fonte não permite linha do tempo', () => {
    const wrapper = mount(PlotDia, {
      props: {
        pontos: [],
        series: [],
        avisos: [
          {
            codigo: 'CORTE_INDISPONIVEL',
            mensagem: 'A fonte deste ano não permite linha do tempo por horário',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Linha do tempo indisponível')
    expect(wrapper.text()).toContain('não permite linha do tempo')
    expect(wrapper.find('input[type="range"]').exists()).toBe(false)
  })
})

describe('PlacarRanking', () => {
  const votos = [
    { categoria: 'nominal', nr_votavel: 13, nm_votavel: 'Candidato A', sg_partido: 'PT', qt_votos: 600, percentual: 60 },
    { categoria: 'nominal', nr_votavel: 22, nm_votavel: 'Candidato B', sg_partido: 'PL', qt_votos: 400, percentual: 40 },
  ]
  const series = [
    {
      nr_votavel: 13,
      nm_votavel: 'Candidato A',
      pontos: [
        { t: '2022-10-02T21:00:00.000Z', votos_acumulados: 400 },
        { t: '2022-10-02T21:05:00.000Z', votos_acumulados: 600 },
      ],
    },
  ]

  it('ordena por votos, mostra o delta do corte e seleciona', async () => {
    const wrapper = mount(PlacarRanking, { props: { votos, series } })

    const linhas = wrapper.findAll('.placar__linha')
    expect(linhas).toHaveLength(2)
    expect(linhas[0].text()).toContain('Candidato A')
    expect(linhas[0].text()).toContain('60,00%')
    expect(linhas[0].text()).toContain('+200')

    await linhas[1].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([22])
  })
})

describe('BiometriaPanel', () => {
  it('mostra a composição do recorte sem ratear votos', () => {
    const wrapper = mount(BiometriaPanel, {
      props: {
        dados: {
          secoes: 12,
          secoes_sem_campo: 0,
          qt_aptos: 2000,
          qt_comparecimento: 1050,
          qt_habilitados_por_biometria: 900,
          qt_biometria_nao_habilitada: 150,
          percentual_comparecimento: 52.5,
          percentual_habilitada: 85.71,
          percentual_nao_habilitada: 14.29,
        },
        votosCandidato: 600,
        nomeCandidato: 'Candidato A',
      },
    })

    const texto = wrapper.text()
    expect(texto).toContain('1.050')
    expect(texto).toContain('900')
    expect(texto).toContain('150')
    expect(texto).toContain('85,71%')
    expect(texto).toContain('14,29%')
    expect(texto).toContain('nunca por candidato')
    expect(texto).toContain('Candidato A')
  })
})

describe('BenfordPanel', () => {
  const digitos = Array.from({ length: 9 }, (_, indice) => ({
    digito: indice + 1,
    observado: 10,
    observado_percentual: 12,
    esperado_percentual: 30.1 - indice * 2,
  }))

  it('lista todos os candidatos e seleciona um', async () => {
    const wrapper = mount(BenfordPanel, {
      props: {
        dados: {
          minimo_votos: 10,
          candidatos: [
            {
              nr_votavel: 13,
              nm_votavel: 'Candidato A',
              total_votos: 900,
              n: 120,
              secoes_abaixo_minimo: 3,
              mad: 0.0042,
              classificacao: 'conformidade próxima',
              digitos,
            },
            {
              nr_votavel: 22,
              nm_votavel: 'Candidato B',
              total_votos: 400,
              n: 40,
              secoes_abaixo_minimo: 9,
              mad: 0.021,
              classificacao: 'não conformidade',
              digitos,
            },
          ],
        },
      },
    })

    const texto = wrapper.text()
    expect(texto).toContain('Candidato A')
    expect(texto).toContain('Candidato B')
    expect(texto).toContain('0,0042')
    expect(texto).toContain('conformidade próxima')
    expect(texto).toContain('120')

    const botoes = wrapper.findAll('tbody button')
    await botoes[1].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([22])
  })
})

describe('SectionsTable', () => {
  const data = {
    page: 1,
    page_size: 25,
    total: 60,
    items: [
      {
        id: 's1',
        sg_uf: 'PE',
        nm_municipio: 'Recife',
        nr_zona: 1,
        nr_secao: 10,
        nr_local_votacao: 100,
        status: 'bu_recebido',
        motivo: null,
        dt_bu_recebido: '2022-10-02T21:00:00.000Z',
        precisao_dt_bu_recebido: 'DATA_HORA',
      },
      {
        id: 's2',
        sg_uf: 'PE',
        nm_municipio: 'Olinda',
        nr_zona: 2,
        nr_secao: 20,
        nr_local_votacao: 200,
        status: 'sem_bu',
        motivo: null,
        dt_bu_recebido: null,
        precisao_dt_bu_recebido: null,
      },
    ],
  }

  it('busca na página, pagina e abre detalhe', async () => {
    const wrapper = mount(SectionsTable, {
      props: { data, status: '', pageSize: 25 },
    })

    expect(wrapper.findAll('[data-secao-btn]')).toHaveLength(2)
    await wrapper.find('input[type="search"]').setValue('Recife')
    expect(wrapper.findAll('[data-secao-btn]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Recife')

    await wrapper.findAll('button').find((botao) => botao.text() === 'Próxima').trigger('click')
    expect(wrapper.emitted('update:page')[0]).toEqual([2])

    await wrapper.findAll('select')[0].setValue('bu_recebido')
    expect(wrapper.emitted('update:status')[0]).toEqual(['bu_recebido'])

    await wrapper.find('[data-secao-btn]').trigger('click')
    expect(wrapper.emitted('select')[0][0].id).toBe('s1')
  })

  it('mostra estado vazio quando não há itens', () => {
    const wrapper = mount(SectionsTable, {
      props: {
        data: { page: 1, page_size: 25, total: 0, items: [] },
        status: '',
        pageSize: 25,
      },
    })
    expect(wrapper.text()).toContain('Nenhuma seção encontrada')
  })
})

describe('MapPanel', () => {
  it('mostra malha não carregada e mantém a tabela alternativa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    )

    const wrapper = mount(MapPanel, {
      props: {
        areas: [
          {
            sg_uf: 'SP',
            total_votos: 100,
            votos_validos: 90,
            lider: { nr_votavel: 13, qt_votos: 60, percentual: 66.67 },
            candidatos: [],
          },
        ],
        nivel: 'uf',
        modo: 'lider',
        candidato: null,
        candidatos,
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Malha não carregada')
    expect(wrapper.text()).toContain('Nenhuma geografia foi inventada')
    expect(wrapper.text()).toContain('Tabela alternativa ao mapa')
    expect(wrapper.text()).toContain('SP')
  })
})
