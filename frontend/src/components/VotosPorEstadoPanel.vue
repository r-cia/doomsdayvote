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
        <p class="painel__etiqueta">{{ $t('votosEstado.etiqueta') }}</p>
        <h2 id="votos-estado-titulo">{{ $t('votosEstado.titulo') }}</h2>
      </div>
    </header>

    <div v-if="ufs.length === 0 || listaCandidatos.length === 0" class="vazio">
      {{ $t('votosEstado.semDados') }}
    </div>

    <div v-else class="tabela-scroll">
      <table
        class="tabela-votos-estado tabela-fixa"
        :style="{ width: `calc(24rem + ${ufs.length * 6}rem)`, minWidth: '100%' }"
      >
        <colgroup>
          <col style="width: 16rem" />
          <col v-for="area in ufs" :key="area.sg_uf" style="width: 6rem" />
          <col style="width: 8rem" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{{ $t('comum.candidato') }}</th>
            <th v-for="area in ufs" :key="area.sg_uf" scope="col" class="num">
              {{ area.sg_uf }}
            </th>
            <th scope="col" class="num">{{ $t('placar.total') }}</th>
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
    </div>
  </section>
</template>
