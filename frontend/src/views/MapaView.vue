<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AvisoBanner from '../components/AvisoBanner.vue'
import MapPanel from '../components/MapPanel.vue'
import SectionsTable from '../components/SectionsTable.vue'
import SecaoView from '../views/SecaoView.vue'
import UfPanel from '../components/UfPanel.vue'
import { useMapa, useResumo, useSecoes } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { candidatosNominais } from '../lib/agregacoes'

const router = useRouter()
const { store } = useSelecaoEleicao()

const resumoQuery = useResumo()
const mapaQuery = useMapa()
const candidatos = computed(() =>
  candidatosNominais(resumoQuery.data.value?.votos ?? []),
)
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
  incluirTodosCandidatos: true,
  candidatos: computed(() => {
    const lista = candidatos.value
      .map((c) => c.nr_votavel)
      .filter((n) => n !== null && n !== undefined)
    return lista.join(',')
  }),
})
const secoesQuery = useSecoes()

watch(
  () => store.asOf,
  () => {
    resumoQuery.refetch()
    mapaQuery.refetch()
    mapaUfQuery.refetch()
    secoesQuery.refetch()
  },
)

const avisos = computed(() => {
  const vistos = new Set()
  const lista = []
  for (const aviso of [
    ...(resumoQuery.data.value?.avisos ?? []),
    ...(mapaQuery.data.value?.avisos ?? []),
  ]) {
    if (vistos.has(aviso.codigo)) continue
    vistos.add(aviso.codigo)
    lista.push(aviso)
  }
  return lista
})

function selecionarNoMapa(selecao) {
  if (!selecao) return
  if (selecao.tipo === 'uf') {
    store.definirUf(selecao.valor)
    store.definirMunicipio(null)
    store.definirNivel('municipio')
    return
  }
  store.definirUf(selecao.uf)
  store.definirMunicipio(selecao.valor)
}

function selecionarUf(uf) {
  if (!uf) {
    store.definirUf(null)
    store.definirMunicipio(null)
    store.definirNivel('uf')
    return
  }
  store.definirUf(uf)
  store.definirMunicipio(null)
  store.definirNivel('municipio')
}

function limparParaBrasil() {
  store.definirUf(null)
  store.definirMunicipio(null)
  store.definirNivel('uf')
}

function verMunicipios(uf) {
  store.definirUf(uf)
  store.definirNivel('municipio')
  document.querySelector('.mapa-card')?.scrollIntoView({ block: 'start' })
}

const secaoModalId = ref(null)

function abrirSecao(item) {
  secaoModalId.value = item.id
}

function atualizarMapa() {
  mapaQuery.refetch()
  mapaUfQuery.refetch()
}

function atualizarSecoes() {
  secoesQuery.refetch()
}
</script>

<template>
  <AvisoBanner v-if="avisos.length > 0" :avisos="avisos" />

  <section class="malha" :aria-label="$t('mapa.malha')">
    <MapPanel
      :areas="mapaQuery.data.value?.areas ?? []"
      :nivel="store.mapLevel"
      :modo="store.mapMode"
      :candidato="store.candidato"
      :candidatos="candidatos"
      :uf="store.uf"
      :loading="mapaQuery.isLoading.value"
      :error="mapaQuery.error.value?.message ?? ''"
      altura="630px"
      @update:level="(nivel) => { if (nivel === 'uf') { store.definirUf(null); store.definirMunicipio(null); store.definirNivel('uf'); } else { store.definirNivel(nivel); } }"
      @update:mode="store.definirModo"
      @select="selecionarNoMapa"
      @retry="atualizarMapa"
    />

    <UfPanel
      :areas="mapaUfQuery.data.value?.areas ?? []"
      :candidatos="candidatos"
      :votos="resumoQuery.data.value?.votos ?? []"
      :loading="mapaUfQuery.isLoading.value"
      :error="mapaUfQuery.error.value?.message ?? ''"
      :uf-selecionada="store.uf"
      @select="selecionarUf"
      @municipios="verMunicipios"
      @retry="atualizarMapa"
      @limpar="limparParaBrasil"
    />
  </section>

  <SectionsTable
    v-if="store.municipio"
    :data="secoesQuery.data.value"
    :loading="secoesQuery.isLoading.value"
    :error="secoesQuery.error.value?.message ?? ''"
    :status="store.sectionStatus"
    :zona="store.sectionZona"
    :secao="store.sectionSecao"
    :municipio-nome="store.sectionMunicipioNome"
    :page-size="store.sectionPageSize"
    :uf="store.uf"
    :municipio="store.municipio"
    @update:page="store.definirPagina"
    @update:page-size="store.definirTamanhoPagina"
    @update:status="store.definirStatusSecao"
    @update:zona="store.definirZonaSecao"
    @update:secao="store.definirNumeroSecao"
    @update:municipio-nome="store.definirMunicipioSecao"
    @select="abrirSecao"
    @retry="atualizarSecoes"
  />

  <SecaoView
    v-if="secaoModalId"
    :modal="true"
    :id-prop="secaoModalId"
    :election-id-prop="store.electionId"
    :cargo-prop="store.cargo"
    :as-of-prop="store.asOf ?? ''"
    :uf-prop="store.uf ?? ''"
    :municipio-prop="store.municipio ?? ''"
    @close="secaoModalId = null"
  />
</template>
