import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import MapPanel from '../src/components/MapPanel.vue'

const { estado } = vi.hoisted(() => ({ estado: { mapas: [], buscas: [] } }))

vi.mock('maplibre-gl', () => {
  class LngLatBounds {
    constructor() {
      this.pontos = []
    }

    extend(ponto) {
      this.pontos.push(ponto)
    }
  }

  class Mapa {
    constructor(opcoes) {
      this.opcoes = opcoes
      this.handlers = new Map()
      this.fontes = new Map()
      this.camadas = new Map()
      this.canvas = { style: {} }
      this.ajustes = []
      this.resultado = []
      this.removido = false
      this.redimensionado = false
      estado.mapas.push(this)
    }

    on(nome, callback) {
      const lista = this.handlers.get(nome) ?? []
      lista.push(callback)
      this.handlers.set(nome, lista)
      return this
    }

    emitir(nome, evento) {
      for (const callback of this.handlers.get(nome) ?? []) callback(evento)
    }

    addControl() {}

    addSource(id, definicao) {
      this.fontes.set(id, definicao)
      this.ultimaFonte = definicao.data
    }

    getSource(id) {
      return this.fontes.get(id) ? { setData: (dados) => { this.ultimaFonte = dados } } : undefined
    }

    addLayer(definicao) {
      this.camadas.set(definicao.id, definicao)
    }

    getLayer(id) {
      return this.camadas.get(id)
    }

    queryRenderedFeatures() {
      return this.resultado
    }

    getCanvas() {
      return this.canvas
    }

    fitBounds(limites, opcoes) {
      this.ajustes.push({ limites, opcoes })
    }

    isStyleLoaded() {
      return true
    }

    resize() {
      this.redimensionado = true
    }

    remove() {
      this.removido = true
    }
  }

  class Controle {
    constructor(opcoes) {
      this.opcoes = opcoes
    }
  }

  return { Map: Mapa, LngLatBounds, NavigationControl: Controle, ScaleControl: Controle }
})

const FEICOES_UF = [
  {
    type: 'Feature',
    properties: { SIGLA_UF: 'SP', NM_UF: 'São Paulo' },
    geometry: { type: 'Polygon', coordinates: [[[-46, -23], [-45, -23], [-45, -22], [-46, -23]]] },
  },
  {
    type: 'Feature',
    properties: { SIGLA_UF: 33, NM_UF: 'Rio de Janeiro' },
    geometry: { type: 'Point', coordinates: [-43, -22] },
  },
]

const FEICOES_MUNICIPIO = [
  {
    type: 'Feature',
    properties: { CD_MUNICIPIO_TSE: 3550308, NM_MUNICIPIO: 'São Paulo', SG_UF: 'SP' },
    geometry: { type: 'MultiPolygon', coordinates: [[[[-46, -23], [-45, -23], [-45, -22], [-46, -23]]]] },
  },
  {
    type: 'Feature',
    properties: { CD_MUNICIPIO_TSE: 3304557, NM_MUNICIPIO: 'Rio', SG_UF: 'RJ' },
    geometry: { type: 'LineString', coordinates: [[-43, -22], [-42, -22]] },
  },
]

const CANDIDATOS = [
  { nr_votavel: 13, nm_votavel: 'Fulano', sg_partido: 'PT' },
  { nr_votavel: 45, nm_votavel: 'Beltrano', sg_partido: 'PSDB' },
]

function areaUf(sgUf, total, lider) {
  return {
    sg_uf: sgUf,
    total_votos: total,
    votos_validos: total,
    lider,
    candidatos: [{ nr_votavel: lider.nr_votavel, qt_votos: total, percentual: lider.percentual }],
  }
}

function resposta(feicoes, ok = true, status = 200, tipo = 'application/json') {
  return {
    ok,
    status,
    headers: { get: () => tipo },
    json: async () => ({ type: 'FeatureCollection', features: feicoes }),
  }
}

function montar(props) {
  return mount(MapPanel, {
    props: { areas: [], candidatos: CANDIDATOS, ...props },
    attachTo: document.body,
  })
}

beforeEach(() => {
  estado.mapas.length = 0
  estado.buscas.length = 0
})

describe('MapPanel: malha e interação', () => {
  it('carrega a malha de UF, desenha as camadas e monta a legenda por partido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        estado.buscas.push(url)
        return resposta(FEICOES_UF)
      }),
    )
    const areas = [
      areaUf('SP', 1000, { nr_votavel: 13, percentual: 55.5 }),
      areaUf('RJ', 500, { nr_votavel: 45, percentual: 40 }),
    ]
    const wrapper = montar({ areas })
    await flushPromises()

    expect(estado.buscas).toEqual(['/geo/br-uf.geojson'])
    const mapa = estado.mapas[0]
    expect(mapa.opcoes.center).toEqual([-52, -15])
    expect(mapa.fontes.has('areas')).toBe(true)
    expect(mapa.camadas.has('areas-fill')).toBe(true)
    expect(mapa.camadas.has('areas-line')).toBe(true)
    expect(mapa.ultimaFonte.features).toHaveLength(2)
    expect(mapa.ultimaFonte.features[0].properties._key).toBe('SP')
    expect(mapa.ajustes.length).toBeGreaterThanOrEqual(1)
    expect(mapa.ajustes.at(-1).opcoes.maxZoom).toBe(4.2)

    expect(wrapper.text()).toContain('Líder por área')
    expect(wrapper.text()).toContain('PT (1)')
    expect(wrapper.text()).toContain('2 feições')

    mapa.emitir('load')
    await flushPromises()
    expect(mapa.ultimaFonte.features).toHaveLength(2)
    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(wrapper.find('.mapa').attributes('role')).toBe('img')
  })

  it('mostra tooltip com os números da área, emite seleção e expõe falha do mapa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(FEICOES_UF)))
    const areas = [areaUf('SP', 1000, { nr_votavel: 13, percentual: 55.5 })]
    const wrapper = montar({ areas })
    await flushPromises()
    const mapa = estado.mapas[0]

    mapa.resultado = [
      {
        properties: { _key: 'SP', _rotulo: 'São Paulo' },
        geometry: { type: 'Polygon', coordinates: [[[-46, -23]]] },
      },
    ]
    mapa.emitir('mousemove', { point: { x: 10, y: 20 } })
    await flushPromises()

    const tooltip = wrapper.find('.mapa-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('São Paulo · SP')
    expect(tooltip.text()).toContain('1.000')
    expect(tooltip.text()).toContain('55,50%')
    expect(mapa.canvas.style.cursor).toBe('pointer')

    mapa.emitir('click', { point: { x: 10, y: 20 } })
    expect(wrapper.emitted('select').at(-1)[0]).toEqual({ tipo: 'uf', valor: 'SP' })

    mapa.resultado = []
    mapa.emitir('mousemove', { point: { x: 10, y: 20 } })
    await flushPromises()
    expect(wrapper.find('.mapa-tooltip').exists()).toBe(false)

    mapa.emitir('error', { error: { message: 'falha ao desenhar' } })
    await flushPromises()
    expect(wrapper.find('.mapa-erro').text()).toContain('falha ao desenhar')

    wrapper.unmount()
    expect(mapa.removido).toBe(true)
  })

  it('filtra a malha municipal pela UF e destaca o candidato no modo percentual', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        estado.buscas.push(url)
        return resposta(url.includes('municipios') ? FEICOES_MUNICIPIO : FEICOES_UF)
      }),
    )
    const wrapper = montar({
      nivel: 'municipio',
      uf: 'SP',
      modo: 'percentual',
      candidato: 13,
      areas: [
        {
          cd_municipio_tse: 3550308,
          nm_municipio: 'São Paulo',
          sg_uf: 'SP',
          total_votos: 900,
          votos_validos: 850,
          lider: { nr_votavel: 13, percentual: 60 },
          candidatos: [{ nr_votavel: 13, qt_votos: 600, percentual: 60 }],
        },
      ],
    })
    await flushPromises()

    const mapa = estado.mapas[0]
    expect(estado.buscas).toEqual(['/geo/br-municipios.geojson'])
    expect(mapa.ultimaFonte.features).toHaveLength(1)
    expect(mapa.ultimaFonte.features[0].properties._key).toBe('3550308')
    expect(mapa.ajustes[0].opcoes.maxZoom).toBe(7)
    expect(wrapper.text()).toContain('Participação de Fulano')

    mapa.resultado = [
      {
        properties: { _key: '3550308', _rotulo: 'São Paulo' },
        geometry: { type: 'Polygon', coordinates: [[[-46, -23]]] },
      },
    ]
    mapa.emitir('click', { point: { x: 1, y: 1 } })
    expect(wrapper.emitted('select').at(-1)[0]).toEqual({
      tipo: 'municipio',
      valor: 3550308,
      uf: 'SP',
    })
  })

  it('refaz a busca da malha quando o arquivo não carrega', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resposta([], false, 404))
      .mockResolvedValue(resposta(FEICOES_UF))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = montar({ areas: [areaUf('SP', 1000, { nr_votavel: 13, percentual: 50 })] })
    await flushPromises()

    expect(wrapper.text()).toContain('Malha não carregada')
    expect(wrapper.text()).toContain('/geo/br-uf.geojson')
    expect(estado.mapas).toHaveLength(1)

    await wrapper.find('.state button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(estado.mapas).toHaveLength(1)
    expect(wrapper.find('.mapa-ausente').exists()).toBe(false)
  })

  it('recusa resposta que não é GeoJSON e exibe a mensagem de erro de carregamento', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => resposta([], true, 200, 'text/html')),
    )
    const wrapper = montar({ areas: [] })
    await flushPromises()

    expect(wrapper.text()).toContain('não devolveu um GeoJSON')
  })
})
