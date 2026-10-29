<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import {
  LngLatBounds,
  Map as MapaLibre,
  NavigationControl,
  ScaleControl,
} from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapTable from './MapTable.vue'
import StateBlock from './StateBlock.vue'
import {
  areaPorCodigo,
  candidatoDaArea,
  indexarAreas,
  normalizarCodigo,
} from '../lib/agregacoes'
import {
  COR_SEM_DADOS,
  FAIXAS_PERCENTUAL,
  corDaArea,
  corPartido,
  corTextoContraste,
} from '../lib/colors'
import { formatarNumero, formatarPercentual } from '../lib/format'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  nivel: { type: String, default: 'uf' },
  modo: { type: String, default: 'lider' },
  candidato: { type: Number, default: null },
  candidatos: { type: Array, default: () => [] },
  uf: { type: String, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  altura: { type: String, default: '440px' },
})

const emit = defineEmits([
  'update:level',
  'update:mode',
  'select',
  'retry',
])

const container = ref(null)
const mapa = ref(null)
const mapaPronto = ref(false)
const malha = ref(null)
const malhaEstado = ref('carregando')
const malhaMensagem = ref('')
const feicoesNaMalha = ref(0)
const cacheMalhas = new Map()
let tokenMalha = 0
const tooltip = reactive({
  visivel: false,
  x: 0,
  y: 0,
  titulo: '',
  linhas: [],
})

const CAMPOS_UF = [
  'sg_uf',
  'SG_UF',
  'sigla',
  'SIGLA',
  'SIGLA_UF',
  'uf',
  'UF',
  'cd_uf',
  'CD_UF',
]
const CAMPOS_MUNICIPIO = [
  'cd_municipio_tse',
  'CD_MUNICIPIO_TSE',
  'cd_municipio',
  'CD_MUNICIPIO',
  'cd_mun',
  'CD_MUN',
  'codarea',
  'CODAREA',
  'geocodigo',
  'GEOCODIGO',
  'cd_geocodm',
  'CD_GEOCODM',
  'id',
  'ID',
]
const CODIGOS_UF = {
  11: 'RO',
  12: 'AC',
  13: 'AM',
  14: 'RR',
  15: 'PA',
  16: 'AP',
  17: 'TO',
  21: 'MA',
  22: 'PI',
  23: 'CE',
  24: 'RN',
  25: 'PB',
  26: 'PE',
  27: 'AL',
  28: 'SE',
  29: 'BA',
  31: 'MG',
  32: 'ES',
  33: 'RJ',
  35: 'SP',
  41: 'PR',
  42: 'SC',
  43: 'RS',
  50: 'MS',
  51: 'MT',
  52: 'GO',
  53: 'DF',
}
const CAMPOS_NOME = [
  'nm_municipio',
  'NM_MUNICIPIO',
  'nm_mun',
  'NM_MUN',
  'nm_uf',
  'NM_UF',
  'nome',
  'NOME',
  'name',
  'NAME',
]

const indiceAreas = computed(() => indexarAreas(props.areas, props.nivel))
const partidoPorNumero = computed(() => {
  const mapaCandidatos = new Map()
  for (const candidato of props.candidatos) {
    mapaCandidatos.set(candidato.nr_votavel, candidato)
  }
  return mapaCandidatos
})
const candidatoSelecionado = computed(() => {
  if (props.candidato === null || props.candidato === undefined) return null
  return (
    props.candidatos.find(
      (candidato) => candidato.nr_votavel === props.candidato,
    ) ?? {
      nr_votavel: props.candidato,
      nm_votavel: `Candidato ${props.candidato}`,
      sg_partido: null,
    }
  )
})
const rotuloNivel = computed(() =>
  props.nivel === 'uf' ? 'UF' : 'Município',
)

function primeiroValor(propriedades, campos) {
  for (const campo of campos) {
    const valor = propriedades?.[campo]
    if (valor !== null && valor !== undefined && valor !== '') return valor
  }
  return null
}

function normalizarUf(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const numero = Number(valor)
  if (Number.isInteger(numero) && CODIGOS_UF[numero]) return CODIGOS_UF[numero]
  return String(valor).trim().toUpperCase()
}

function codigoDaFeicao(propriedades) {
  if (props.nivel === 'uf') {
    return normalizarUf(primeiroValor(propriedades, CAMPOS_UF))
  }
  return primeiroValor(propriedades, CAMPOS_MUNICIPIO)
}

function ufDaFeicao(propriedades) {
  return normalizarUf(primeiroValor(propriedades, CAMPOS_UF))
}

function nomeDaFeicao(propriedades, codigo) {
  const area = areaPorCodigo(indiceAreas.value, codigo, props.nivel)
  if (props.nivel === 'municipio') {
    if (area?.nm_municipio) return area.nm_municipio
    const doGeo = primeiroValor(propriedades, CAMPOS_NOME)
    if (doGeo) return doGeo
    return codigo
  }
  return primeiroValor(propriedades, CAMPOS_NOME) ?? codigo
}

function arquivoMalha(nivel) {
  return nivel === 'uf' ? 'br-uf.geojson' : 'br-municipios.geojson'
}

async function carregarMalha(nivel) {
  const token = ++tokenMalha
  if (cacheMalhas.has(nivel)) {
    malha.value = cacheMalhas.get(nivel)
    malhaEstado.value = 'ok'
    malhaMensagem.value = ''
    return
  }

  malhaEstado.value = 'carregando'
  malhaMensagem.value = ''
  try {
    const resposta = await fetch(
      `${import.meta.env.BASE_URL}geo/${arquivoMalha(nivel)}`,
    )
    const tipo = resposta.headers?.get?.('content-type') ?? ''
    if (!resposta.ok) {
      throw new Error(
        `Arquivo /geo/${arquivoMalha(nivel)} não encontrado (HTTP ${resposta.status}).`,
      )
    }
    if (tipo && !tipo.includes('json')) {
      throw new Error(
        `O caminho /geo/${arquivoMalha(nivel)} não devolveu um GeoJSON.`,
      )
    }
    const dados = await resposta.json()
    if (!Array.isArray(dados?.features) || dados.features.length === 0) {
      throw new Error(`O arquivo /geo/${arquivoMalha(nivel)} não contém feições.`)
    }
    if (token !== tokenMalha) return
    cacheMalhas.set(nivel, dados)
    malha.value = dados
    malhaEstado.value = 'ok'
  } catch (erro) {
    if (token !== tokenMalha) return
    malha.value = null
    malhaEstado.value = 'ausente'
    malhaMensagem.value =
      erro instanceof Error
        ? erro.message
        : `Não foi possível carregar /geo/${arquivoMalha(nivel)}.`
  }
}

function featuresVisiveis() {
  const features = malha.value?.features ?? []
  if (props.nivel !== 'municipio' || !props.uf) return features
  const filtradas = features.filter(
    (feature) =>
      String(ufDaFeicao(feature.properties) ?? '').toUpperCase() ===
      String(props.uf).toUpperCase(),
  )
  return filtradas.length > 0 ? filtradas : features
}

function prepararFeatures() {
  return featuresVisiveis().map((feature) => {
    const propriedades = feature.properties ?? {}
    const codigo = codigoDaFeicao(propriedades)
    const area = areaPorCodigo(indiceAreas.value, codigo, props.nivel)
    return {
      ...feature,
      properties: {
        ...propriedades,
        _key: codigo === null ? '' : normalizarCodigo(codigo),
        _rotulo: String(nomeDaFeicao(propriedades, codigo ?? '')),
        _cor: corDaArea(
          area,
          props.modo,
          props.candidato,
          partidoPorNumero.value,
        ),
      },
    }
  })
}

function dadosGeoJSON() {
  return { type: 'FeatureCollection', features: prepararFeatures() }
}

function atualizarFonte() {
  if (!mapa.value || !malha.value) return
  if (!mapaPronto.value) {
    if (!mapa.value.isStyleLoaded?.()) return
    mapaPronto.value = true
  }
  try {
    const dados = dadosGeoJSON()
    feicoesNaMalha.value = dados.features.length
    const fonte = mapa.value.getSource('areas')
    if (fonte) {
      fonte.setData(dados)
      return
    }
    mapa.value.addSource('areas', { type: 'geojson', data: dados })
    mapa.value.addLayer({
      id: 'areas-fill',
      type: 'fill',
      source: 'areas',
      paint: {
        'fill-color': ['get', '_cor'],
        'fill-opacity': 0.88,
      },
    })
    mapa.value.addLayer({
      id: 'areas-line',
      type: 'line',
      source: 'areas',
      paint: {
        'line-color': '#3a4a34',
        'line-width': 1,
      },
    })
  } catch (erro) {
    malhaMensagem.value =
      erro instanceof Error ? erro.message : 'Falha ao preparar a malha.'
  }
}

function coletarCoordenadas(geometria, destino) {
  if (!geometria) return
  const { type, coordinates, geometries } = geometria
  if (type === 'GeometryCollection') {
    for (const filha of geometries ?? []) coletarCoordenadas(filha, destino)
    return
  }
  if (type === 'Point') {
    destino.push(coordinates)
    return
  }
  if (type === 'MultiPoint' || type === 'LineString') {
    for (const coordenada of coordinates ?? []) destino.push(coordenada)
    return
  }
  if (type === 'MultiLineString' || type === 'Polygon') {
    for (const anel of coordinates ?? []) {
      for (const coordenada of anel) destino.push(coordenada)
    }
    return
  }
  if (type === 'MultiPolygon') {
    for (const poligono of coordinates ?? []) {
      for (const anel of poligono) {
        for (const coordenada of anel) destino.push(coordenada)
      }
    }
  }
}

function ajustarVisao() {
  if (!mapa.value || !malha.value) return
  const coordenadas = []
  for (const feature of featuresVisiveis()) {
    coletarCoordenadas(feature.geometry, coordenadas)
  }
  if (coordenadas.length === 0) return
  const limites = new LngLatBounds()
  for (const [longitude, latitude] of coordenadas) {
    limites.extend([longitude, latitude])
  }
  mapa.value.fitBounds(limites, {
    padding: props.nivel === 'uf' ? 24 : 16,
    duration: 0,
    maxZoom: props.nivel === 'uf' ? 4.2 : 7,
  })
}

function criarMapa() {
  if (!container.value || mapa.value) return
  mapa.value = new MapaLibre({
    container: container.value,
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'fundo',
          type: 'background',
          paint: { 'background-color': '#162014' },
        },
      ],
    },
    center: [-52, -15],
    zoom: 3.1,
    minZoom: 2.4,
    maxZoom: 9,
    renderWorldCopies: false,
    dragRotate: false,
    touchPitch: false,
    attributionControl: false,
  })
  mapa.value.addControl(
    new NavigationControl({ showCompass: false }),
    'top-right',
  )
  mapa.value.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')
  mapa.value.on('load', () => {
    mapaPronto.value = true
    atualizarFonte()
    ajustarVisao()
  })
  mapa.value.on('idle', () => {
    if (mapa.value && !mapa.value.getSource('areas')) atualizarFonte()
  })
  mapa.value.on('mousemove', aoMover)
  mapa.value.on('mouseleave', esconderTooltip)
  mapa.value.on('click', aoClicar)
  mapa.value.on('error', (evento) => {
    malhaMensagem.value =
      evento?.error?.message ?? 'Falha ao desenhar o mapa.'
  })
}

function areaDaFeicao(feature) {
  return areaPorCodigo(
    indiceAreas.value,
    feature?.properties?._key,
    props.nivel,
  )
}

function linhasTooltip(area, feature) {
  const linhas = []
  if (!area) {
    linhas.push({ rotulo: 'Situação', valor: 'Sem dados no corte atual' })
    return linhas
  }
  linhas.push({
    rotulo: 'Votos',
    valor: formatarNumero(area.total_votos),
  })
  linhas.push({
    rotulo: 'Válidos',
    valor: formatarNumero(area.votos_validos),
  })
  if (area.lider) {
    const candidato = partidoPorNumero.value.get(area.lider.nr_votavel)
    linhas.push({
      rotulo: 'Líder',
      valor: `${candidato?.nm_votavel ?? `Candidato ${area.lider.nr_votavel}`} (${candidato?.sg_partido ?? '—'}) · ${formatarPercentual(area.lider.percentual)}`,
    })
  } else {
    linhas.push({ rotulo: 'Líder', valor: 'Sem líder identificado' })
  }
  const candidatoArea = candidatoDaArea(area, props.candidato)
  if (props.candidato && candidatoArea) {
    linhas.push({
      rotulo: candidatoSelecionado.value?.nm_votavel ?? 'Candidato',
      valor: `${formatarNumero(candidatoArea.qt_votos)} · ${formatarPercentual(candidatoArea.percentual)}`,
    })
  }
  if (feature?.properties?._rotulo) {
    linhas.push({ rotulo: 'Código', valor: String(feature.properties._key || '—') })
  }
  return linhas
}

function aoMover(evento) {
  if (!mapa.value || !mapa.value.getLayer('areas-fill')) return
  const encontrados = mapa.value.queryRenderedFeatures(evento.point, {
    layers: ['areas-fill'],
  })
  if (encontrados.length === 0) {
    esconderTooltip()
    return
  }
  const feature = encontrados[0]
  const area = areaDaFeicao(feature)
  const codigo = feature.properties?._key || ''
  const rotulo = area?.nm_municipio || feature.properties?._rotulo
  const titulo =
    rotulo && rotulo !== codigo
      ? `${rotulo} · ${codigo}`
      : area?.nm_municipio || `${rotuloNivel.value} ${codigo}`
  tooltip.visivel = true
  tooltip.x = evento.point.x
  tooltip.y = evento.point.y
  tooltip.titulo = titulo
  tooltip.linhas = linhasTooltip(area, feature)
  mapa.value.getCanvas().style.cursor = area ? 'pointer' : 'default'
}

function esconderTooltip() {
  tooltip.visivel = false
  if (mapa.value) mapa.value.getCanvas().style.cursor = 'default'
}

function aoClicar(evento) {
  if (!mapa.value || !mapa.value.getLayer('areas-fill')) return
  const encontrados = mapa.value.queryRenderedFeatures(evento.point, {
    layers: ['areas-fill'],
  })
  if (encontrados.length === 0) return
  const area = areaDaFeicao(encontrados[0])
  if (!area) return
  if (props.nivel === 'uf') {
    emit('select', { tipo: 'uf', valor: area.sg_uf })
  } else {
    emit('select', {
      tipo: 'municipio',
      valor: area.cd_municipio_tse,
      uf: props.uf,
    })
  }
}

async function tentarMalhaNovamente() {
  cacheMalhas.delete(props.nivel)
  await carregarMalha(props.nivel)
  atualizarFonte()
  ajustarVisao()
  mapa.value?.resize()
}

const legenda = computed(() => {
  if (props.modo === 'percentual') {
    return {
      titulo: candidatoSelecionado.value
        ? `Participação de ${candidatoSelecionado.value.nm_votavel}`
        : 'Participação do líder',
      itens: FAIXAS_PERCENTUAL.map((faixa) => ({
        rotulo: faixa.rotulo,
        cor: faixa.cor,
        texto: corTextoContraste(faixa.cor),
      })),
    }
  }

  const porPartido = new Map()
  for (const area of props.areas) {
    if (!area.lider) continue
    const candidato = partidoPorNumero.value.get(area.lider.nr_votavel)
    const sigla = candidato?.sg_partido ?? 'Sem partido'
    const atual = porPartido.get(sigla) ?? {
      sigla,
      cor: corPartido(candidato?.sg_partido),
      total: 0,
    }
    atual.total += 1
    porPartido.set(sigla, atual)
  }
  return {
    titulo: 'Líder por área',
    itens: [...porPartido.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        rotulo: `${item.sigla} (${item.total})`,
        cor: item.cor,
        texto: corTextoContraste(item.cor),
      })),
  }
})

watch(
  () => props.nivel,
  async (nivel) => {
    await carregarMalha(nivel)
    atualizarFonte()
    ajustarVisao()
    mapa.value?.resize()
  },
)

watch(
  [
    () => props.areas,
    () => props.candidatos,
    () => props.modo,
    () => props.candidato,
    () => props.uf,
  ],
  () => {
    atualizarFonte()
    if (props.nivel === 'municipio') ajustarVisao()
  },
  { deep: true },
)

watch(malhaEstado, async (estado) => {
  if (estado !== 'ok') return
  await nextTick()
  criarMapa()
  mapa.value?.resize()
  atualizarFonte()
  ajustarVisao()
})

onMounted(async () => {
  await carregarMalha(props.nivel)
  await nextTick()
  criarMapa()
  mapa.value?.resize()
  atualizarFonte()
  ajustarVisao()
})

onBeforeUnmount(() => {
  tokenMalha += 1
  mapa.value?.remove()
  mapa.value = null
})
</script>

<template>
  <section class="card mapa-card" aria-labelledby="mapa-titulo">
    <div class="card__cabecalho mapa-card__cabecalho">
      <div>
        <h2 id="mapa-titulo">Mapa</h2>
        <p>Malha IBGE local.</p>
      </div>
      <div class="mapa-controles">
        <div class="segmented" role="group" aria-label="Nível do mapa">
          <button
            type="button"
            :aria-pressed="nivel === 'uf'"
            :class="{ ativo: nivel === 'uf' }"
            @click="$emit('update:level', 'uf')"
          >
            UF
          </button>
          <button
            type="button"
            :aria-pressed="nivel === 'municipio'"
            :class="{ ativo: nivel === 'municipio' }"
            :disabled="!uf"
            :title="!uf ? 'Selecione uma UF para ver municípios' : undefined"
            @click="$emit('update:level', 'municipio')"
          >
            Municípios
          </button>
        </div>
        <div class="segmented" role="group" aria-label="Modo de cor do mapa">
          <button
            type="button"
            :aria-pressed="modo === 'lider'"
            :class="{ ativo: modo === 'lider' }"
            @click="$emit('update:mode', 'lider')"
          >
            Líder
          </button>
          <button
            type="button"
            :aria-pressed="modo === 'percentual'"
            :class="{ ativo: modo === 'percentual' }"
            @click="$emit('update:mode', 'percentual')"
          >
            Percentual
          </button>
        </div>
      </div>
    </div>

    <StateBlock
      v-if="error"
      estado="erro"
      titulo="Não foi possível carregar o mapa"
      :descricao="error"
      acao="Tentar novamente"
      @acao="$emit('retry')"
    />

    <div v-if="loading && !error" class="mapa-status" role="status">
      Carregando dados do mapa…
    </div>

    <StateBlock
      v-if="malhaEstado === 'carregando'"
      estado="carregando"
      titulo="Carregando malha"
      :descricao="`Lendo /geo/${arquivoMalha(nivel)}.`"
    />

    <div v-if="malhaEstado === 'ausente'" class="mapa-ausente">
      <StateBlock
        estado="vazio"
        titulo="Malha não carregada"
        :descricao="`${malhaMensagem} Adicione o arquivo em frontend/public/geo/${arquivoMalha(nivel)}.`"
        acao="Tentar novamente"
        @acao="tentarMalhaNovamente"
      />
      <p>
        Nenhuma geografia foi inventada. A tabela alternativa abaixo continua
        disponível com os dados da API.
      </p>
    </div>

    <div
      v-show="malhaEstado === 'ok'"
      class="mapa-wrap"
      :style="{ height: altura }"
    >
      <div
        ref="container"
        class="mapa"
        role="img"
        :aria-label="`Mapa por ${rotuloNivel.toLowerCase()} com ${areas.length} áreas`"
      ></div>
      <div
        v-if="tooltip.visivel"
        class="mapa-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
        aria-hidden="true"
      >
        <strong>{{ tooltip.titulo }}</strong>
        <dl>
          <div v-for="linha in tooltip.linhas" :key="linha.rotulo">
            <dt>{{ linha.rotulo }}</dt>
            <dd>{{ linha.valor }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <p v-if="malhaMensagem && malhaEstado === 'ok'" class="mapa-erro" role="alert">
      {{ malhaMensagem }}
    </p>

    <div class="legenda" role="group" aria-label="Legenda do mapa">
      <strong>{{ legenda.titulo }}</strong>
      <span class="legenda__meta">{{ feicoesNaMalha }} feições</span>
      <ul>
        <li v-for="item in legenda.itens" :key="item.rotulo">
          <span
            class="legenda__cor"
            :style="{ backgroundColor: item.cor }"
            aria-hidden="true"
          ></span>
          {{ item.rotulo }}
        </li>
        <li>
          <span
            class="legenda__cor"
            :style="{ backgroundColor: COR_SEM_DADOS }"
            aria-hidden="true"
          ></span>
          Sem dados
        </li>
      </ul>
      <p v-if="legenda.itens.length === 0">Sem líder identificado no corte atual.</p>
    </div>

    <MapTable
      :areas="areas"
      :nivel="nivel"
      :modo="modo"
      :candidato="candidato"
      :candidatos="candidatos"
      :uf="uf"
      @select="$emit('select', $event)"
    />
  </section>
</template>
