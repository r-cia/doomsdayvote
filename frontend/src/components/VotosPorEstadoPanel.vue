<script setup>
import { computed } from 'vue'
import TabelaScroll from './TabelaScroll.vue'
import { formatarNumero } from '../lib/format'
import { nominaisNaOrdemDoServidor } from '../lib/agregacoes'
import { useOrdenacao } from '../composables/ordenacao'
import StateBlock from './StateBlock.vue'

const props = defineProps({
  areas: { type: Array, default: () => [] },
  candidatos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  atualizando: { type: Boolean, default: false },
  ordenacao: { type: Object, default: () => useOrdenacao() },
})

const { alternar, ariaSort, seta } = props.ordenacao

const listaCandidatos = computed(() => nominaisNaOrdemDoServidor(props.candidatos))

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

function delta(area, nrVotavel) {
  const linha = (area.candidatos ?? []).find(
    (c) => Number(c.nr_votavel) === Number(nrVotavel),
  )
  const d = Number(linha?.qt_votos_delta ?? 0)
  return d < 0 ? 0 : d
}

function deltaTotal(nrVotavel) {
  return ufs.value.reduce((t, area) => t + delta(area, nrVotavel), 0)
}

</script>

<template>
  <section class="painel" aria-labelledby="votos-estado-titulo">
    <header class="painel__cabecalho">
      <div>
        <p class="painel__etiqueta">{{ $t('mapa.votosPorEstado') }}</p>
        <h2 id="votos-estado-titulo">{{ $t('mapa.votosPorEstado') }}</h2>
      </div>
    </header>

    <StateBlock v-if="loading && (ufs.length === 0 || listaCandidatos.length === 0)" estado="carregando" :titulo="$t('comum.carregando')" />
    <div v-else-if="ufs.length === 0 || listaCandidatos.length === 0" class="vazio">
      {{ $t('mapa.semDadosEstado') }}
    </div>

    <TabelaScroll v-else :atualizando="atualizando">
      <table class="tabela-votos-estado">
        <thead>
          <tr>
            <th scope="col" class="ordenavel" :aria-sort="ariaSort('nm_votavel')"><button type="button" @click="alternar('nm_votavel')">{{ $t('filtros.candidato') }}{{ seta('nm_votavel') }}</button></th>
            <th v-for="area in ufs" :key="area.sg_uf" scope="col" class="num">
              {{ area.sg_uf }}
            </th>
            <th scope="col" class="num ordenavel" :aria-sort="ariaSort('qt_votos')"><button type="button" @click="alternar('qt_votos')">Total{{ seta('qt_votos') }}</button></th>
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
              <div>{{ formatarNumero(votosPorCandidato(area, candidato.nr_votavel)) }}</div>
              <small v-if="delta(area, candidato.nr_votavel) !== 0" class="delta">
                {{ delta(area, candidato.nr_votavel) > 0 ? '+' : '' }}{{ formatarNumero(delta(area, candidato.nr_votavel)) }}
              </small>
            </td>
            <td class="num">
              <strong>{{ formatarNumero(totalPorCandidato(candidato.nr_votavel)) }}</strong>
              <small v-if="deltaTotal(candidato.nr_votavel) !== 0" class="delta">
                {{ deltaTotal(candidato.nr_votavel) > 0 ? '+' : '' }}{{ formatarNumero(deltaTotal(candidato.nr_votavel)) }}
              </small>
            </td>
          </tr>
        </tbody>
      </table>
    </TabelaScroll>
  </section>
</template>
