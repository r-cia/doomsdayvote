<script setup>
import { ref, watch } from 'vue'
import SecaoView from './SecaoView.vue'
import { api } from '../api/client'
import { useOrdenacao } from '../composables/ordenacao'
import { useAnalise } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'

const secaoModalId = ref(null)

const { store } = useSelecaoEleicao()
const ordemUf = useOrdenacao('biometria_uf')
const ordemMunicipios = useOrdenacao()
const ordemSecoes = useOrdenacao()
const analiseQuery = useAnalise(ordemUf.params)

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)

async function carregarMunicipios(uf) {
  ufSelecionada.value = uf
  municipioSelecionado.value = null
  secoes.value = []
  carregandoMunicipios.value = true
  try {
    const r = await api.biometriaMunicipios({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf,
      ...ordemMunicipios.params.value,
    })
    municipios.value = r.municipios ?? []
  } catch (e) {
    municipios.value = []
  } finally {
    carregandoMunicipios.value = false
  }
}

async function carregarSecoes(municipio) {
  municipioSelecionado.value = municipio
  carregandoSecoes.value = true
  try {
    const r = await api.biometriaSecoes({
      election_id: store.electionId,
      cargo: store.cargo,
      as_of: store.asOf,
      uf: ufSelecionada.value,
      municipio,
      ...ordemSecoes.params.value,
    })
    secoes.value = r.secoes ?? []
  } catch (e) {
    secoes.value = []
  } finally {
    carregandoSecoes.value = false
  }
}

watch(ordemMunicipios.params, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordemSecoes.params, () => {
  if (municipioSelecionado.value) carregarSecoes(municipioSelecionado.value)
})

function nomeMunicipio(m) {
  return m.nm_municipio ?? `Município ${m.cd_municipio_tse}`
}

function abrirSecao(item) {
  secaoModalId.value = item.id
}
</script>

<template>
  <BiometriaUfPanel
    :dados="analiseQuery.data.value?.biometria_uf ?? []"
    :loading="analiseQuery.isLoading.value"
    :ordenacao="ordemUf"
    @select="carregarMunicipios"
  />

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>Municípios com maior biometria não habilitada</h2>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">{{ $t('comum.cliqueEstado') }}</div>
      <div v-else-if="carregandoMunicipios" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="municipios.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemMunicipios.ariaSort('nm_municipio')"><button type="button" @click="ordemMunicipios.alternar('nm_municipio')">Município{{ ordemMunicipios.seta('nm_municipio') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('qt_nao_habilitada')"><button type="button" @click="ordemMunicipios.alternar('qt_nao_habilitada')">Não habilitada{{ ordemMunicipios.seta('qt_nao_habilitada') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemMunicipios.ariaSort('percentual_nao_habilitada')"><button type="button" @click="ordemMunicipios.alternar('percentual_nao_habilitada')">%{{ ordemMunicipios.seta('percentual_nao_habilitada') }}</button></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in municipios"
              :key="m.cd_municipio_tse"
              class="linha-clicavel"
              @click="carregarSecoes(m.cd_municipio_tse)"
            >
              <td>{{ nomeMunicipio(m) }}</td>
              <td class="num">{{ formatarNumero(m.qt_nao_habilitada) }}</td>
              <td class="num">{{ formatarPercentual(m.percentual_nao_habilitada) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card__cabecalho">
        <h2>Seções com maior % não habilitada</h2>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ nomeMunicipio(municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}) }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">{{ $t('comum.cliqueMunicipio') || 'Clique em um município.' }}</div>
      <div v-else-if="carregandoSecoes" class="vazio">{{ $t('comum.carregando') }}</div>
      <div v-else-if="secoes.length === 0" class="vazio">{{ $t('comum.semDados') }}</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_zona')"><button type="button" @click="ordemSecoes.alternar('nr_zona')">Zona{{ ordemSecoes.seta('nr_zona') }}</button></th>
              <th scope="col" class="ordenavel" :aria-sort="ordemSecoes.ariaSort('nr_secao')"><button type="button" @click="ordemSecoes.alternar('nr_secao')">Seção{{ ordemSecoes.seta('nr_secao') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('qt_nao_habilitada')"><button type="button" @click="ordemSecoes.alternar('qt_nao_habilitada')">Não habilitada{{ ordemSecoes.seta('qt_nao_habilitada') }}</button></th>
              <th scope="col" class="num ordenavel" :aria-sort="ordemSecoes.ariaSort('percentual_nao_habilitada')"><button type="button" @click="ordemSecoes.alternar('percentual_nao_habilitada')">%{{ ordemSecoes.seta('percentual_nao_habilitada') }}</button></th>
              <th scope="col"><span class="sr-only">{{ $t('comum.detalhe') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ formatarNumero(s.qt_nao_habilitada) }}</td>
              <td class="num">{{ formatarPercentual(s.percentual_nao_habilitada) }}</td>
              <td>
                <button
                  type="button"
                  class="button button--ghost button--compacto"
                  @click="abrirSecao(s)"
                >
                  {{ $t('comum.detalhe') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <SecaoView
    v-if="secaoModalId"
    :modal="true"
    :id-prop="secaoModalId"
    :election-id-prop="store.electionId"
    :cargo-prop="store.cargo"
    :as-of-prop="store.asOf ?? ''"
    :uf-prop="ufSelecionada ?? ''"
    :municipio-prop="municipioSelecionado ?? ''"
    @close="secaoModalId = null"
  />
</template>
