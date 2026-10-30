<script setup>
import { ref, watch } from 'vue'
import { api } from '../api/client'
import { useAnalise } from '../composables/queries'
import { useSelecaoEleicao } from '../composables/selecao'
import { formatarNumero, formatarPercentual } from '../lib/format'
import BiometriaUfPanel from '../components/BiometriaUfPanel.vue'

const { store } = useSelecaoEleicao()
const analiseQuery = useAnalise()

const ufSelecionada = ref(null)
const municipioSelecionado = ref(null)
const municipios = ref([])
const secoes = ref([])
const carregandoMunicipios = ref(false)
const carregandoSecoes = ref(false)
const ordenarMunicipios = ref('nao_habilitada')
const ordenarSecoes = ref('percentual')

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
      ordenar_por: ordenarMunicipios.value,
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
      ordenar_por: ordenarSecoes.value,
    })
    secoes.value = r.secoes ?? []
  } catch (e) {
    secoes.value = []
  } finally {
    carregandoSecoes.value = false
  }
}

watch(ordenarMunicipios, () => {
  if (ufSelecionada.value) carregarMunicipios(ufSelecionada.value)
})
watch(ordenarSecoes, () => {
  if (municipioSelecionado.value) carregarSecoes(municipioSelecionado.value)
})

function nomeMunicipio(m) {
  return m.nm_municipio ?? `Município ${m.cd_municipio_tse}`
}
</script>

<template>
  <BiometriaUfPanel
    :dados="analiseQuery.data.value?.biometria_uf ?? []"
    @select="carregarMunicipios"
  />

  <div class="mesa">
    <div class="card">
      <div class="card__cabecalho">
        <h2>Municípios com maior biometria não habilitada</h2>
        <div class="uf-painel__acoes">
          <select v-if="ufSelecionada" v-model="ordenarMunicipios" class="uf-ordenacao">
            <option value="nao_habilitada">Não habilitada</option>
            <option value="percentual">% não habilitada</option>
            <option value="comparecimento">Comparecimento</option>
          </select>
        </div>
        <p v-if="ufSelecionada" class="card__meta">{{ ufSelecionada }}</p>
      </div>
      <div v-if="!ufSelecionada" class="vazio">Clique em um estado na tabela acima.</div>
      <div v-else-if="carregandoMunicipios" class="vazio">Carregando…</div>
      <div v-else-if="municipios.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Município</th>
              <th scope="col" class="num">Não habilitada</th>
              <th scope="col" class="num">%</th>
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
        <div class="uf-painel__acoes">
          <select v-if="municipioSelecionado" v-model="ordenarSecoes" class="uf-ordenacao">
            <option value="percentual">% não habilitada</option>
            <option value="nao_habilitada">Não habilitada</option>
            <option value="comparecimento">Comparecimento</option>
          </select>
        </div>
        <p v-if="municipioSelecionado" class="card__meta">
          {{ nomeMunicipio(municipios.find((m) => m.cd_municipio_tse === municipioSelecionado) || {}) }}
        </p>
      </div>
      <div v-if="!municipioSelecionado" class="vazio">Clique em um município.</div>
      <div v-else-if="carregandoSecoes" class="vazio">Carregando…</div>
      <div v-else-if="secoes.length === 0" class="vazio">Sem dados.</div>
      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Zona</th>
              <th scope="col">Seção</th>
              <th scope="col" class="num">Não habilitada</th>
              <th scope="col" class="num">%</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in secoes" :key="s.id">
              <td>{{ s.nr_zona }}</td>
              <td>{{ s.nr_secao }}</td>
              <td class="num">{{ formatarNumero(s.qt_nao_habilitada) }}</td>
              <td class="num">{{ formatarPercentual(s.percentual_nao_habilitada) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>