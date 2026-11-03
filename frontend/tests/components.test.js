import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FilterBar from '../src/components/FilterBar.vue'
import KpiCards from '../src/components/KpiCards.vue'
import MapPanel from '../src/components/MapPanel.vue'
import MapTable from '../src/components/MapTable.vue'
import SectionsTable from '../src/components/SectionsTable.vue'
import { useOrdenacao } from '../src/composables/ordenacao'
import UfPanel from '../src/components/UfPanel.vue'
import PlotDia from '../src/components/PlotDia.vue'
import PlacarRanking from '../src/components/PlacarRanking.vue'
import BiometriaPanel from '../src/components/BiometriaPanel.vue'
import BenfordPanel from '../src/components/BenfordPanel.vue'
import TabelaScroll from '../src/components/TabelaScroll.vue'
import TempoBiometriaPanel from '../src/components/TempoBiometriaPanel.vue'
import IncidentesPanel from '../src/components/IncidentesPanel.vue'
import DivergenciasPanel from '../src/components/DivergenciasPanel.vue'

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

    on(evento, handler) {
      this.handlers ??= {}
      this.handlers[evento] = handler
      MapaFalso.ultimo = this
    }

    getSource() {
      return null
    }

    addSource() {}

    addLayer() {}

    getLayer() {
      return this.features ? {} : null
    }

    fitBounds() {}

    resize() {}

    remove() {}

    queryRenderedFeatures() {
      return this.features ?? []
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
    expect(wrapper.find('[data-test="chart"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1.500')
    expect(wrapper.text()).toContain('8')

    await wrapper.find('input[type="range"]').setValue('0')
    expect(wrapper.emitted('update:corte')[0][0]).toMatch(/^2022-10-02T18:00$/)

    await wrapper.setProps({ corte: '2022-10-02T18:00:00.000Z' })
    expect(wrapper.text()).toContain('1.000')
  })

  it('alterna entre votos e seções no gráfico', async () => {
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

    const grafico = wrapper.findComponent({ name: 'Line' })
    expect(grafico.props('data').datasets[0].label).toBe('Candidato A')

    await wrapper.findAll('.tracado__modos button')[1].trigger('click')
    const dados = wrapper.findComponent({ name: 'Line' }).props('data')
    expect(dados.datasets).toHaveLength(1)
    expect(dados.datasets[0].label).toBe('Seções eleitorais')
    expect(dados.datasets[0].data).toEqual([5, 8])
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
    expect(wrapper.find('[role="status"]').text()).toContain(
      'A fonte deste ano não permite linha do tempo por horário',
    )
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
    expect(texto).toContain('120')

    const botoes = wrapper.findAll('tbody button')
    await botoes[1].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual([22])
  })
})

describe('UfPanel', () => {
  const votos = [
    { categoria: 'nominal', nr_votavel: 13, nm_votavel: 'Lula', sg_partido: 'PT', qt_votos: 1000, percentual: 50 },
    { categoria: 'nominal', nr_votavel: 22, nm_votavel: 'Bolsonaro', sg_partido: 'PL', qt_votos: 800, percentual: 40 },
    { categoria: 'legenda', nr_votavel: 90, nm_votavel: 'Legenda', sg_partido: 'XX', qt_votos: 100, percentual: 5 },
    { categoria: 'branco', nr_votavel: null, nm_votavel: 'Branco', qt_votos: 50, percentual: null },
  ]

  it('lista todos os candidatos da UF selecionada', async () => {
    const wrapper = mount(UfPanel, {
      props: { areas: [], candidatos, votos, ufSelecionada: 'AC' },
    })

    const texto = wrapper.text()
    expect(texto).toContain('Votos por candidato em AC')
    expect(texto).toContain('Lula')
    expect(texto).toContain('Bolsonaro')
    expect(texto).toContain('1.000')
    expect(texto).toContain('50,00%')
    expect(texto).not.toContain('Legenda')

    await wrapper.findAll('button').find((botao) => botao.text() === 'Brasil').trigger('click')
    expect(wrapper.emitted('limpar')).toHaveLength(1)
  })

  it('mostra o líder por UF quando nada está selecionado', async () => {
    const wrapper = mount(UfPanel, {
      props: {
        areas: [
          {
            sg_uf: 'AC',
            total_votos: 1800,
            votos_validos: 1800,
            lider: { nr_votavel: 13, qt_votos: 1000, percentual: 55.56 },
            candidatos: [],
          },
        ],
        candidatos,
        votos: [],
        ufSelecionada: null,
      },
    })

    expect(wrapper.text()).toContain('Votos por estado')
    expect(wrapper.text()).toContain('AC')
    expect(wrapper.text()).toContain('Candidato A')

    await wrapper.find('[aria-pressed]').trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual(['AC'])
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
        dt_abertura: '2022-10-02T11:00:00.000Z',
        dt_encerramento: '2022-10-02T21:00:00.000Z',
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
        dt_abertura: null,
        dt_encerramento: null,
        dt_bu_recebido: null,
        precisao_dt_bu_recebido: null,
      },
    ],
  }

  it('só carrega com UF, pagina e abre detalhe', async () => {
    const semUf = mount(SectionsTable, {
      props: { data, status: '', pageSize: 25, uf: null },
    })
    expect(semUf.text()).toContain('Selecione um estado')
    expect(semUf.findAll('[data-secao-btn]')).toHaveLength(0)

    const wrapper = mount(SectionsTable, {
      props: { data, status: '', pageSize: 25, uf: 'PE' },
    })

    expect(wrapper.findAll('[data-secao-btn]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Abertura')
    expect(wrapper.text()).toContain('Encerramento')
    expect(wrapper.text()).toContain('02/10/2022')
    expect(wrapper.text()).toContain('08:00')
    expect(wrapper.text()).toContain('18:00')

    await wrapper.findAll('button').find((botao) => botao.text() === 'Próxima').trigger('click')
    expect(wrapper.emitted('update:page')[0]).toEqual([2])

    await wrapper.findAll('select')[0].setValue('bu_recebido')
    expect(wrapper.emitted('update:status')[0]).toEqual(['bu_recebido'])

    await wrapper.find('[data-secao-btn]').trigger('click')
    expect(wrapper.emitted('select')[0][0].id).toBe('s1')
  })

  it('ordena pelo cabeçalho no servidor e volta para a página 1', async () => {
    const ordenacao = useOrdenacao()
    const wrapper = mount(SectionsTable, {
      props: { data, status: '', pageSize: 25, uf: 'PE', ordenacao },
    })

    const cabecalho = wrapper.findAll('th.ordenavel').find((th) => th.text() === 'Município')
    expect(cabecalho.attributes('aria-sort')).toBe('none')

    await cabecalho.find('button').trigger('click')
    expect(ordenacao.params.value).toEqual({ ordem: 'nm_municipio', direcao: 'asc' })
    expect(wrapper.emitted('update:page')[0]).toEqual([1])
    expect(cabecalho.attributes('aria-sort')).toBe('ascending')
    expect(cabecalho.text()).toBe('Município ↑')

    await cabecalho.find('button').trigger('click')
    expect(ordenacao.params.value).toEqual({ ordem: 'nm_municipio', direcao: 'desc' })
  })

  it('emite município, zona e seção em campos separados', async () => {
    const wrapper = mount(SectionsTable, {
      props: { data, status: '', pageSize: 25, uf: 'PE' },
    })

    const campos = wrapper.findAll('input')
    expect(campos).toHaveLength(3)

    await campos[0].setValue('Recife')
    expect(wrapper.emitted('update:municipio-nome')[0]).toEqual(['Recife'])

    await campos[1].setValue('9')
    expect(wrapper.emitted('update:zona')[0]).toEqual(['9'])

    await campos[2].setValue('12')
    expect(wrapper.emitted('update:secao')[0]).toEqual(['12'])
  })

  it('mostra estado vazio quando não há itens', () => {
    const wrapper = mount(SectionsTable, {
      props: {
        data: { page: 1, page_size: 25, total: 0, items: [] },
        status: '',
        pageSize: 25,
        uf: 'PE',
      },
    })
    expect(wrapper.text()).toContain('Sem dados.')
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

    expect(wrapper.text()).toContain('não encontrado')
    expect(wrapper.text()).toContain('SP')
  })

  it('emite select com a UF da feição quando não há área correspondente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            { type: 'Feature', properties: { SIGLA_UF: 'SP' }, geometry: null },
          ],
        }),
      }),
    )

    const wrapper = mount(MapPanel, {
      props: {
        areas: [],
        nivel: 'uf',
        modo: 'lider',
        candidato: null,
        candidatos,
      },
    })
    await flushPromises()

    const { Map: MapaFalso } = await import('maplibre-gl')
    const mapa = MapaFalso.ultimo
    mapa.features = [{ properties: { SIGLA_UF: 'SP' } }]
    mapa.handlers.click({ point: { x: 1, y: 1 } })

    expect(wrapper.emitted('select')[0][0]).toEqual({ tipo: 'uf', valor: 'SP' })
  })

  it('mostra UF, seções com BU e corte no tooltip e navega por teclado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              type: 'Feature',
              properties: { CD_MUN: '3550308', SIGLA_UF: 'SP', NM_UF: 'São Paulo' },
              geometry: null,
            },
          ],
        }),
      }),
    )

    const wrapper = mount(MapPanel, {
      props: {
        areas: [
          {
            sg_uf: 'SP',
            cd_municipio_tse: 3550308,
            nm_municipio: 'São Paulo',
            geom_id: '3550308',
            total_votos: 100,
            votos_validos: 90,
            lider: { nr_votavel: 13, qt_votos: 60, percentual: 66.67 },
            candidatos: [],
          },
        ],
        nivel: 'municipio',
        uf: 'SP',
        modo: 'lider',
        candidato: null,
        candidatos,
        corte: { tipo: 'final' },
        secoesComBu: 42,
        semGeometria: [{ sg_uf: 'SP', cd_municipio_tse: 1, nm_municipio: 'X' }],
      },
      attachTo: document.body,
    })
    await flushPromises()

    const { Map: MapaFalso } = await import('maplibre-gl')
    const mapa = MapaFalso.ultimo
    mapa.features = [
      {
        properties: {
          SIGLA_UF: 'SP',
          NM_UF: 'São Paulo',
          CD_MUN: '3550308',
          _key: '3550308',
          _rotulo: 'São Paulo',
        },
      },
    ]
    mapa.handlers.mousemove({ point: { x: 1, y: 1 } })
    await nextTick()

    const tooltip = wrapper.find('.mapa-tooltip')
    expect(tooltip.text()).toContain('SP')
    expect(tooltip.text()).toContain('Seções com BU')
    expect(tooltip.text()).toContain('42')
    expect(tooltip.text()).toContain('Corte final')
    expect(wrapper.text()).toContain('1 localidade sem malha geográfica')

    const mapaEl = wrapper.find('.mapa')
    expect(mapaEl.attributes('tabindex')).toBe('0')
    await mapaEl.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.find('.mapa-tooltip').text()).toContain('3550308')
    await mapaEl.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')[0][0]).toEqual({
      tipo: 'municipio',
      valor: 3550308,
      uf: 'SP',
    })
  })
})

describe('TabelaScroll', () => {
  const slots = { default: '<table><tbody><tr><td>x</td></tr></tbody></table>' }

  it('marca aria-busy e exibe o spinner ao recarregar', () => {
    const wrapper = mount(TabelaScroll, { props: { atualizando: true }, slots })

    expect(wrapper.find('.tabela-scroll').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('.tabela-carga__spinner[role="status"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('não exibe overlay quando não está recarregando', () => {
    const wrapper = mount(TabelaScroll, { props: { atualizando: false }, slots })

    expect(wrapper.find('.tabela-scroll').attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('.tabela-carga__spinner').exists()).toBe(false)
  })
})

describe('TempoBiometriaPanel', () => {
  const metricas = {
    escopo: 'municipio',
    tempo: {
      quantidade: 192,
      mediaMs: 81000,
      medianaMs: 38000,
      maisRapidoMs: 12500,
      maisDemoradoMs: 90000,
    },
    biometria: {
      falhou1: 6,
      falhou2: 3,
      falhou3: 1,
      falhou4: 0,
      manual: 2,
    },
  }

  it('formata as durações em segundos legíveis e lista as faixas de biometria', () => {
    const wrapper = mount(TempoBiometriaPanel, { props: { metricas } })
    const texto = wrapper.text()

    expect(wrapper.findAll('.kpis--quatro > div')).toHaveLength(4)
    expect(texto).toContain('1 min 21 s')
    expect(texto).toContain('38 s')
    expect(texto).toContain('1 min 30 s')
    expect(texto).toContain('13 s')
    expect(texto).toContain('Falhou 4 ou mais tentativas')
    expect(texto).toContain('Habilitação manual')
    expect(texto).toContain('192 eleitores')
  })

  it('mantém os cards com travessão quando não há duração medida', () => {
    const wrapper = mount(TempoBiometriaPanel, {
      props: {
        metricas: {
          tempo: {
            quantidade: 0,
            mediaMs: null,
            medianaMs: null,
            maisRapidoMs: null,
            maisDemoradoMs: null,
          },
          biometria: metricas.biometria,
        },
      },
    })

    expect(wrapper.findAll('.kpis__valor').map((item) => item.text())).toEqual([
      '—',
      '—',
      '—',
      '—',
    ])
  })

  it('mostra o erro no padrão StateBlock e permite tentar novamente', async () => {
    const wrapper = mount(TempoBiometriaPanel, { props: { error: 'falha na totalização' } })

    expect(wrapper.find('.state--erro').exists()).toBe(true)
    expect(wrapper.text()).toContain('falha na totalização')

    await wrapper.find('.state--erro button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('IncidentesPanel', () => {
  const dados = {
    itens: [
      {
        instante: '2026-10-04T16:05:33.000Z',
        nivel: 'ALERTA',
        tipo: 'URNA',
        texto_original: 'Falha de comunicação com a urna',
        sg_uf: 'RR',
        cd_municipio_tse: 3050,
        nr_zona: 3,
        nr_secao: 241,
      },
    ],
    total: 60,
    pagina: 2,
    tamanho: 25,
  }

  it('lista instante, nível, seção e texto original com paginação', async () => {
    const wrapper = mount(IncidentesPanel, { props: { dados, tamanho: 25 } })
    const texto = wrapper.text()

    expect(texto).toContain('ALERTA')
    expect(texto).toContain('URNA')
    expect(texto).toContain('RR · 3050 · 3/241')
    expect(texto).toContain('Falha de comunicação com a urna')
    expect(texto).toContain('Página 2 de 3')

    await wrapper.findAll('.paginacao__botoes button')[2].trigger('click')
    expect(wrapper.emitted('update:page')[0]).toEqual([3])
  })

  it('usa StateBlock no vazio sem renderizar a tabela', () => {
    const wrapper = mount(IncidentesPanel, {
      props: { dados: { itens: [], total: 0, pagina: 1, tamanho: 25 } },
    })

    expect(wrapper.find('.state--vazio').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })
})

describe('DivergenciasPanel', () => {
  const dados = {
    itens: [
      {
        id: 1,
        fonte: 'rdv',
        campo: 'votos',
        sg_uf: 'RR',
        cd_municipio_tse: 3050,
        nr_zona: 3,
        nr_secao: 241,
        cd_cargo_pergunta: 1,
        nr_votavel: 13,
        valor_esperado: '192',
        valor_encontrado: '191',
      },
      {
        id: 2,
        fonte: 'log',
        campo: null,
        sg_uf: 'RR',
        cd_municipio_tse: 3050,
        nr_zona: 3,
        nr_secao: 242,
        cd_cargo_pergunta: null,
        nr_votavel: null,
        valor_esperado: null,
        valor_encontrado: '0',
      },
    ],
    total: 2,
    pagina: 1,
    tamanho: 25,
  }

  it('começa com todas as fontes e exibe esperado e encontrado, sem filtro padrão', () => {
    const wrapper = mount(DivergenciasPanel, { props: { dados } })
    const linhas = wrapper.findAll('tbody tr')

    expect(wrapper.find('select').element.value).toBe('')
    expect(linhas).toHaveLength(2)
    expect(linhas[0].text()).toContain('rdv')
    expect(linhas[0].text()).toContain('192')
    expect(linhas[0].text()).toContain('191')
    expect(linhas[0].text()).toContain('1/13')
    expect(linhas[1].text()).toContain('log')
    expect(linhas[1].text()).toContain('—')
  })

  it('emite a fonte escolhida como filtro opcional', async () => {
    const wrapper = mount(DivergenciasPanel, { props: { dados, fonte: '' } })

    await wrapper.find('select').setValue('log')
    expect(wrapper.emitted('update:fonte')[0]).toEqual(['log'])
  })

  it('usa StateBlock no vazio', () => {
    const wrapper = mount(DivergenciasPanel, {
      props: { dados: { itens: [], total: 0, pagina: 1, tamanho: 25 } },
    })

    expect(wrapper.find('.state--vazio').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
