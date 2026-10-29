<script setup>
import { computed } from 'vue'
import { formatarNumero } from '../lib/format'
import { candidatosNominais } from '../lib/agregacoes'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
})

const listaCandidatos = computed(() => candidatosNominais(props.candidatos))
const ufs = computed(() =>
  [...(props.areas ?? [])]
    .filter((area) => area.sg_uf)
    .sort((a, b) => a.sg_uf.localeCompare(b.sg_uf)),
)

function votosPorCandidato(area, nrVotavel) {
  const linha = (area.candidatos ?? []).find(
    (c) => Number(c.nr_votavel) === Number(nrVotavel),
  )
  return linha ? Number(linha.qt_votos ?? 0) : 0
}

function totalPorCandidato(nrVotavel) {
  return ufs.value.reduce((total, area) => total + votosPorCandidato(area, nrVotavel), 0)
}
</script>

<template>
  <section class="painel" aria-labelledby="votos-estado-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">Distribuição</p>
        <h2 id="votos-estado-titulo">Votos por estado</h2>
      </div>
    </header>

    <div v-if="ufs.length === 0 || listaCandidatos.length === 0" class="vazio">
      Sem dados por estado para o corte atual.
    </div>

    <div v-else class="tabela-scroll">
      <table class="tabela-votos-estado">
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th v-for="area in ufs" :key="area.sg_uf" scope="col" class="num">
              {{ area.sg_uf }}
            </th>
            <th scope="col" class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidato in listaCandidatos" :key="candidato.nr_votavel">
            <th scope="row">
              <div class="votos-estado-candidato">
                <strong>{{ candidato.nm_votavel }}</strong>
                <small>{{ candidato.sg_partido }} {{ candidato.nr_votavel }}</small>
              </div>
            </th>
            <td v-for="area in ufs" :key="area.sg_uf" class="num">
              {{ formatarNumero(votosPorCandidato(area, candidato.nr_votavel)) }}
            </td>
            <td class="num"><strong>{{ formatarNumero(totalPorCandidato(candidato.nr_votavel)) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
