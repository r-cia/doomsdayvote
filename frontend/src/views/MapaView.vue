<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AvisoBanner from '../components/AvisoBanner.vue'
import MapPanel from '../components/MapPanel.vue'
import SectionsTable from '../components/SectionsTable.vue'
import UfPanel from '../components/UfPanel.vue'
import { useMapa, useResumo, useSecoes } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { candidatosNominais } from '../lib/agregacoes'

const router = useRouter()
const { store } = useSelecaoEleicao()

const resumoQuery = useResumo()
const mapaQuery = useMapa()
const mapaUfQuery = useMapa('uf', {
  ignorarMunicipio: true,
  ignorarUf: true,
})
const secoesQuery = useSecoes()

const candidatos = computed(() =>
  candidatosNominais(resumoQuery.data.value?.votos ?? []),
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

function abrirSecao(item) {
  router.push({
    name: 'secao',
    params: { id: item.id },
    query: {
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf ?? undefined,
      uf: store.uf ?? undefined,
      municipio: store.municipio ?? undefined,
    },
  })
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

  <section class="malha" aria-label="Mapa e leitura por UF">
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
</template>
